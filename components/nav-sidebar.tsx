"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/studio", label: "Studio" },
  { href: "/kb", label: "Knowledge Base" },
  { href: "/templates", label: "Templates" },
  { href: "/chat", label: "Chat" },
  { href: "/settings", label: "Settings" },
] as const;

export function NavSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[200px] shrink-0 flex-col gap-1 border-r border-[var(--border)] bg-[var(--surface-raised)] p-3 md:flex">
      <p className="mb-2 px-2 text-xs font-medium uppercase tracking-wide text-[var(--text-muted)]">
        Navigate
      </p>
      {NAV.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-lg px-3 py-2 text-sm transition-colors ${
              active
                ? "bg-[var(--accent-muted)] font-medium text-[var(--accent)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--border)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </aside>
  );
}
