import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { z } from "zod";

import type { IsoDate } from "@/lib/nutrition/food-entry";
import {
  APP_TIME_ZONE,
  describeIsoDate,
  today,
} from "@/lib/nutrition/local-date";
import { DAILY_TARGETS } from "@/lib/nutrition/targets";
import { createNutritionTools } from "@/lib/nutrition/tools";

/** One model for every call, including the vision reads that arrive later. */
const MODEL = "anthropic/claude-sonnet-5";

export const maxDuration = 30;

const chatRequestSchema = z.object({
  messages: z.array(z.custom<UIMessage>()),
});

function systemPrompt(date: IsoDate): string {
  return [
    "You are a nutrition logging assistant for a single user.",
    `Today is ${describeIsoDate(date)}. Never guess the date from anything else.`,
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
    "When the user names an unlabelled whole food with no figures — 'I ate a kiwi' — call",
    "lookUpUsdaFood first, then log the match with source 'usda', unit 'g' and its per-100g",
    "nutrients. If they gave no weight, use a typical weight for one of the item and say which",
    "weight you assumed. Always name the matched USDA food in your reply, so the user can spot a",
    "wrong match. Search with the food's specific name and its state — 'kiwifruit raw', 'apples raw'",
    "— because only the single top hit comes back and a bare word can match a juice or a variety.",
    "If the lookup returns found: false, tell the user it failed and log nothing.",
    "If the label is unreadable — blurred, cropped, or not a nutrition panel — say so and ask for another",
    "photo. Never invent figures you cannot read, and never log an entry from a label you could not read.",
    "When the user asks to remove something they describe in words — 'delete the yogurt' —",
    "call getDailySummary for today first to find which entry they mean and get its id, then",
    "call deleteFoodEntry with that id. Never guess an id. If nothing on the day matches what",
    "they described, say so instead of deleting something else; if more than one entry could be",
    "what they meant, ask which. There is no way to edit an entry: a wrong amount is corrected",
    "by deleting it and logging the food again.",
    "When the user asks about a day — 'how did I do on the 13th of May', 'what did I eat",
    "yesterday' — work out the YYYY-MM-DD date yourself from today's date and weekday above,",
    "then call getDailySummary with it. Always write the resolved date out in your reply",
    "('On Tuesday 2026-05-12 you had…') so the user can catch a date you read wrong.",
    "Give the four totals, and list the entries too when they ask what they ate.",
    "If tracked is false, say plainly that nothing was logged that day — it is an untracked",
    "day, not an error and not a day of zero calories.",
    "Past days are read-only, one day at a time: no ranges, no totals across weeks. You cannot",
    "log or delete anything on a past day, only today. If the user asks you to add something to",
    "an earlier day, say that entries can only be logged for today.",
    "Keep replies to a sentence or two.",
  ].join("\n");
}

export async function POST(request: Request) {
  const parsed = chatRequestSchema.safeParse(await request.json());
  if (!parsed.success) {
    return new Response("Malformed chat request", { status: 400 });
  }

  const { messages } = parsed.data;
  // The day is the server's, so a request cannot name one: the prompt and the
  // tools both read the same derived date.
  const date = today(APP_TIME_ZONE);

  const result = streamText({
    model: MODEL,
    system: systemPrompt(date),
    messages: await convertToModelMessages(messages),
    // Enough steps for the model to log an entry and then say what it logged.
    stopWhen: isStepCount(5),
    tools: createNutritionTools({ today: date }),
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({ stream: result.stream }),
  });
}
