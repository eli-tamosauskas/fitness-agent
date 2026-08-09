import type { InferUITools, UIDataTypes, UIMessage } from "ai";

import type { NutritionTools } from "@/lib/nutrition/tools";

/**
 * The chat's messages, typed by the tools behind them, so a tool part's output
 * is the tool's own return type rather than something to be cast.
 *
 * It lives here rather than in the chat component because three places now
 * agree on it: the component that renders a message, the route that persists
 * one, and the page that reads the day's back out.
 */
export type NutritionUIMessage = UIMessage<
  unknown,
  UIDataTypes,
  InferUITools<NutritionTools>
>;
