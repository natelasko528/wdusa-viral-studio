"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useRef, useState } from "react";
import { ChatMessageRow } from "@/components/chat-message";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ChatPanel({ open, onClose }: Props) {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  if (!open) return null;

  const busy = status === "streaming" || status === "submitted";

  return (
    <>
      <button
        type="button"
        className="fixed inset-0 z-40 bg-black/40 md:bg-black/20"
        aria-label="Close chat overlay"
        onClick={onClose}
      />
      <div
        className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[min(100vw,480px)] flex-col border-l border-[var(--border)] bg-[var(--surface)] shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="wdusa-chat-title"
      >
        <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
          <h2 id="wdusa-chat-title" className="text-sm font-semibold">
            WDUSA assistant
          </h2>
          <div className="flex gap-2">
            {busy ? (
              <button
                type="button"
                onClick={() => void stop()}
                className="rounded-md border border-[var(--border)] px-2 py-1 text-xs"
              >
                Stop
              </button>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[var(--border)] px-2 py-1 text-xs"
            >
              Close
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Ask for hooks, RenderScript reels, renders, or GHL scheduling.
              Default profile is{" "}
              <span className="font-mono">nate_landing</span>.
            </p>
          ) : (
            messages.map((m) => <ChatMessageRow key={m.id} message={m} />)
          )}
          <div ref={endRef} />
        </div>

        {error ? (
          <div className="border-t border-[var(--danger-border)] bg-[var(--danger-bg)] px-4 py-2 text-xs text-[var(--danger-text)]">
            {error.message}
            <button
              type="button"
              className="ml-2 underline"
              onClick={() => clearError()}
            >
              Dismiss
            </button>
          </div>
        ) : null}

        <form
          className="border-t border-[var(--border)] p-3"
          onSubmit={(e) => {
            e.preventDefault();
            const t = input.trim();
            if (!t || busy) return;
            void sendMessage({ text: t });
            setInput("");
          }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={3}
            placeholder="Message…"
            className="mb-2 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)]"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="w-full rounded-lg bg-[var(--accent)] py-2 text-sm font-medium text-[var(--accent-text)] disabled:opacity-50"
          >
            {busy ? "Sending…" : "Send"}
          </button>
        </form>
      </div>
    </>
  );
}
