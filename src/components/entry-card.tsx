"use client";

import { Loader2Icon, XIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { FoodEntry, LoggedEntry } from "@/lib/nutrition/food-entry";
import { MACRO_DISPLAY } from "@/lib/nutrition/targets";

/** Where an entry's numbers came from, as the user would describe it. */
const SOURCE_LABELS: Record<FoodEntry["source"], string> = {
  label: "From the label",
  usda: "From USDA FoodData Central",
  stated: "As stated",
};

/** How much was eaten, in whichever unit it was given in. */
function amountEaten({ quantity, unit }: FoodEntry): string {
  if (unit === "g") return `${quantity}g`;
  return `${quantity} ${quantity === 1 ? "serving" : "servings"}`;
}

export type EntryCardProps = {
  entry: LoggedEntry;
  /** Deletes the entry. Rejecting leaves the card standing. */
  onDelete: (id: number) => void | Promise<void>;
};

/**
 * One committed entry, shown back so the user can check what was recorded
 * without asking. The control on it deletes the entry outright rather than
 * hiding the card — the one-click correction for an obvious misread, which is
 * why it sits here rather than in a menu.
 */
export function EntryCard({ entry, onDelete }: EntryCardProps) {
  const [state, setState] = useState<"present" | "deleting" | "deleted">(
    "present",
  );
  const [failed, setFailed] = useState(false);

  const remove = async () => {
    setState("deleting");
    setFailed(false);
    try {
      await onDelete(entry.id);
      setState("deleted");
    } catch {
      // The entry is still there, so the card had better still show it.
      setFailed(true);
      setState("present");
    }
  };

  if (state === "deleted") {
    return (
      <p className="text-muted-foreground text-sm">
        Deleted {entry.description}.
      </p>
    );
  }

  return (
    <>
      <Card
        role="group"
        aria-label={entry.description}
        size="sm"
        className="w-full max-w-sm"
      >
        <CardHeader>
          <CardTitle>{entry.description}</CardTitle>
          <CardDescription>
            {amountEaten(entry)} · {SOURCE_LABELS[entry.source]}
          </CardDescription>
          <CardAction>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Delete ${entry.description}`}
              disabled={state === "deleting"}
              onClick={remove}
            >
              {state === "deleting" ? (
                <Loader2Icon className="size-4 animate-spin" />
              ) : (
                <XIcon className="size-4" />
              )}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-4 gap-2">
            {MACRO_DISPLAY.map(({ key, label, unit }) => (
              <div key={key} className="flex min-w-0 flex-col">
                <dt className="text-muted-foreground text-xs">{label}</dt>
                <dd className="text-sm font-medium tabular-nums">
                  {entry.consumed[key]}
                  <span className="text-muted-foreground"> {unit}</span>
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {failed && (
        <p role="alert" className="text-destructive text-sm">
          Could not delete that entry. Try again.
        </p>
      )}
    </>
  );
}
