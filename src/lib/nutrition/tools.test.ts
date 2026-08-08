// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createToolHarness, type ToolHarness } from "./tool-harness";

const TODAY = "2026-05-13";

/** A 400 cal / 30g / 40g / 12g restaurant meal, stated straight into the chat. */
const STATED_MEAL = {
  description: "chicken burrito",
  source: "stated",
  quantity: 1,
  unit: "serving",
  calories: 400,
  protein: 30,
  carbs: 40,
  fat: 12,
};

describe("nutrition tools", () => {
  let tools: ToolHarness;

  beforeEach(() => {
    tools = createToolHarness({ today: TODAY });
  });

  afterEach(() => {
    tools.dispose();
  });

  it("returns the created entry, with an id and today's date", async () => {
    const entry = await tools.logFoodEntry(STATED_MEAL);

    expect(entry.id).toEqual(expect.any(Number));
    expect(entry.date).toBe(TODAY);
    expect(entry.description).toBe("chicken burrito");
  });

  it("counts a logged entry towards the same day's totals", async () => {
    await tools.logFoodEntry(STATED_MEAL);

    const summary = await tools.getDailySummary({ date: TODAY });

    expect(summary.totals).toEqual({
      calories: 400,
      protein: 30,
      carbs: 40,
      fat: 12,
    });
  });

  it("summarises a day with no entries as zeros", async () => {
    const summary = await tools.getDailySummary({ date: TODAY });

    expect(summary).toEqual({
      date: TODAY,
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    });
  });

  it("keeps an entry out of another day's summary", async () => {
    await tools.logFoodEntry(STATED_MEAL);

    const yesterday = await tools.getDailySummary({ date: "2026-05-12" });
    const tomorrow = await tools.getDailySummary({ date: "2026-05-14" });

    expect(yesterday.totals.calories).toBe(0);
    expect(tomorrow.totals.calories).toBe(0);
  });

  it("multiplies a per-serving base by a fractional serving count", async () => {
    await tools.logFoodEntry({
      ...STATED_MEAL,
      description: "greek yogurt",
      source: "label",
      quantity: 1.5,
      calories: 120,
      protein: 10,
      carbs: 6,
      fat: 4,
    });

    const summary = await tools.getDailySummary({ date: TODAY });

    expect(summary.totals).toEqual({
      calories: 180,
      protein: 15,
      carbs: 9,
      fat: 6,
    });
  });

  it("scales a per-100g base by the grams consumed", async () => {
    await tools.logFoodEntry({
      ...STATED_MEAL,
      description: "kiwi",
      source: "usda",
      quantity: 200,
      unit: "g",
      calories: 61,
      protein: 1.1,
      carbs: 14.7,
      fat: 0.5,
    });

    const summary = await tools.getDailySummary({ date: TODAY });

    expect(summary.totals).toEqual({
      calories: 122,
      protein: 2.2,
      carbs: 29.4,
      fat: 1,
    });
  });

  it("accumulates entries from different sources across a day", async () => {
    await tools.logFoodEntry(STATED_MEAL);
    await tools.logFoodEntry({
      ...STATED_MEAL,
      description: "kiwi",
      source: "usda",
      quantity: 100,
      unit: "g",
      calories: 61,
      protein: 1,
      carbs: 15,
      fat: 0.5,
    });

    const summary = await tools.getDailySummary({ date: TODAY });

    expect(summary.totals).toEqual({
      calories: 461,
      protein: 31,
      carbs: 55,
      fat: 12.5,
    });
  });

  describe("input validation", () => {
    const rejects = async (input: Record<string, unknown>) => {
      await expect(tools.logFoodEntry(input)).rejects.toThrow();

      const summary = await tools.getDailySummary({ date: TODAY });
      expect(summary.totals.calories).toBe(0);
    };

    it("rejects a negative quantity", async () => {
      await rejects({ ...STATED_MEAL, quantity: -1 });
    });

    it("rejects a zero quantity", async () => {
      await rejects({ ...STATED_MEAL, quantity: 0 });
    });

    it("rejects an unknown unit", async () => {
      await rejects({ ...STATED_MEAL, unit: "ounces" });
    });

    it("rejects an unknown source", async () => {
      await rejects({ ...STATED_MEAL, source: "guessed" });
    });

    it("rejects a missing nutrient", async () => {
      const { fat: _fat, ...withoutFat } = STATED_MEAL;
      await rejects(withoutFat);
    });

    it("rejects a negative nutrient", async () => {
      await rejects({ ...STATED_MEAL, protein: -5 });
    });

    it("rejects a summary request for a malformed date", async () => {
      await expect(
        tools.getDailySummary({ date: "13th May" }),
      ).rejects.toThrow();
    });

    it("rejects a summary request for a day that does not exist", async () => {
      await expect(
        tools.getDailySummary({ date: "2026-13-45" }),
      ).rejects.toThrow();
    });
  });
});
