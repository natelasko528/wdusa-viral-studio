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
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--surface-raised)] px-4">
          <span className="font-semibold tracking-tight">WDUSA Viral Studio</span>
          <ThemeToggle />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4">{children}</main>
      </div>
      <NavMobile />
      {showChatFab ? (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="fixed bottom-[4.5rem] right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-[var(--accent-text)] shadow-lg md:bottom-6 md:right-6"
          aria-label="Open AI chat"
        >
          AI
        </button>
      ) : null}
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
