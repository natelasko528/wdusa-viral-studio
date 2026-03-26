"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { NavSidebar } from "@/components/nav-sidebar";
import { NavMobile } from "@/components/nav-mobile";
import { ChatPanel } from "@/components/chat-panel";

export function DashboardChrome({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();
  const showChatFab = pathname !== "/chat";

  return (
    <div className="flex min-h-screen bg-[var(--surface)] text-[var(--text-primary)]">
      <NavSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)]/90 px-4 backdrop-blur-md md:px-6">
          <span className="font-[family-name:var(--font-syne)] text-sm font-bold tracking-tight md:hidden">
            WDUSA Viral Studio
          </span>
          <span className="hidden md:block" />
          <ThemeToggle />
        </header>
        <main className="page-enter min-h-0 flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>
      <NavMobile />
      {showChatFab ? (
        <button
          type="button"
          data-testid="chat-fab"
          onClick={() => setChatOpen(true)}
          className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)] text-xs font-bold text-[var(--accent-text)] shadow-lg transition-transform hover:scale-105 active:scale-95 bottom-20 right-4 md:bottom-6 md:right-6 md:h-14 md:w-14 md:text-sm"
          aria-label="Open AI chat"
        >
          AI
        </button>
      ) : null}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
