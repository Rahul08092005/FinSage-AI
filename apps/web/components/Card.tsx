export function Card({
  title,
  value,
  accent = "teal",
}: {
  title: string;
  value: string;
  accent?: "teal" | "orange";
}) {
  const isTeal = accent === "teal";

  return (
    <div className="group rounded-lg border border-line bg-paper-sheet p-5 shadow-subtle transition-all hover:border-line-dark/60">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted">
          {title}
        </p>
        <span
          className={`h-2 w-2 rounded-full ${
            isTeal ? "bg-teal/80 ring-4 ring-teal/15" : "bg-gold/80 ring-4 ring-gold/15"
          }`}
        />
      </div>

      <div className="my-3 border-b border-line/70" />

      <p className="font-serif text-2xl font-semibold tracking-tight text-ink tabular-nums lg:text-3xl">
        {value}
      </p>
    </div>
  );
}
