import { render, screen } from "@testing-library/react";

import { MacroRing } from "@/components/macro-ring";

describe("MacroRing", () => {
  it("reads zero against its target when nothing is consumed", () => {
    render(
      <MacroRing label="Calories" consumed={0} target={2400} unit="cal" />,
    );

    const ring = screen.getByRole("progressbar", { name: "Calories" });
    expect(ring).toHaveAttribute("aria-valuenow", "0");
    expect(ring).toHaveTextContent("0 / 2400");
  });

  it("reports progress as a percentage of the target", () => {
    render(<MacroRing label="Protein" consumed={45} target={180} unit="g" />);

    const ring = screen.getByRole("progressbar", { name: "Protein" });
    expect(ring).toHaveAttribute("aria-valuenow", "25");
    expect(ring).toHaveTextContent("45 / 180");
  });

  it("does not read as complete just short of the target", () => {
    render(
      <MacroRing label="Calories" consumed={2399} target={2400} unit="cal" />,
    );

    const ring = screen.getByRole("progressbar", { name: "Calories" });
    expect(ring).not.toHaveAttribute("aria-valuenow", "100");

    const arc = ring.querySelector("[data-slot='macro-ring-arc']");
    expect(Number(arc?.getAttribute("stroke-dashoffset"))).toBeGreaterThan(0);
  });

  describe("when consumption exceeds the target", () => {
    it("caps the arc at full instead of wrapping past it", () => {
      render(<MacroRing label="Carbs" consumed={360} target={240} unit="g" />);

      const ring = screen.getByRole("progressbar", { name: "Carbs" });
      expect(ring).toHaveAttribute("aria-valuenow", "100");

      const arc = ring.querySelector("[data-slot='macro-ring-arc']");
      expect(arc).toHaveAttribute("stroke-dashoffset", "0");
    });

    it("marks the ring as over so it takes the over colour token", () => {
      render(<MacroRing label="Fat" consumed={90} target={80} unit="g" />);

      const ring = screen.getByRole("progressbar", { name: "Fat" });
      expect(ring).toHaveAttribute("data-over", "true");
      expect(ring.querySelector("[data-slot='macro-ring-arc']")).toHaveClass(
        "stroke-over",
      );
    });

    it("still shows the true consumed figure so the overage is visible", () => {
      render(<MacroRing label="Fat" consumed={90} target={80} unit="g" />);

      expect(
        screen.getByRole("progressbar", { name: "Fat" }),
      ).toHaveTextContent("90 / 80");
    });
  });

  it("is not marked as over when consumption exactly meets the target", () => {
    render(<MacroRing label="Fat" consumed={80} target={80} unit="g" />);

    const ring = screen.getByRole("progressbar", { name: "Fat" });
    expect(ring).toHaveAttribute("data-over", "false");
    expect(ring).toHaveAttribute("aria-valuenow", "100");
  });
});
