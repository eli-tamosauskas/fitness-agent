# The sidebar lists tracked days

Status: ready-for-agent

## Parent

`.scratch/chat-history/spec.md`

## What to build

A sidebar to the left of the chat lists the days that have been tracked, newest first, so
a past day can be found without remembering its date. Today's row reads "Today"; every
other row reads its date as `YYYY-MM-DD`. Selecting a row opens that day.

Built from the **shadcn sidebar component** — off-canvas with a trigger on mobile, fixed
on desktop. It is not currently installed and must be added. Per the project's component
sourcing order, this is preferred to hand-rolling a drawer.

It **lists days that have food entries**, with today always pinned regardless of whether
anything has been logged yet — the day you are on is never missing from the list you are
navigating. The list comes from the day-read seam built in `04-past-day-read-only-url.md`;
this ticket does not add a second read path.

**Known consequence, accepted:** a past day with a conversation but no logged entries is
not reachable from the sidebar. A day where nothing was logged is not a day worth listing,
and there is no existing data in that state.

No pagination, virtualisation, or cap. A single user accrues on the order of 365 rows a
year; a virtualised list is not worth building.

Navigating away mid-stream aborts the stream. There is no stream resumption.

The sidebar's contents are deliberately **not** covered end-to-end — the seam tests in
`04` already establish them.

## Acceptance criteria

- [ ] The shadcn sidebar component is installed and used, rather than a hand-rolled drawer
- [ ] The sidebar lists days that have food entries, ordered newest first
- [ ] Today appears in the list even when nothing has been logged yet
- [ ] Today's row reads "Today"; every other row reads `YYYY-MM-DD`
- [ ] Selecting a row navigates to that day's URL
- [ ] On mobile the sidebar is off-canvas behind a trigger; on desktop it is fixed and always visible
- [ ] The day list comes from the existing day-read seam — no second read path is added
- [ ] No pagination, virtualisation, or cap is built
- [ ] Navigating away mid-stream aborts the stream
- [ ] The page still does not scroll horizontally at mobile width

## Blocked by

- `04-past-day-read-only-url.md`
