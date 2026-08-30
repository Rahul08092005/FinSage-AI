"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Dashboard", href: "/" },
  { label: "Transactions", href: "/transactions" },
  { label: "Budgets", href: "/budgets" },
  { label: "Goals", href: "/goals" },
  { label: "AI Advisor", href: "#", disabled: true },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 border-r border-line bg-paper-sheet p-4 md:block">
      <div className="mb-3 px-3 py-1">
        <p className="text-[10px] font-bold tracking-widest text-ink-subtle uppercase">
          Ledger Books
        </p>
      </div>

      <nav className="space-y-1">
        {links.map((link) => {
          if (link.disabled) {
            return (
              <div
                key={link.label}
                className="flex items-center justify-between rounded-md px-3 py-2 text-xs font-normal text-ink-subtle cursor-not-allowed opacity-60"
                title="Wired up in Phase 3"
              >
                <span>{link.label}</span>
                <span className="text-[9px] uppercase tracking-wider text-ink-subtle bg-paper px-1.5 py-0.5 rounded border border-line">
                  Phase 3
                </span>
              </div>
            );
          }

          const isActive = pathname === link.href;

          return (
            <Link
              key={link.label}
              href={link.href}
              className={`group flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors ${
                isActive
                  ? "bg-paper font-semibold text-ink shadow-subtle border-l-2 border-teal"
                  : "font-normal text-ink-muted hover:bg-paper/70 hover:text-ink"
              }`}
            >
              <span>{link.label}</span>
              {isActive && (
                <span className="h-1.5 w-1.5 rounded-full bg-teal"></span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-line/80 pt-4 px-3">
        <p className="font-serif text-[11px] italic text-ink-muted">
          Archival double-entry precision for personal wealth.
        </p>
      </div>
    </aside>
  );
}
