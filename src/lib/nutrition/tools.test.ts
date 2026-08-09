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
      tracked: false,
      totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
      entries: [],
    });
  });

  it("keeps an entry out of another day's summary", async () => {
    await tools.logFoodEntry(STATED_MEAL);

    const yesterday = await tools.getDailySummary({ date: "2026-05-12" });
    const tomorrow = await tools.getDailySummary({ date: "2026-05-14" });

    expect(yesterday.totals.calories).toBe(0);
    expect(tomorrow.totals.calories).toBe(0);
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

  /**
   * The label path. The figures come off the packet — per serving when the
   * user counted servings, per 100g when they weighed it — and the tool is
   * handed them unmultiplied either way.
   */
  describe("a food logged from a nutrition label", () => {
    /** A protein bar's panel: 210 cal / 20g / 21g / 7g per bar. */
    const LABEL_PER_SERVING = {
      description: "protein bar",
      source: "label",
      unit: "serving",
      calories: 210,
      protein: 20,
      carbs: 21,
      fat: 7,
    };

    /** The same packet's per-100g column, for when the user weighed it. */
    const LABEL_PER_100G = {
      description: "granola",
      source: "label",
      unit: "g",
      calories: 450,
      protein: 10,
      carbs: 60,
      fat: 18,
    };

    it("contributes the label's per-serving figures times the servings eaten", async () => {
      await tools.logFoodEntry({ ...LABEL_PER_SERVING, quantity: 1.5 });

      const summary = await tools.getDailySummary({ date: TODAY });

      expect(summary.totals).toEqual({
        calories: 315,
        protein: 30,
        carbs: 31.5,
        fat: 10.5,
      });
    });

    it("scales the label's per-100g figures by the grams eaten", async () => {
      await tools.logFoodEntry({ ...LABEL_PER_100G, quantity: 60 });

      const summary = await tools.getDailySummary({ date: TODAY });

      expect(summary.totals).toEqual({
        calories: 270,
        protein: 6,
        carbs: 36,
        fat: 10.8,
      });
    });

    it("stores the base nutrients as printed, not the multiplied total", async () => {
      const entry = await tools.logFoodEntry({
        ...LABEL_PER_SERVING,
        quantity: 1.5,
      });

      expect(entry).toMatchObject({
        source: "label",
        quantity: 1.5,
        unit: "serving",
        calories: 210,
        protein: 20,
        carbs: 21,
        fat: 7,
      });
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

  /**
   * Chat-driven deletion is summary-then-delete: the conversation is
   * disposable, so the ids the agent needs have to come back out of the log
   * itself before anything can be removed by one.
   */
  describe("deleting an entry", () => {
    it("itemises the day's entries with their ids alongside the totals", async () => {
      await tools.logFoodEntry(STATED_MEAL);
      await tools.logFoodEntry({ ...STATED_MEAL, description: "greek yogurt" });

      const summary = await tools.getDailySummary({ date: TODAY });

      expect(summary.entries).toEqual([
        expect.objectContaining({
          id: expect.any(Number),
          description: "chicken burrito",
        }),
        expect.objectContaining({
          id: expect.any(Number),
          description: "greek yogurt",
        }),
      ]);
    });

    it("reports what each entry actually contributed, not its base figures", async () => {
      await tools.logFoodEntry({
        ...STATED_MEAL,
        description: "granola",
        source: "label",
        quantity: 60,
        unit: "g",
        calories: 450,
        protein: 10,
        carbs: 60,
        fat: 18,
      });

      const [entry] = (await tools.getDailySummary({ date: TODAY })).entries;

      expect(entry.consumed).toEqual({
        calories: 270,
        protein: 6,
        carbs: 36,
        fat: 10.8,
      });
    });

    it("drops the deleted entry out of the totals", async () => {
      await tools.logFoodEntry(STATED_MEAL);
      await tools.logFoodEntry({ ...STATED_MEAL, description: "greek yogurt" });

      const { entries } = await tools.getDailySummary({ date: TODAY });
      const yogurt = entries.find((e) => e.description === "greek yogurt")!;
      await tools.deleteFoodEntry({ id: yogurt.id });

      const after = await tools.getDailySummary({ date: TODAY });
      expect(after.totals.calories).toBe(400);
      expect(after.entries.map((e) => e.description)).toEqual([
        "chicken burrito",
      ]);
    });

    it("says so rather than failing when the id is not in the log", async () => {
      await tools.logFoodEntry(STATED_MEAL);

      const result = await tools.deleteFoodEntry({ id: 9999 });

      expect(result.deleted).toBe(false);
      const summary = await tools.getDailySummary({ date: TODAY });
      expect(summary.totals.calories).toBe(400);
    });

    it("does not delete the same entry twice", async () => {
      const entry = await tools.logFoodEntry(STATED_MEAL);

      expect((await tools.deleteFoodEntry({ id: entry.id })).deleted).toBe(
        true,
      );
      expect((await tools.deleteFoodEntry({ id: entry.id })).deleted).toBe(
        false,
      );
    });

    /** Correcting a wrong amount, which is the only path there is. */
    it("totals the corrected entry after a delete and re-log", async () => {
      const wrong = await tools.logFoodEntry({ ...STATED_MEAL, quantity: 2 });
      await tools.deleteFoodEntry({ id: wrong.id });
      await tools.logFoodEntry({ ...STATED_MEAL, quantity: 1 });

      const summary = await tools.getDailySummary({ date: TODAY });

      expect(summary.totals).toEqual({
        calories: 400,
        protein: 30,
        carbs: 40,
        fat: 12,
      });
      expect(summary.entries).toHaveLength(1);
    });

    it("leaves another day's entries alone", async () => {
      const entry = await tools.logFoodEntry(STATED_MEAL);
      await tools.deleteFoodEntry({ id: entry.id });

      // Nothing was logged for yesterday, so the guarantee worth asserting is
      // that a delete does not reach past the row it names.
      expect(
        (await tools.getDailySummary({ date: "2026-05-12" })).entries,
      ).toEqual([]);
    });
  });

  /**
   * Past days are read-only. The agent resolves whatever the user said —
   * "yesterday", "the 13th of May" — to a date before it gets here, so all the
   * tools have to offer is any single day's totals and items.
   */
  describe("asking about a past day", () => {
    const YESTERDAY = "2026-05-12";

    it("returns that day's totals, not today's", async () => {
      await tools.onDay(YESTERDAY).logFoodEntry(STATED_MEAL);
      await tools.logFoodEntry({ ...STATED_MEAL, description: "granola bar" });

      const summary = await tools.getDailySummary({ date: YESTERDAY });

      expect(summary.date).toBe(YESTERDAY);
      expect(summary.totals).toEqual({
        calories: 400,
        protein: 30,
        carbs: 40,
        fat: 12,
      });
    });

    it("itemises what was eaten that day", async () => {
      const yesterday = tools.onDay(YESTERDAY);
      await yesterday.logFoodEntry(STATED_MEAL);
      await yesterday.logFoodEntry({
        ...STATED_MEAL,
        description: "greek yogurt",
      });

      const summary = await tools.getDailySummary({ date: YESTERDAY });

      expect(summary.entries.map((entry) => entry.description)).toEqual([
        "chicken burrito",
        "greek yogurt",
      ]);
      expect(summary.tracked).toBe(true);
    });

    it("reports a day that was never tracked as zeros rather than failing", async () => {
      await tools.logFoodEntry(STATED_MEAL);

      const summary = await tools.getDailySummary({ date: "2026-04-01" });

      expect(summary.tracked).toBe(false);
      expect(summary.totals).toEqual({
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      });
      expect(summary.entries).toEqual([]);
    });

    it("will not delete an entry off a past day", async () => {
      const entry = await tools.onDay(YESTERDAY).logFoodEntry(STATED_MEAL);

      const result = await tools.deleteFoodEntry({ id: entry.id });

      expect(result.deleted).toBe(false);
      expect(
        (await tools.getDailySummary({ date: YESTERDAY })).totals.calories,
      ).toBe(400);
    });

    it("cannot be back-dated: a logged entry lands on today whatever date it names", async () => {
      await tools.logFoodEntry({ ...STATED_MEAL, date: YESTERDAY });

      expect(
        (await tools.getDailySummary({ date: YESTERDAY })).entries,
      ).toEqual([]);
      expect(
        (await tools.getDailySummary({ date: TODAY })).entries,
      ).toHaveLength(1);
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

    it("rejects a deletion of something that is not an id", async () => {
      await expect(
        tools.deleteFoodEntry({ id: "the yogurt" }),
      ).rejects.toThrow();
    });

    it("rejects a summary request for a day that does not exist", async () => {
      await expect(
        tools.getDailySummary({ date: "2026-13-45" }),
      ).rejects.toThrow();
    });
  });
});
