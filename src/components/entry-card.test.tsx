import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { EntryCard } from "@/components/entry-card";
import type { LoggedEntry } from "@/lib/nutrition/food-entry";

/** A protein bar logged off its label: 210 cal a bar, one and a half eaten. */
const BAR: LoggedEntry = {
  id: 7,
  date: "2026-05-13",
  description: "protein bar",
  source: "label",
  quantity: 1.5,
  unit: "serving",
  calories: 210,
  protein: 20,
  carbs: 21,
  fat: 7,
  consumed: { calories: 315, protein: 30, carbs: 31.5, fat: 10.5 },
};

describe("EntryCard", () => {
  it("shows what was recorded, with the macros as actually consumed", () => {
    render(<EntryCard entry={BAR} onDelete={vi.fn()} />);

    const card = screen.getByRole("group", { name: /protein bar/i });
    expect(card).toHaveTextContent("315");
    expect(card).toHaveTextContent("30");
    expect(card).toHaveTextContent("31.5");
    expect(card).toHaveTextContent("10.5");
    // The base per-serving figure is not what was eaten, so it is not shown.
    expect(card).not.toHaveTextContent("210");
  });

  it("says how much was eaten and where the numbers came from", () => {
    render(<EntryCard entry={BAR} onDelete={vi.fn()} />);

    const card = screen.getByRole("group", { name: /protein bar/i });
    expect(card).toHaveTextContent("1.5 servings");
    expect(card).toHaveTextContent(/label/i);
  });

  it("counts a single serving in the singular", () => {
    render(<EntryCard entry={{ ...BAR, quantity: 1 }} onDelete={vi.fn()} />);

    expect(screen.getByRole("group")).toHaveTextContent("1 serving");
  });

  it("gives a weighed amount in grams", () => {
    render(
      <EntryCard
        entry={{ ...BAR, source: "usda", quantity: 200, unit: "g" }}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("group")).toHaveTextContent("200g");
  });

  describe("the delete control", () => {
    it("is absent on a day that cannot be written to", () => {
      render(<EntryCard entry={BAR} />);

      expect(
        screen.queryByRole("button", { name: /delete/i }),
      ).not.toBeInTheDocument();
      // The entry itself still reads exactly as it does on a live day.
      expect(screen.getByRole("group")).toHaveTextContent("315");
    });

    it("deletes the entry it stands for", async () => {
      const onDelete = vi.fn().mockResolvedValue(undefined);
      render(<EntryCard entry={BAR} onDelete={onDelete} />);

      await userEvent.click(
        screen.getByRole("button", { name: /delete protein bar/i }),
      );

      expect(onDelete).toHaveBeenCalledWith(7);
    });

    it("says the entry is gone rather than leaving its figures up", async () => {
      render(<EntryCard entry={BAR} onDelete={vi.fn()} />);

      await userEvent.click(
        screen.getByRole("button", { name: /delete protein bar/i }),
      );

      expect(await screen.findByText(/deleted/i)).toBeInTheDocument();
      expect(screen.queryByText("315")).not.toBeInTheDocument();
    });

    it("keeps the figures up when the deletion fails", async () => {
      const onDelete = vi.fn().mockRejectedValue(new Error("no connection"));
      render(<EntryCard entry={BAR} onDelete={onDelete} />);

      await userEvent.click(
        screen.getByRole("button", { name: /delete protein bar/i }),
      );

      expect(await screen.findByRole("alert")).toHaveTextContent(
        /could not delete/i,
      );
      expect(screen.getByRole("group")).toHaveTextContent("315");
    });
  });
});
