// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { saveConversation } from "@/lib/chat/conversation-store";
import type { NutritionUIMessage } from "@/lib/chat/message";
import { closeDatabase, insertEntry } from "@/lib/nutrition/database";
import type { FoodEntryInput } from "@/lib/nutrition/food-entry";
import { APP_TIME_ZONE, today } from "@/lib/nutrition/local-date";

import { dayView } from "./day-view";

/** A day well behind any real clock, so it is always a past day. */
const PAST = "2026-05-13";

/** A 400 cal / 30g / 40g / 12g meal, stated straight into the chat. */
const BURRITO: FoodEntryInput = {
  description: "chicken burrito",
  source: "stated",
  quantity: 1,
  unit: "serving",
  calories: 400,
  protein: 30,
  carbs: 40,
  fat: 12,
};

function said(
  id: string,
  role: NutritionUIMessage["role"],
  text: string,
): NutritionUIMessage {
  return { id, role, parts: [{ type: "text", text }] };
}

describe("a day's view", () => {
  let databasePath: string;
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "day-view-"));
    databasePath = join(directory, "nutrition.db");
  });

  afterEach(() => {
    closeDatabase(databasePath);
    rmSync(directory, { recursive: true, force: true });
  });

  describe("a day with entries and a conversation", () => {
    beforeEach(() => {
      insertEntry(databasePath, PAST, BURRITO);
      saveConversation(
        PAST,
        [
          said("1", "user", "a chicken burrito"),
          said("2", "assistant", "Logged it: 400 cal."),
        ],
        databasePath,
      );
    });

    it("reports the day as tracked, with its totals", () => {
      const day = dayView(PAST, APP_TIME_ZONE, databasePath);

      expect(day.date).toBe(PAST);
      expect(day.tracked).toBe(true);
      expect(day.totals).toEqual({
        calories: 400,
        protein: 30,
        carbs: 40,
        fat: 12,
      });
    });

    it("itemises what was logged, each entry with what it contributed", () => {
      const [entry, ...rest] = dayView(
        PAST,
        APP_TIME_ZONE,
        databasePath,
      ).entries;

      expect(rest).toEqual([]);
      expect(entry.description).toBe("chicken burrito");
      expect(entry.consumed.calories).toBe(400);
    });

    it("carries the conversation exactly as it happened", () => {
      expect(dayView(PAST, APP_TIME_ZONE, databasePath).messages).toEqual([
        said("1", "user", "a chicken burrito"),
        said("2", "assistant", "Logged it: 400 cal."),
      ]);
    });
  });

  it("opens a day that was tracked but never chatted on", () => {
    insertEntry(databasePath, PAST, BURRITO);

    const day = dayView(PAST, APP_TIME_ZONE, databasePath);

    expect(day.tracked).toBe(true);
    expect(day.messages).toEqual([]);
  });

  it("reads a date with nothing behind it as an empty untracked day", () => {
    const day = dayView(PAST, APP_TIME_ZONE, databasePath);

    expect(day.tracked).toBe(false);
    expect(day.entries).toEqual([]);
    expect(day.messages).toEqual([]);
    expect(day.totals).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });

  describe("the date list", () => {
    it("holds today even before anything has been logged", () => {
      const now = today(APP_TIME_ZONE);

      expect(dayView(now, APP_TIME_ZONE, databasePath).dates).toEqual([now]);
    });

    it("runs newest first, with today at the top", () => {
      const now = today(APP_TIME_ZONE);
      insertEntry(databasePath, "2026-05-11", BURRITO);
      insertEntry(databasePath, "2026-05-13", BURRITO);
      insertEntry(databasePath, "2026-05-12", BURRITO);

      expect(dayView(now, APP_TIME_ZONE, databasePath).dates).toEqual([
        now,
        "2026-05-13",
        "2026-05-12",
        "2026-05-11",
      ]);
    });

    it("names today once, however much was logged on it", () => {
      const now = today(APP_TIME_ZONE);
      insertEntry(databasePath, now, BURRITO);
      insertEntry(databasePath, now, BURRITO);

      expect(dayView(now, APP_TIME_ZONE, databasePath).dates).toEqual([now]);
    });

    it("is the same list whichever day is being viewed", () => {
      insertEntry(databasePath, PAST, BURRITO);

      expect(dayView(PAST, APP_TIME_ZONE, databasePath).dates).toEqual(
        dayView(today(APP_TIME_ZONE), APP_TIME_ZONE, databasePath).dates,
      );
    });
  });

  describe("whether the day is today", () => {
    // Two zones 26 hours apart are never on the same calendar date, so the
    // same instant is a different day in each — which is what makes this an
    // assertion about the timezone supplied rather than the host's.
    const AHEAD = "Pacific/Kiritimati";
    const BEHIND = "Etc/GMT+12";

    it("is decided in the timezone it is given", () => {
      const now = today(AHEAD);

      expect(dayView(now, AHEAD, databasePath).isToday).toBe(true);
      expect(dayView(now, BEHIND, databasePath).isToday).toBe(false);
    });

    it("is false for a day behind the current one", () => {
      expect(dayView(PAST, APP_TIME_ZONE, databasePath).isToday).toBe(false);
    });
  });

  describe("whether the day has happened yet", () => {
    it("is true for a date beyond the current day", () => {
      expect(dayView("2999-12-31", APP_TIME_ZONE, databasePath).isFuture).toBe(
        true,
      );
    });

    it("is false for today and for a day behind it", () => {
      const now = today(APP_TIME_ZONE);

      expect(dayView(now, APP_TIME_ZONE, databasePath).isFuture).toBe(false);
      expect(dayView(PAST, APP_TIME_ZONE, databasePath).isFuture).toBe(false);
    });

    it("agrees with today about which day it is, from one reading of the clock", () => {
      const now = today(APP_TIME_ZONE);
      const day = dayView(now, APP_TIME_ZONE, databasePath);

      expect([day.isToday, day.isFuture]).toEqual([true, false]);
    });
  });
});
