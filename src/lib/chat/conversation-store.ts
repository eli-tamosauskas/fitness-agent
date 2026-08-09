import { defaultDatabasePath, openDatabase } from "@/lib/nutrition/database";
import type { IsoDate } from "@/lib/nutrition/food-entry";

import type { NutritionUIMessage } from "./message";

/**
 * A day's conversation, whole. One row per day rather than one per message: a
 * day is always read whole and written whole, so per-message rows would buy
 * ordering columns and pagination that nothing here would use.
 *
 * It shares the food log's database file — the file holds a food log and the
 * conversations about it — but nothing else: no foreign keys, no joins. The
 * separation between the two is this module, not a second file, which would
 * mean a second path helper, connection cache, environment variable and reset
 * story.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS chat_days (
    date TEXT PRIMARY KEY,
    messages_json TEXT NOT NULL
  );
`;

/**
 * The shared connection with this module's table guaranteed to exist. The
 * `CREATE TABLE IF NOT EXISTS` is re-run rather than remembered per path,
 * because a connection can be closed and reopened underneath us — a test
 * releasing its temporary file does exactly that — and a remembered flag would
 * then be a lie.
 */
function openStore(path: string) {
  const database = openDatabase(path);
  database.exec(SCHEMA);
  return database;
}

/**
 * Writes a day's conversation, replacing whatever was there. Called twice per
 * exchange — once when the user's message arrives, once when the assistant's
 * reply ends — and deliberately not in a transaction with the food log write:
 * the two can be a long way apart in wall-clock time, and that is a lock rather
 * than a transaction boundary.
 */
export function saveConversation(
  date: IsoDate,
  messages: NutritionUIMessage[],
  databasePath: string = defaultDatabasePath(),
): void {
  openStore(databasePath)
    .prepare(
      `INSERT INTO chat_days (date, messages_json) VALUES (?, ?)
       ON CONFLICT (date) DO UPDATE SET messages_json = excluded.messages_json`,
    )
    .run(date, JSON.stringify(messages));
}

/**
 * A day's conversation. A day nobody said anything on is an empty conversation
 * rather than an error — most days in a date range are that day.
 *
 * The stored JSON is not re-validated: this module is the only thing that
 * writes it, and it writes what the chat's own message type produced.
 */
export function conversationFor(
  date: IsoDate,
  databasePath: string = defaultDatabasePath(),
): NutritionUIMessage[] {
  const row = openStore(databasePath)
    .prepare(`SELECT messages_json FROM chat_days WHERE date = ?`)
    .get(date) as { messages_json: string } | undefined;

  return row ? (JSON.parse(row.messages_json) as NutritionUIMessage[]) : [];
}
