"use client";

type Mode = "template" | "renderscript";

type Props = {
  mode: Mode;
  onChange: (m: Mode) => void;
};

export function RenderModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-[var(--code-bg)] p-1">
      {(["template", "renderscript"] as const).map((m) => (
        <button
          key={m}
          type="button"
          data-testid={`studio-mode-${m}`}
          aria-pressed={mode === m}
          onClick={() => onChange(m)}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
            mode === m
              ? "bg-[var(--surface-raised)] text-[var(--text-primary)] shadow-sm"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
        >
          {m === "template" ? "Template" : "RenderScript"}
        </button>
      ))}
    </div>
  );
}
