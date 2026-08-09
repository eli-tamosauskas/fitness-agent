// @vitest-environment node
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import type { NutritionUIMessage } from "@/lib/chat/message";
import { closeDatabase } from "@/lib/nutrition/database";

import { conversationFor, saveConversation } from "./conversation-store";

const TODAY = "2026-05-13";

function said(
  id: string,
  role: NutritionUIMessage["role"],
  text: string,
): NutritionUIMessage {
  return { id, role, parts: [{ type: "text", text }] };
}

describe("the conversation store", () => {
  let databasePath: string;
  let directory: string;

  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "conversation-"));
    databasePath = join(directory, "nutrition.db");
  });

  afterEach(() => {
    closeDatabase(databasePath);
    rmSync(directory, { recursive: true, force: true });
  });

  it("reads back a day's conversation as it was written", () => {
    const conversation = [
      said("1", "user", "a chicken burrito"),
      said("2", "assistant", "Logged it: 400 cal."),
    ];

    saveConversation(TODAY, conversation, databasePath);

    expect(conversationFor(TODAY, databasePath)).toEqual(conversation);
  });

  it("replaces a day rather than accumulating it", () => {
    saveConversation(
      TODAY,
      [said("1", "user", "a chicken burrito")],
      databasePath,
    );
    saveConversation(
      TODAY,
      [
        said("1", "user", "a chicken burrito"),
        said("2", "assistant", "Logged it: 400 cal."),
      ],
      databasePath,
    );

    expect(conversationFor(TODAY, databasePath)).toHaveLength(2);
  });

  it("reads a day nothing was said on as an empty conversation", () => {
    expect(conversationFor("2026-05-12", databasePath)).toEqual([]);
  });

  it("keeps each day's conversation to itself", () => {
    saveConversation(
      TODAY,
      [said("1", "user", "a chicken burrito")],
      databasePath,
    );
    saveConversation("2026-05-12", [said("2", "user", "a kiwi")], databasePath);

    expect(conversationFor(TODAY, databasePath)).toEqual([
      said("1", "user", "a chicken burrito"),
    ]);
  });
});
