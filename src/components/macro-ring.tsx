import type { MacroUnit } from "@/lib/nutrition/targets";
import { cn } from "@/lib/utils";

const RADIUS = 26;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export type MacroRingProps = {
  /** Human name of the target, e.g. "Protein". */
  label: string;
  /** Amount consumed so far today, in the target's unit. */
  consumed: number;
  /** The daily target. */
  target: number;
  /** Unit suffix shown beside the raw figures. */
  unit: MacroUnit;
};

/**
 * A single daily target as a progress ring with its raw consumed-over-target
 * figures beside it. The arc is capped at full: exceeding the target recolours
 * the ring rather than wrapping it, and the raw figure still shows the true
 * amount so the overage is readable.
 */
export function MacroRing({ label, consumed, target, unit }: MacroRingProps) {
  const isComplete = consumed >= target;
  const isOver = consumed > target;
  // Capped at full, so an overage recolours the ring rather than wrapping it.
  const filled = Math.min(consumed / target, 1);
  // Only a met target may read as 100 — otherwise rounding would disguise
  // "just short" as complete, to both the arc and a screen reader.
  const percent = isComplete ? 100 : Math.min(Math.round(filled * 100), 99);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={percent}
      aria-valuetext={`${label}: ${consumed} of ${target} ${unit}`}
      data-over={isOver}
      className="flex min-w-0 items-center gap-3"
    >
      <svg viewBox="0 0 64 64" className="size-16 shrink-0 -rotate-90">
        <circle
          cx={32}
          cy={32}
          r={RADIUS}
          fill="none"
          strokeWidth={7}
          className="stroke-muted"
        />
        <circle
          data-slot="macro-ring-arc"
          cx={32}
          cy={32}
          r={RADIUS}
          fill="none"
          strokeWidth={7}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - filled)}
          className={isOver ? "stroke-over" : "stroke-primary"}
        />
      </svg>
      <div className="flex min-w-0 flex-col">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span
          className={cn(
            "text-sm font-medium tabular-nums",
            isOver && "text-over",
          )}
        >
          {consumed} / {target}
          <span className="text-muted-foreground"> {unit}</span>
        </span>
      </div>
    </div>
  );
}
