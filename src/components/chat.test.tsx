import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { Chat } from "@/components/chat";
import type { NutritionUIMessage } from "@/lib/chat/message";
import type { FoodEntryInput } from "@/lib/nutrition/food-entry";

// The chat navigates after a write; nothing here writes, and jsdom has no
// router to navigate with.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

// The server function reaches the database, which cannot be bundled into a
// browser environment. What it does when called is the food log's test, not
// this one's — here it only has to exist.
vi.mock("@/app/actions", () => ({ deleteFoodEntry: vi.fn() }));

/** A protein bar logged off its label. */
const BAR: FoodEntryInput = {
  description: "protein bar",
  source: "label",
  quantity: 1,
  unit: "serving",
  calories: 210,
  protein: 20,
  carbs: 21,
  fat: 7,
};

/** A logged entry as it comes back from the tool, inside a reply. */
const LOGGED: NutritionUIMessage = {
  id: "2",
  role: "assistant",
  parts: [
    {
      type: "tool-logFoodEntry",
      toolCallId: "call-1",
      state: "output-available",
      input: BAR,
      output: {
        ...BAR,
        id: 7,
        date: "2026-05-13",
        consumed: { calories: 210, protein: 20, carbs: 21, fat: 7 },
      },
    },
  ],
};

const SAID: NutritionUIMessage = {
  id: "1",
  role: "user",
  parts: [{ type: "text", text: "a protein bar" }],
};

describe("Chat", () => {
  describe("on a day that can be written to", () => {
    it("offers the composer", () => {
      render(<Chat initialMessages={[]} readOnly={false} />);

      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("invites the user to log something when nothing has been said", () => {
      render(<Chat initialMessages={[]} readOnly={false} />);

      expect(screen.getByText(/log what you ate/i)).toBeInTheDocument();
    });

    it("offers to delete a logged entry", () => {
      render(<Chat initialMessages={[SAID, LOGGED]} readOnly={false} />);

      expect(
        screen.getByRole("button", { name: /delete protein bar/i }),
      ).toBeInTheDocument();
    });
  });

  describe("on a read-only day", () => {
    it("does not render the composer", () => {
      render(<Chat initialMessages={[SAID]} readOnly />);

      expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    });

    it("does not render the delete control on a logged entry", () => {
      render(<Chat initialMessages={[SAID, LOGGED]} readOnly />);

      expect(
        screen.queryByRole("button", { name: /delete protein bar/i }),
      ).not.toBeInTheDocument();
    });

    it("still shows what was logged", () => {
      render(<Chat initialMessages={[SAID, LOGGED]} readOnly />);

      expect(
        screen.getByRole("group", { name: /protein bar/i }),
      ).toBeInTheDocument();
    });

    it("states that there was no conversation rather than inviting one", () => {
      render(<Chat initialMessages={[]} readOnly />);

      expect(screen.getByText(/no conversation/i)).toBeInTheDocument();
      expect(screen.queryByText(/log what you ate/i)).not.toBeInTheDocument();
    });
  });
});
