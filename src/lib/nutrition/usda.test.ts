// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createToolHarness, type ToolHarness } from "./tool-harness";
import type { UsdaMatch, UsdaMiss } from "./usda";

const TODAY = "2026-05-13";

/**
 * A nutrient as FoodData Central returns it. The four we keep arrive alongside
 * fibre, sodium, vitamins and a dozen derivation fields — all of which are
 * discarded on ingest.
 */
type Nutrient = { nutrientId: number; value: number; unitName: string };

function nutrient(nutrientId: number, value: number, unitName = "G"): Nutrient {
  return { nutrientId, value, unitName };
}

/** Nutrients nothing in this app stores: fibre, sugar, sodium, vitamin C. */
const DISCARDED = [
  nutrient(1079, 3),
  nutrient(2000, 8.99),
  nutrient(1093, 3, "MG"),
  nutrient(1162, 92.7, "MG"),
];

/**
 * The Foundation entry for a kiwi. Foundation foods carry Atwater-derived
 * energy rather than the plain `Energy` kcal that SR Legacy foods have.
 */
const KIWIFRUIT = {
  fdcId: 2710831,
  dataType: "Foundation",
  description: "Kiwifruit (kiwi), green, peeled, raw",
  foodNutrients: [
    nutrient(1003, 1.01),
    nutrient(1004, 0.64),
    nutrient(1005, 13.8),
    nutrient(2047, 65.1, "KCAL"),
    nutrient(2048, 58.5, "KCAL"),
    ...DISCARDED,
  ],
};

/** An SR Legacy entry, which does carry nutrient 1008. */
const KIWI_JUICE = {
  fdcId: 174111,
  dataType: "SR Legacy",
  description: "Beverages, Kiwi Strawberry Juice Drink",
  foodNutrients: [
    nutrient(1008, 47, "KCAL"),
    nutrient(1062, 195, "kJ"),
    nutrient(1003, 0),
    nutrient(1004, 0),
    nutrient(1005, 12.3),
    ...DISCARDED,
  ],
};

type FoodDataCentralFood = typeof KIWIFRUIT | typeof KIWI_JUICE;

/** What FoodData Central was asked for, so the restriction can be asserted. */
type SearchRequest = { url: string; body: Record<string, unknown> };

type FakeApi = {
  requests: SearchRequest[];
  fetch: typeof fetch;
};

/** FoodData Central, standing in, answering with whatever `respond` returns. */
function fakeFoodDataCentral(
  respond: () => { status?: number; payload?: unknown },
): FakeApi {
  const requests: SearchRequest[] = [];

  const fetchImpl = (async (input: string | URL | Request, init?) => {
    requests.push({
      url: String(input),
      body: JSON.parse(String(init?.body ?? "{}")),
    });

    const { status = 200, payload } = respond();
    return new Response(JSON.stringify(payload ?? {}), {
      status,
      headers: { "content-type": "application/json" },
    });
  }) as typeof fetch;

  return { requests, fetch: fetchImpl };
}

/** A search that hits, returning the given foods in rank order. */
function returning(...foods: FoodDataCentralFood[]): FakeApi {
  return fakeFoodDataCentral(() => ({
    payload: { totalHits: foods.length, foods },
  }));
}

