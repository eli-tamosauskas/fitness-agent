import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";

/** The log the e2e server writes to. Never the real one. */
export const E2E_DATABASE_PATH = ".playwright/nutrition.db";

/**
 * Starts every run from an empty log and an empty history, so the rings read
 * zero against their targets and no conversation is left over from last time.
 *
 * Emptied rather than deleted: this runs after the web server has started, and
 * a server that has already opened the file keeps reading and writing the one
 * that was unlinked — which showed up as a run seeing the run before it.
 *
 * It opens the file itself rather than through the app's own helper, which
 * would create the tables it is here to empty and hand back a connection this
 * process would then have to remember to release.
 */
export default function globalSetup() {
  mkdirSync(dirname(E2E_DATABASE_PATH), { recursive: true });

  const database = new DatabaseSync(E2E_DATABASE_PATH);
  const tables = database
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table'`)
    .all() as { name: string }[];

  for (const { name } of tables) database.exec(`DELETE FROM "${name}"`);
  database.close();
}
