const links = ["Dashboard", "Transactions", "Budgets", "Goals", "AI Advisor"];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <nav className="space-y-1">
        {links.map((label) => (
          <div
            key={label}
            className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-400"
            title="Wired up in Phase 2"
          >
            {label}
          </div>
        ))}
      </nav>
    </aside>
  );
}
