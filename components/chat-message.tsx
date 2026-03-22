"use client";

import type { UIMessage } from "ai";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

function toolLabel(type: string, toolName?: string) {
  if (type === "dynamic-tool" && toolName) return toolName.replace(/_/g, " ");
  if (type.startsWith("tool-")) return type.slice(5).replace(/_/g, " ");
  return type;
}

function ToolStatusCard({ part }: { part: UIMessage["parts"][number] }) {
  const p = part as Record<string, unknown> & {
    type: string;
    state?: string;
    toolName?: string;
  };
  const label = toolLabel(p.type, p.toolName as string | undefined);
  const state = (p.state as string) ?? "pending";
  const statusColor =
    state === "output-available"
      ? "text-[var(--success)]"
      : state === "output-error"
        ? "text-[var(--danger-text)]"
        : "text-[var(--text-muted)]";

  return (
    <details
      className="mt-2 rounded-lg border border-[var(--border)] bg-[var(--code-bg)] text-left text-xs"
      open={state !== "output-available"}
    >
      <summary className="cursor-pointer select-none px-3 py-2 font-medium capitalize text-[var(--text-secondary)]">
        {label}{" "}
        <span className={statusColor}>({state.replace(/-/g, " ")})</span>
      </summary>
      <div className="max-h-48 overflow-auto border-t border-[var(--border)] px-3 py-2 font-mono text-[10px] text-[var(--text-muted)]">
        <pre className="whitespace-pre-wrap break-all">
          {JSON.stringify(
            {
              input: p.input,
              output: p.output,
              errorText: p.errorText,
            },
            null,
            2,
          )}
        </pre>
      </div>
    </details>
  );
}

export function ChatMessageRow({ message }: { message: UIMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`mb-3 flex ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[min(100%,520px)] rounded-2xl px-4 py-2 text-sm ${
          isUser
            ? "bg-[var(--accent-muted)] text-[var(--text-primary)]"
            : "border border-[var(--border)] bg-[var(--surface-raised)] text-[var(--text-primary)]"
        }`}
      >
        {message.parts.map((part, i) => {
          if (part.type === "text") {
            return (
              <div
                key={`${message.id}-t-${i}`}
                className="markdown-body text-[0.925rem] leading-relaxed [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_li]:my-0.5 [&_a]:text-[var(--accent)] [&_code]:rounded [&_code]:bg-[var(--code-bg)] [&_code]:px-1"
              >
                <Markdown remarkPlugins={[remarkGfm]}>{part.text}</Markdown>
              </div>
            );
          }
          if (part.type === "reasoning") {
            return (
              <p
                key={`${message.id}-r-${i}`}
                className="mt-1 text-xs italic text-[var(--text-muted)]"
              >
                {part.text}
              </p>
            );
          }
          if (part.type === "step-start") return null;
          if (part.type === "dynamic-tool" || part.type.startsWith("tool-")) {
            return (
              <ToolStatusCard key={`${message.id}-tool-${i}`} part={part} />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}
