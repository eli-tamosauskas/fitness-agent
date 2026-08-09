"use client";

import type { FileUIPart } from "ai";

import {
  Attachment,
  AttachmentPreview,
  Attachments,
} from "@/components/ai-elements/attachments";
import { LABEL_PHOTO_MARKER_URL } from "@/lib/chat/message";

/**
 * A label photo in the conversation. The one just sent is shown; a replayed one
 * is a marker — the bytes were never stored — and shows as an empty tile of the
 * same size, so the thread reads as "a photo was here" rather than as a broken
 * image or a gap where a message ought to be.
 *
 * The marker's URL is cleared rather than passed through: the preview draws an
 * image thumbnail whenever it has a URL, and pointing an `img` at something
 * that resolves to nothing is exactly the broken tile this avoids. With no URL
 * it falls back to an icon chosen from the media type the marker kept.
 */
export function LabelPhoto({ id, part }: { id: string; part: FileUIPart }) {
  const isMarker = part.url === LABEL_PHOTO_MARKER_URL;

  return (
    <Attachments variant="grid">
      <Attachment
        data={{ ...part, id, url: isMarker ? "" : part.url }}
        role={isMarker ? "img" : undefined}
        aria-label={isMarker ? "Label photo, no longer kept" : undefined}
      >
        <AttachmentPreview />
      </Attachment>
    </Attachments>
  );
}
