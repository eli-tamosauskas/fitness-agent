import { describe, expect, it } from "vitest";

import {
  LABEL_PHOTO_MARKER_URL,
  withoutFileParts,
  type NutritionUIMessage,
} from "./message";

/** A day as it reads back out of the store: the photo is a marker by then. */
const REPLAYED: NutritionUIMessage[] = [
  {
    id: "1",
    role: "user",
    parts: [
      { type: "file", mediaType: "image/jpeg", url: LABEL_PHOTO_MARKER_URL },
      { type: "text", text: "two servings of this" },
    ],
  },
  {
    id: "2",
    role: "assistant",
    parts: [{ type: "text", text: "Logged it: 420 cal." }],
  },
];

describe("withoutFileParts", () => {
  it("drops a file part the model could not resolve", () => {
    const [user] = withoutFileParts(REPLAYED);

    expect(user.parts).toEqual([
      { type: "text", text: "two servings of this" },
    ]);
  });

  it("keeps what was said around the photo", () => {
    expect(withoutFileParts(REPLAYED)).toHaveLength(2);
    expect(withoutFileParts(REPLAYED)[1]).toEqual(REPLAYED[1]);
  });

  it("leaves the conversation it was given alone", () => {
    withoutFileParts(REPLAYED);

    expect(REPLAYED[0].parts).toHaveLength(2);
  });

  it("drops a message that was nothing but a photo, rather than sending an empty one", () => {
    const photoOnly: NutritionUIMessage[] = [
      {
        id: "1",
        role: "user",
        parts: [
          {
            type: "file",
            mediaType: "image/jpeg",
            url: LABEL_PHOTO_MARKER_URL,
          },
        ],
      },
      REPLAYED[1],
    ];

    expect(withoutFileParts(photoOnly)).toEqual([REPLAYED[1]]);
  });
});
