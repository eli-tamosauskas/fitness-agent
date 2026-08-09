// @vitest-environment node
import { describe, expect, it } from "vitest";

import { describeIsoDate } from "./local-date";

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
