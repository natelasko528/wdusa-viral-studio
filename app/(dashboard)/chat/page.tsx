"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { ChatMessageRow } from "@/components/chat-message";

export default function ChatPage() {
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, error, clearError } = useChat({
    transport,
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const busy = status === "streaming" || status === "submitted";

  return (
    <div className="mx-auto flex h-[calc(100dvh-8rem)] max-w-3xl flex-col md:h-[calc(100dvh-6rem)]">
      <div className="mb-3 shrink-0">
        <h1 className="text-xl font-semibold">AI chat</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Full-page agent — same model as the slide-out panel. History is
          session-only.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Try: “Build a reel script about triple pane windows and start a
            render.”
          </p>
        ) : (
          messages.map((m) => <ChatMessageRow key={m.id} message={m} />)
        )}
        <div ref={endRef} />
      </div>

      {error ? (
        <div className="mt-2 text-xs text-[var(--danger-text)]">
          {error.message}{" "}
          <button type="button" className="underline" onClick={() => clearError()}>
            Dismiss
          </button>
        </div>
      ) : null}

      <form
        className="mt-3 flex shrink-0 flex-col gap-2 border-t border-[var(--border)] pt-3"
        onSubmit={(e) => {
          e.preventDefault();
          const t = input.trim();
          if (!t || busy) return;
          void sendMessage({ text: t });
          setInput("");
        }}
      >
        <div className="flex gap-2">
          {busy ? (
            <button
              type="button"
              onClick={() => void stop()}
              className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
            >
              Stop
            </button>
          ) : null}
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={3}
          placeholder="Message…"
          className="w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={busy || !input.trim()}
          className="rounded-lg bg-[var(--accent)] py-2.5 text-sm font-semibold text-[var(--accent-text)] disabled:opacity-50"
        >
          {busy ? "Sending…" : "Send"}
        </button>
      </form>
    </div>
  );
}
