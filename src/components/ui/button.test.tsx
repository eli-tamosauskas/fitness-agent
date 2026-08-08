import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its children as a button", () => {
    render(<Button>Log workout</Button>);

    expect(
      screen.getByRole("button", { name: "Log workout" }),
    ).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(<Button onClick={onClick}>Log workout</Button>);
    await user.click(screen.getByRole("button", { name: "Log workout" }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it("does not call onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();

    render(
      <Button disabled onClick={onClick}>
        Log workout
      </Button>,
    );
    await user.click(screen.getByRole("button", { name: "Log workout" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
