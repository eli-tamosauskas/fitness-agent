import { mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { FoodEntry, FoodEntryInput, IsoDate } from "./food-entry";

/**
 * The food log. One table, indexed on the day, storing the base nutrients as
 * given rather than any pre-multiplied total.
 */
const SCHEMA = `
  CREATE TABLE IF NOT EXISTS food_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    source TEXT NOT NULL,
    quantity REAL NOT NULL,
    unit TEXT NOT NULL,
    calories REAL NOT NULL,
    protein REAL NOT NULL,
    carbs REAL NOT NULL,
    fat REAL NOT NULL
  );
  CREATE INDEX IF NOT EXISTS food_entries_by_date ON food_entries (date);
`;

/**
 * Connections are cached per path so a request — or a dev-server hot reload —
 * does not leak a new file handle each time.
 */
const connections = new Map<string, DatabaseSync>();

/** Where the log lives when nothing overrides it. Gitignored. */
export function defaultDatabasePath(): string {
  return (
    process.env.NUTRITION_DB_PATH ??
    join(process.cwd(), ".data", "nutrition.db")
  );
}

export function openDatabase(path: string): DatabaseSync {
  const existing = connections.get(path);
  if (existing) return existing;

  mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(SCHEMA);
  connections.set(path, database);
  return database;
}

/** Releases a connection. Used by tests to let a temporary file be removed. */
export function closeDatabase(path: string): void {
  connections.get(path)?.close();
  connections.delete(path);
}

type EntryRow = {
  id: number;
  date: string;
  description: string;
  source: string;
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

function toEntry(row: EntryRow): FoodEntry {
  return {
    id: row.id,
    date: row.date,
    description: row.description,
    source: row.source as FoodEntry["source"],
    quantity: row.quantity,
    unit: row.unit as FoodEntry["unit"],
    calories: row.calories,
    protein: row.protein,
    carbs: row.carbs,
    fat: row.fat,
  };
}

export function insertEntry(
  path: string,
  date: IsoDate,
  input: FoodEntryInput,
): FoodEntry {
  const database = openDatabase(path);
  const { lastInsertRowid } = database
    .prepare(
      `INSERT INTO food_entries
         (date, description, source, quantity, unit, calories, protein, carbs, fat)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      date,
      input.description,
      input.source,
      input.quantity,
      input.unit,
      input.calories,
      input.protein,
      input.carbs,
      input.fat,
    );

  return { ...input, id: Number(lastInsertRowid), date };
}

/**
 * Removes one entry. Reports whether there was anything to remove, so an id
 * that has already gone — or never existed — is an answer rather than a fault.
 *
 * The delete is confined to `onDate`, which is how past data is kept read-only:
 * an id read out of an old day's summary matches nothing. Every caller names
 * the day, so there is no way to reach backwards by omitting it.
 */
export function deleteEntry(
  path: string,
  id: number,
  onDate: IsoDate,
): boolean {
  const { changes } = openDatabase(path)
    .prepare(`DELETE FROM food_entries WHERE id = ? AND date = ?`)
    .run(id, onDate);

  return changes > 0;
}

export function entriesForDate(path: string, date: IsoDate): FoodEntry[] {
  const rows = openDatabase(path)
    .prepare(`SELECT * FROM food_entries WHERE date = ? ORDER BY id`)
    .all(date) as EntryRow[];

  return rows.map(toEntry);
}
