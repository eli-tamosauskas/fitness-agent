"use server";

import { z } from "zod";

import { browserDate } from "@/lib/nutrition/browser-date";
import { defaultDatabasePath, deleteEntry } from "@/lib/nutrition/database";

/**
 * A server function is reachable by POST on its own, not only through the
 * card's button, so what arrives is checked rather than trusted.
 */
const entryIdSchema = z.number().int();

/**
 * Deletes the entry a card stands for. The caller refreshes afterwards, which
 * is what makes the rings drop: the totals are only ever derived on the server.
 *
 * Whether there was a row to remove is not reported back. Either way the entry
 * is gone, which is the only thing the card has to say — an id already deleted
 * from chat is not a different outcome to the user.
 *
 * Confined to the browser's own day, because past data is read-only and this is
 * reachable by POST with any id. The cost is a card left over from before
 * midnight, whose entry now belongs to yesterday and so no longer deletes —
 * which is the same rule the chat obeys, not an exception to it.
 */
export async function deleteFoodEntry(id: number): Promise<void> {
  const parsed = entryIdSchema.safeParse(id);
  if (!parsed.success) throw new Error("Not an entry id");

  deleteEntry(defaultDatabasePath(), parsed.data, await browserDate());
}
