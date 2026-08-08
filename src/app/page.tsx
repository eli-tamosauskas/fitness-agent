import { MacroHeader } from "@/components/macro-header";

/**
 * The single page. It will eventually read today's entries and derive the
 * totals here on the server; for now nothing is logged, so every ring reads
 * zero against its target.
 */
export default function Page() {
  return (
    <div className="flex flex-1 flex-col">
      <h1 className="sr-only">Nutrition tracker</h1>
      <MacroHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8" />
    </div>
  );
}
