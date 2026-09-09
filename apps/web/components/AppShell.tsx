"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { useToken } from "./AuthGate";

interface AppShellProps {
  children: React.ReactNode | ((token: string) => React.ReactNode);
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function AppShell({ children, title, subtitle, actions }: AppShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const token = useToken();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !token) {
      // Unauthenticated user attempting to access an authenticated route -> redirect to /login
      const redirectParam = pathname ? `?redirect=${encodeURIComponent(pathname)}` : "";
      router.push(`/login${redirectParam}`);
    }
  }, [mounted, token, pathname, router]);

  // Loading state while checking authentication
  if (!mounted || !token) {
    return (
      <div className="flex min-h-screen flex-col bg-paper">
        <Navbar />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink border-t-transparent" />
            <p className="text-xs font-medium text-ink-muted">Authenticating workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper">
      {/* Top Application Header */}
      <Navbar />

      {/* Main Workspace: Sidebar + Dashboard Content */}
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8">
          {title && (
            <div className="flex flex-col gap-1 border-b border-line pb-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink md:text-3xl">
                  {title}
                </h1>
                {subtitle && <p className="mt-1 text-xs text-ink-muted">{subtitle}</p>}
              </div>
              {actions && <div className="mt-2 sm:mt-0 flex items-center gap-2">{actions}</div>}
            </div>
          )}

          <div className="mt-6">
            {typeof children === "function" ? children(token) : children}
          </div>
        </main>
      </div>
    </div>
  );
}
