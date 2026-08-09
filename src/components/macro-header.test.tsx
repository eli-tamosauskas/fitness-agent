import { render, screen } from "@testing-library/react";

import { MacroHeader } from "@/components/macro-header";
import { SidebarProvider } from "@/components/ui/sidebar";
import type { MacroTotals } from "@/lib/nutrition/food-entry";

const TOTALS: MacroTotals = {
  calories: 400,
  protein: 30,
  carbs: 40,
  fat: 12,
};

/** The header carries the day list's trigger, which needs the list's context. */
function renderHeader(header: React.ReactElement) {
  return render(<SidebarProvider>{header}</SidebarProvider>);
}

describe("MacroHeader", () => {
  it("shows the viewed day's totals against the targets", () => {
    renderHeader(<MacroHeader totals={TOTALS} />);

    expect(
      screen.getByRole("progressbar", { name: "Calories" }),
    ).toHaveTextContent("400 / 2400");
  });

  it("names the date when the day being viewed is not today", () => {
    renderHeader(<MacroHeader totals={TOTALS} date="2026-05-13" />);

    expect(screen.getByText(/2026-05-13 log/i)).toBeInTheDocument();
  });

  it("says nothing about the date on today, where the rings need no label", () => {
    renderHeader(<MacroHeader totals={TOTALS} />);

    expect(screen.queryByText(/log$/i)).not.toBeInTheDocument();
  });

  it("offers a way to the day list, for the phone it is hidden on", () => {
    renderHeader(<MacroHeader totals={TOTALS} />);

    expect(
      screen.getByRole("button", { name: /toggle sidebar/i }),
    ).toBeInTheDocument();
  });
});