describe("looking up a whole food in FoodData Central", () => {
  let api: FakeApi;
  let tools: ToolHarness;
  /** Every harness a test built, so each one's database is cleaned up. */
  const built: ToolHarness[] = [];

  /** Points the tools at a different FoodData Central stand-in. */
  const harnessFor = (fake: FakeApi) => {
    api = fake;
    tools = createToolHarness({ today: TODAY, fetch: fake.fetch });
    built.push(tools);
    return tools;
  };

  /** A lookup the test expects to hit, narrowed to the match. */
  const lookUp = async (query: string): Promise<UsdaMatch> => {
    const result = await tools.lookUpUsdaFood({ query });
    if (!result.found) throw new Error(`expected a match: ${result.message}`);
    return result;
  };

  /** A lookup the test expects to fail, narrowed to the miss. */
  const lookUpExpectingMiss = async (query: string): Promise<UsdaMiss> => {
    const result = await tools.lookUpUsdaFood({ query });
    if (result.found) throw new Error(`expected a miss: ${result.matchedFood}`);
    return result;
  };

  beforeEach(() => {
    harnessFor(returning(KIWIFRUIT, KIWI_JUICE));
  });

  afterEach(() => {
    for (const harness of built.splice(0)) harness.dispose();
  });

  it("returns the top hit's per-100g macros and the name that matched", async () => {
    const found = await lookUp("kiwi");

    expect(found).toEqual({
      found: true,
      matchedFood: "Kiwifruit (kiwi), green, peeled, raw",
      per100g: { calories: 58.5, protein: 1.01, carbs: 13.8, fat: 0.64 },
    });
  });

  it("restricts the search to the Foundation and SR Legacy data types", async () => {
    await tools.lookUpUsdaFood({ query: "kiwi" });

    expect(api.requests).toHaveLength(1);
    expect(api.requests[0].body).toMatchObject({
      query: "kiwi",
      dataType: ["Foundation", "SR Legacy"],
    });
  });

  it("keeps nothing beyond the four nutrients", async () => {
    const found = await lookUp("kiwi");

    expect(Object.keys(found.per100g).sort()).toEqual([
      "calories",
      "carbs",
      "fat",
      "protein",
    ]);
  });

  it("reads energy from the plain kcal nutrient when the food has one", async () => {
    harnessFor(returning(KIWI_JUICE));

    const found = await lookUp("kiwi juice");

    expect(found.per100g).toEqual({
      calories: 47,
      protein: 0,
      carbs: 12.3,
      fat: 0,
    });
  });

  describe("a lookup that cannot answer", () => {
    it("reports finding nothing rather than inventing a match", async () => {
      harnessFor(returning());

      const result = await lookUpExpectingMiss("zzzzz");

      expect(result.message).toContain("zzzzz");
    });

    it("reports an error response from the API", async () => {
      harnessFor(fakeFoodDataCentral(() => ({ status: 500 })));

      const result = await lookUpExpectingMiss("kiwi");

      expect(result.message).toMatch(/FoodData Central/i);
    });

    it("reports a network failure rather than throwing", async () => {
      harnessFor({
        requests: [],
        fetch: (() =>
          Promise.reject(new Error("ECONNREFUSED"))) as typeof fetch,
      });

      const result = await lookUpExpectingMiss("kiwi");

      expect(result.message).toMatch(/FoodData Central/i);
    });

    it("reports a top hit that is missing one of the four nutrients", async () => {
      harnessFor(
        returning({
          ...KIWIFRUIT,
          foodNutrients: [nutrient(1003, 1.01), nutrient(1004, 0.64)],
        }),
      );

      const result = await lookUpExpectingMiss("kiwi");

      expect(result.message).toContain("Kiwifruit (kiwi), green, peeled, raw");
    });

    it("rejects an empty query rather than searching", async () => {
      await expect(tools.lookUpUsdaFood({ query: "" })).rejects.toThrow();
      expect(api.requests).toHaveLength(0);
    });
  });

  /**
   * The point of the whole slice: a looked-up food becomes an ordinary entry,
   * with a per-100g base, and totals with everything else in the day.
   */
  it("logs as a per-100g entry that aggregates with a label entry", async () => {
    const found = await lookUp("kiwi");

    const entry = await tools.logFoodEntry({
      description: found.matchedFood,
      source: "usda",
      quantity: 150,
      unit: "g",
      ...found.per100g,
    });

    await tools.logFoodEntry({
      description: "protein bar",
      source: "label",
      quantity: 1,
      unit: "serving",
      calories: 210,
      protein: 20,
      carbs: 21,
      fat: 7,
    });

    expect(entry).toMatchObject({
      source: "usda",
      unit: "g",
      quantity: 150,
      calories: 58.5,
    });

    const summary = await tools.getDailySummary({ date: TODAY });

    // 1.5x the kiwi's per-100g figures, plus the bar as printed.
    expect(summary.totals).toEqual({
      calories: 297.8,
      protein: 21.5,
      carbs: 41.7,
      fat: 8,
    });
  });
});
