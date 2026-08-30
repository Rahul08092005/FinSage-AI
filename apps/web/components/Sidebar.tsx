import Link from "next/link";

const links = [
  { label: "Dashboard", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Budgets", href: "/budgets" },
  { label: "Goals", href: "/goals" },
  { label: "AI Advisor", href: "#", disabled: true },
];

export function Sidebar() {
  return (
    <aside className="hidden w-56 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <nav className="space-y-1">
        {links.map((link) =>
          link.disabled ? (
            <div
              key={link.label}
              className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-slate-400"
              title="Wired up in Phase 3"
            >
              {link.label}
            </div>
          ) : (
            <Link
              key={link.label}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-navy"
            >
              {link.label}
            </Link>
          )
        )}
      </nav>
    </aside>
  );
}
