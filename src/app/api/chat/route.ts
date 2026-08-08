import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";

import { isoDateSchema, type IsoDate } from "@/lib/nutrition/food-entry";
import { DAILY_TARGETS } from "@/lib/nutrition/targets";
import { createNutritionTools } from "@/lib/nutrition/tools";

/** One model for every call, including the vision reads that arrive later. */
const MODEL = "anthropic/claude-sonnet-5";

export const maxDuration = 30;

const chatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
  /** The user's own calendar day, computed by their browser. */
  today: isoDateSchema,
});

function systemPrompt(today: IsoDate): string {
  return [
    "You are a nutrition logging assistant for a single user.",
    `Today is ${today}. Never guess the date from anything else.`,
    "The user's daily targets are " +
      `${DAILY_TARGETS.calories} calories, ${DAILY_TARGETS.protein}g protein, ` +
      `${DAILY_TARGETS.carbs}g carbs and ${DAILY_TARGETS.fat}g fat.`,
    "When the user tells you what they ate, log it immediately with logFoodEntry.",
    "Never ask them to confirm first, and never offer to log it — just do it, then say what you recorded.",
    "Record base nutrients, not totals: give the figures for one serving with unit 'serving',",
    "or the figures per 100g with unit 'g'. The arithmetic for the quantity is done for you.",
    "When the user states macros for a whole meal they have already eaten, that is one serving of it.",
    "When an image of a nutrition label is attached, read the figures off it yourself — you can see it.",
    "Log it with source 'label'. If the user gives an amount in servings, take the label's per-serving",
    "column and use unit 'serving'; if they give a weight in grams, take the per-100g column and use",
    "unit 'g'. If the label prints only the other column, convert between them using the serving weight",
    "the label itself states in grams. If that weight is not printed either, do not estimate it — say",
    "which column the label gives and ask the user for the amount in that unit.",
    "If the label is unreadable — blurred, cropped, or not a nutrition panel — say so and ask for another",
    "photo. Never invent figures you cannot read, and never log an entry from a label you could not read.",
    "Keep replies to a sentence or two.",
  ].join("\n");
}

export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return new Response("Malformed chat request", { status: 400 });
  }

  const { messages, today } = parsed.data;

  const result = streamText({
    model: MODEL,
    system: systemPrompt(today),
    messages: await convertToModelMessages(messages),
    // Enough steps for the model to log an entry and then say what it logged.
    stopWhen: isStepCount(5),
    tools: createNutritionTools({ today }),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
