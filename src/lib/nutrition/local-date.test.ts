// @vitest-environment node
import { describe, expect, it } from "vitest";

import { APP_TIME_ZONE, describeIsoDate, today } from "./local-date";

/**
 * "Last Tuesday" is only resolvable if the agent knows which day of the week
 * today is, so the weekday travels with the date in the system prompt.
 */
describe("describeIsoDate", () => {
  it("names the weekday alongside the date", () => {
    expect(describeIsoDate("2026-05-13")).toBe("2026-05-13 (Wednesday)");
  });

  it("reads the date as a local day rather than a UTC instant", () => {
    // Parsed as UTC midnight this would slip to the previous day west of
    // Greenwich, and every relative date the agent resolved would be off by one.
    expect(describeIsoDate("2026-01-01")).toBe("2026-01-01 (Thursday)");
  });
});

/**
 * The day is the server's to decide, and it decides it from a timezone it is
 * handed. The timezone being an argument is what lets these tests hold the
 * instant still and vary the place instead of mocking the clock.
 */
describe("today", () => {
  it("resolves one instant to different days in different timezones", () => {
    // 22:30 UTC: already tomorrow in Vilnius, still mid-afternoon in California.
    const moment = new Date("2026-05-13T22:30:00Z");

    expect(today("Europe/Vilnius", moment)).toBe("2026-05-14");
    expect(today("America/Los_Angeles", moment)).toBe("2026-05-13");
  });

  it("follows daylight saving rather than a fixed offset", () => {
    // Vilnius is +02:00 in winter and +03:00 in summer. Either offset applied
    // year-round puts one of these instants on the wrong side of midnight.
    expect(today(APP_TIME_ZONE, new Date("2026-12-31T21:30:00Z"))).toBe(
      "2026-12-31",
    );
    expect(today(APP_TIME_ZONE, new Date("2026-06-30T21:30:00Z"))).toBe(
      "2026-07-01",
    );
  });

  it("reads the host clock when given no instant", () => {
    // The one thing the caller in the app relies on: no second argument.
    expect(today(APP_TIME_ZONE)).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
