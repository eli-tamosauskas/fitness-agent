import { render, screen } from "@testing-library/react";

import { MacroHeader } from "@/components/macro-header";
import type { MacroTotals } from "@/lib/nutrition/food-entry";

const TOTALS: MacroTotals = {
  calories: 400,
  protein: 30,
  carbs: 40,
  fat: 12,
};

describe("MacroHeader", () => {
  it("shows the viewed day's totals against the targets", () => {
    render(<MacroHeader totals={TOTALS} />);

    expect(
      screen.getByRole("progressbar", { name: "Calories" }),
    ).toHaveTextContent("400 / 2400");
  });

  it("names the date when the day being viewed is not today", () => {
    render(<MacroHeader totals={TOTALS} date="2026-05-13" />);

    expect(screen.getByText(/2026-05-13 log/i)).toBeInTheDocument();
  });

  it("says nothing about the date on today, where the rings need no label", () => {
    render(<MacroHeader totals={TOTALS} />);

    expect(screen.queryByText(/log$/i)).not.toBeInTheDocument();
  });
});
