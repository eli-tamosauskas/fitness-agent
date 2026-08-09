import type { InferUITools, UIDataTypes, UIMessage } from "ai";

import type { NutritionTools } from "@/lib/nutrition/tools";

/**
 * The chat's messages, typed by the tools behind them, so a tool part's output
 * is the tool's own return type rather than something to be cast.
 *
 * It lives here rather than in the chat component because three places now
 * agree on it: the component that renders a message, the route that persists
 * one, and the page that reads the day's back out.
 */
export type NutritionUIMessage = UIMessage<
  unknown,
  UIDataTypes,
  InferUITools<NutritionTools>
>;

/**
 * Where a label photo's data URL was. A phone photo is some four megabytes of
 * base64 inside the message; persisting it would bloat every rewrite of the
 * day's row and ship those megabytes back to the browser on every visit.
 *
 * It deliberately resolves to nothing. The renderer recognises it and draws a
 * placeholder tile, so a replayed day still shows that a photo was sent; the
 * contents of the label survive in the agent's written summary of it. If photos
 * in history are wanted later, this is where a real URL would go.
 */
export const LABEL_PHOTO_MARKER_URL = "marker:label-photo";

/**
 * The conversation as it is worth storing: every file part reduced to a marker
 * carrying its media type, and nothing else touched.
 */
export function withLabelPhotoMarkers(
  messages: NutritionUIMessage[],
): NutritionUIMessage[] {
  return messages.map((message) => ({
    ...message,
    parts: message.parts.map((part) =>
      part.type === "file" ? { ...part, url: LABEL_PHOTO_MARKER_URL } : part,
    ),
  }));
}

/**
 * The conversation as the model should see it. A marker is not a resolvable
 * URL, so a replayed file part would either break the conversion or have the
 * model reasoning about an image it cannot see — the photo's content reaches it
 * through the reply that read the label, not through the marker.
 *
 * A message left with no parts is dropped rather than sent empty: a photo with
 * no words is a message with nothing in it once the photo is gone.
 *
 * This is for replayed history. The message being sent now still carries its
 * image, which is how the model reads a label in the first place.
 */
export function withoutFileParts(
  messages: NutritionUIMessage[],
): NutritionUIMessage[] {
  return messages
    .map((message) => ({
      ...message,
      parts: message.parts.filter((part) => part.type !== "file"),
    }))
    .filter((message) => message.parts.length > 0);
}
