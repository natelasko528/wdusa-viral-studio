"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/studio", label: "Studio" },
  { href: "/kb", label: "KB" },
  { href: "/templates", label: "Templates" },
  { href: "/chat", label: "Chat" },
  { href: "/settings", label: "Settings" },
] as const;

export function NavMobile() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[var(--border)] bg-[var(--surface-raised)] md:hidden"
      aria-label="Primary"
    >
      {TABS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center py-2 text-[10px] font-medium ${
              active
                ? "text-[var(--accent)]"
                : "text-[var(--text-muted)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
