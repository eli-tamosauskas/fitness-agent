import { render, screen } from "@testing-library/react";

import { DayNavigation } from "@/components/day-navigation";
import { SidebarProvider } from "@/components/ui/sidebar";

/** Today, whenever these run — the list is given its days, not told to find them. */
const TODAY = "2026-05-15";

function renderNavigation(dates: string[], viewing = TODAY) {
  render(
    <SidebarProvider>
      <DayNavigation dates={dates} viewing={viewing} today={TODAY} />
    </SidebarProvider>,
  );
}

/** The rows as a reader sees them, in the order they are read. */
function rows() {
  return screen
    .getAllByRole("link")
    .map((link) => [link.textContent, link.getAttribute("href")]);
}

describe("DayNavigation", () => {
  it("lists the days it was given, in the order it was given them", () => {
    renderNavigation([TODAY, "2026-05-13", "2026-05-11"]);

    expect(rows()).toEqual([
      ["Today", "/"],
      ["2026-05-13", "/2026-05-13"],
      ["2026-05-11", "/2026-05-11"],
    ]);
  });

  it("lists today even when it is the only day there is", () => {
    renderNavigation([TODAY]);

    expect(rows()).toEqual([["Today", "/"]]);
  });

  it("still names today when a past day is the one being read", () => {
    renderNavigation([TODAY, "2026-05-13"], "2026-05-13");

    expect(screen.getByRole("link", { name: "Today" })).toBeInTheDocument();
  });

  it("marks the day being read, and only that one", () => {
    renderNavigation([TODAY, "2026-05-13", "2026-05-11"], "2026-05-13");

    expect(screen.getByRole("link", { current: "page" })).toHaveTextContent(
      "2026-05-13",
    );
  });
});
