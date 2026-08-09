import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { DayScreen } from "@/components/day-screen";
import type { DayView } from "@/lib/day-view";

// The same two reaches the chat's own tests stub: a router jsdom does not have,
// and a server function that would open the database.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/actions", () => ({ deleteFoodEntry: vi.fn() }));

const TODAY = "2026-05-15";

/** A day as the read seam hands it over, with one thing said on it. */
function day(date: string, said: string): DayView {
  return {
    date,
    today: TODAY,
    isToday: date === TODAY,
    isFuture: false,
    tracked: true,
    totals: { calories: 0, protein: 0, carbs: 0, fat: 0 },
    entries: [],
    messages: [
      { id: "1", role: "user", parts: [{ type: "text", text: said }] },
    ],
    dates: [TODAY, "2026-05-13", "2026-05-11"],
  };
}

describe("DayScreen", () => {
  it("shows the conversation of the day it was handed", () => {
    render(<DayScreen day={day("2026-05-13", "a chicken burrito")} />);

    expect(screen.getByText("a chicken burrito")).toBeInTheDocument();
  });

  it("swaps the conversation when another past day is opened", () => {
    const { rerender } = render(
      <DayScreen day={day("2026-05-13", "a chicken burrito")} />,
    );

    rerender(<DayScreen day={day("2026-05-11", "a protein bar")} />);

    expect(screen.getByText("a protein bar")).toBeInTheDocument();
    expect(screen.queryByText("a chicken burrito")).not.toBeInTheDocument();
  });
});
