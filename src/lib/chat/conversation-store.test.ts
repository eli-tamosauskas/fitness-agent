// @vitest-environment node
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  LABEL_PHOTO_MARKER_URL,
  type NutritionUIMessage,
} from "@/lib/chat/message";
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

  describe("a label photo", () => {
    /** A data URL of the sort a phone photo arrives as, only far shorter. */
    const PHOTO_DATA_URL =
      "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA==";

    const sentAPhoto = (): NutritionUIMessage[] => [
      {
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "image/jpeg",
            filename: "label.jpg",
            url: PHOTO_DATA_URL,
          },
          { type: "text", text: "two servings of this" },
        ],
      },
    ];

    it("reads back as a marker the renderer can show a placeholder for", () => {
      saveConversation(TODAY, sentAPhoto(), databasePath);

      expect(conversationFor(TODAY, databasePath)[0].parts[0]).toMatchObject({
        type: "file",
        mediaType: "image/jpeg",
        url: LABEL_PHOTO_MARKER_URL,
      });
    });

    it("keeps its media type, so a photo still reads as a photo", () => {
      saveConversation(
        TODAY,
        [
          {
            id: "1",
            role: "user",
            parts: [
              { type: "file", mediaType: "image/png", url: PHOTO_DATA_URL },
            ],
          },
        ],
        databasePath,
      );

      expect(conversationFor(TODAY, databasePath)[0].parts[0]).toMatchObject({
        mediaType: "image/png",
      });
    });

    it("leaves none of its bytes in the database", () => {
      saveConversation(TODAY, sentAPhoto(), databasePath);

      expect(readFileSync(databasePath, "latin1")).not.toContain(
        "/9j/4AAQSkZJRgABAQAAAQABAAD",
      );
    });

    it("keeps what was said alongside it", () => {
      saveConversation(TODAY, sentAPhoto(), databasePath);

      expect(conversationFor(TODAY, databasePath)[0].parts[1]).toEqual({
        type: "text",
        text: "two servings of this",
      });
    });

    it("leaves the message it was handed alone, so the live reply still has the image", () => {
      const conversation = sentAPhoto();
      saveConversation(TODAY, conversation, databasePath);

      expect(conversation[0].parts[0]).toMatchObject({ url: PHOTO_DATA_URL });
    });
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
