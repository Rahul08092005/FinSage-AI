// Small reusable component-library piece, per Person 4's Phase 1 task
// ("Component library"). More cards (Net Worth, Goals, etc.) build on this
// in Phase 2.
export function Card({
  title,
  value,
  accent = "teal",
}: {
  title: string;
  value: string;
  accent?: "teal" | "orange";
}) {
  const accentClass = accent === "teal" ? "border-teal" : "border-orange";
  return (
    <div className={`rounded-xl border-t-4 ${accentClass} bg-white p-5 shadow-sm`}>
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-semibold text-navy">{value}</p>
    </div>
  );
}
