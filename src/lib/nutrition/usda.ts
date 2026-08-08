import type { BaseNutrients } from "./food-entry";

/**
 * FoodData Central, read for the four nutrients this app keeps.
 *
 * The JSON API is used rather than the FoodData Central website, which is a
 * client-rendered SPA: "browsing" it would mean driving a headless browser per
 * lookup, over the same dataset, for worse-structured data.
 */
const SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search";

/**
 * The only data types searched. USDA's top pick hides real ambiguity — "kiwi"
 * otherwise matches frozen, juiced and branded variants — and narrowing the
 * search is half the mitigation. Surfacing the matched name is the other half.
 */
const DATA_TYPES = ["Foundation", "SR Legacy"] as const;

/** FDC's standard nutrient identifiers for the four nutrients we keep. */
const PROTEIN = 1003;
const FAT = 1004;
const CARBS = 1005;

/**
 * Energy in kcal, in order of preference: plain `Energy` (1008), which SR
 * Legacy foods carry, then the two Atwater-derived figures that Foundation
 * foods often carry instead — specific factors (2048) ahead of general (2047),
 * being the more accurate of the two.
 */
const ENERGY_KCAL = [1008, 2048, 2047];

/** A hit, reduced to what gets stored. Every other nutrient is discarded. */
export type UsdaMatch = {
  found: true;
  /** The name FoodData Central matched, so a wrong match is visible. */
  matchedFood: string;
  per100g: BaseNutrients;
};

/** A lookup that could not answer. Reported in chat, never a silent drop. */
export type UsdaMiss = {
  found: false;
  message: string;
};

export type UsdaLookupResult = UsdaMatch | UsdaMiss;

export type UsdaLookupOptions = {
  apiKey?: string;
  /** Injectable so tests exercise the mapping without the network. */
  fetch?: typeof fetch;
};

type FdcNutrient = {
  nutrientId?: number;
  value?: number;
};

type FdcFood = {
  description?: string;
  foodNutrients?: FdcNutrient[];
};

type FdcSearchResponse = {
  foods?: FdcFood[];
};

function amountOf(nutrients: FdcNutrient[], id: number): number | undefined {
  const match = nutrients.find((nutrient) => nutrient.nutrientId === id);
  return typeof match?.value === "number" ? match.value : undefined;
}

function energyOf(nutrients: FdcNutrient[]): number | undefined {
  for (const id of ENERGY_KCAL) {
    const value = amountOf(nutrients, id);
    if (value !== undefined) return value;
  }
  return undefined;
}

/** The four nutrients, or nothing if the food is missing any of them. */
function nutrientsOf(food: FdcFood): BaseNutrients | undefined {
  const nutrients = food.foodNutrients ?? [];
  const calories = energyOf(nutrients);
  const protein = amountOf(nutrients, PROTEIN);
  const carbs = amountOf(nutrients, CARBS);
  const fat = amountOf(nutrients, FAT);

  if (
    calories === undefined ||
    protein === undefined ||
    carbs === undefined ||
    fat === undefined
  ) {
    return undefined;
  }

  return { calories, protein, carbs, fat };
}

async function searchTopHit(
  query: string,
  apiKey: string,
  fetchImpl: typeof fetch,
): Promise<FdcFood | undefined> {
  const response = await fetchImpl(
    `${SEARCH_URL}?api_key=${encodeURIComponent(apiKey)}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        query,
        dataType: [...DATA_TYPES],
        // The top hit is the answer; there is no candidate list to present.
        pageSize: 1,
      }),
    },
  );

  if (!response.ok) {
    throw new Error(`FoodData Central responded ${response.status}`);
  }

  const { foods }: FdcSearchResponse = await response.json();
  return foods?.[0];
}

/**
 * Looks a free-text food up in FoodData Central and returns its per-100g
 * calories, protein, carbs and fat along with the name that matched.
 *
 * Never throws: a miss, a bad response and a dead network all come back as a
 * message the agent can relay, because the user needs to know to log the item
 * another way.
 */
export async function lookUpUsdaFood(
  query: string,
  {
    apiKey = process.env.FDC_API_KEY,
    fetch: fetchImpl = fetch,
  }: UsdaLookupOptions = {},
): Promise<UsdaLookupResult> {
  if (!apiKey) {
    return {
      found: false,
      message:
        "FoodData Central is not configured — FDC_API_KEY is missing, so this food cannot be looked up.",
    };
  }

  let top: FdcFood | undefined;
  try {
    top = await searchTopHit(query, apiKey, fetchImpl);
  } catch (error) {
    return {
      found: false,
      message: `The FoodData Central lookup for "${query}" failed: ${
        error instanceof Error ? error.message : String(error)
      }`,
    };
  }

  if (!top?.description) {
    return {
      found: false,
      message: `FoodData Central has no Foundation or SR Legacy food matching "${query}".`,
    };
  }

  const per100g = nutrientsOf(top);
  if (!per100g) {
    return {
      found: false,
      message: `FoodData Central matched "${top.description}" but does not give all four nutrients for it.`,
    };
  }

  return { found: true, matchedFood: top.description, per100g };
}
