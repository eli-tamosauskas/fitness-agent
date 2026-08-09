# A label photo leaves a durable mark

Status: ready-for-agent

## Parent

`.scratch/chat-history/spec.md`

## What to build

A label photo the user sent is still visibly a photo after a reload, without the app
storing or shipping the bytes.

Attachments arrive as base64 data URLs — a phone photo is roughly four megabytes of string
inside the message. Persisting that would bloat every rewrite of the day's row and, worse,
ship megabytes of base64 to the browser every time the day is opened.

- **Image bytes are not persisted.** The file part is stored as a marker carrying its
  media type and a sentinel URL that the renderer recognises, so a replayed conversation
  shows a placeholder tile where a photo was.
- **File parts are dropped entirely before conversion to model messages.** A marker with a
  non-resolvable URL would either break conversion or have the model reasoning about an
  image it cannot see. This applies to the replayed history, not to the live message, which
  still carries its image to the model as it does today.

**Consequence accepted:** after a reload, the contents of a label survive only in the
agent's written summary of it. The agent already replies with that summary today, and the
committed entry carries the numbers, so the durable record is intact.

Storing or serving the photos themselves is out of scope. If photos in history are wanted
later, the marker is where a real URL would go.

## Acceptance criteria

- [x] A file part is persisted as a marker with its media type preserved and a sentinel URL in place of the data URL
- [x] No base64 image data reaches the database
- [x] Tests cover image parts being reduced to markers with their media type preserved
- [x] A replayed conversation renders a placeholder tile where the photo was, rather than a broken image or nothing at all
- [x] File parts are dropped before conversion to model messages, so a replayed day never sends the model an image it cannot resolve
- [x] Sending a label photo still works end to end as it does today: the live message carries the image to the model and the agent reads the figures off it

## Blocked by

- `02-todays-conversation-persists.md`
