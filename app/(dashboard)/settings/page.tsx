"use client";

import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const KEYS = [
  "DATABASE_URL",
  "CREATOMATE_API_KEY",
  "CREATOMATE_TEMPLATE_ID",
  "CREATOMATE_EMAIL",
  "CREATOMATE_PASSWORD",
  "OPENAI_API_KEY",
  "GHL_API_TOKEN",
  "GHL_LOCATION_ID",
] as const;

export default function SettingsPage() {
  const [env, setEnv] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/settings/env-status");
      const data = (await res.json()) as { env?: Record<string, boolean> };
      if (res.ok) setEnv(data.env ?? null);
    })();
  }, []);

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Theme, environment readiness, and quick links.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          Theme
        </h2>
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Toggle is also in the header on every page.
        </p>
        <div className="mt-3">
          <ThemeToggle />
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          Environment variables
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Shows whether each key is non-empty on the server (never the secret
          value).
        </p>
        <ul className="mt-3 space-y-2 font-mono text-xs">
          {env
            ? KEYS.map((k) => (
                <li key={k} className="flex justify-between gap-4">
                  <span className="text-[var(--text-secondary)]">{k}</span>
                  <span
                    className={
                      env[k]
                        ? "text-[var(--success)]"
                        : "text-[var(--danger-text)]"
                    }
                  >
                    {env[k] ? "set" : "missing"}
                  </span>
                </li>
              ))
            : KEYS.map((k) => (
                <li key={k} className="text-[var(--text-muted)]">
                  {k} …
                </li>
              ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          Links
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          <li>
            <a
              href="https://cloud.prisma.io/"
              className="text-[var(--accent)] underline"
              target="_blank"
              rel="noreferrer"
            >
              Prisma Cloud console
            </a>
          </li>
          <li>
            <a
              href="https://app.creatomate.com/"
              className="text-[var(--accent)] underline"
              target="_blank"
              rel="noreferrer"
            >
              Creatomate dashboard
            </a>
          </li>
          <li>
            <a
              href="https://vercel.com/docs/environment-variables"
              className="text-[var(--accent)] underline"
              target="_blank"
              rel="noreferrer"
            >
              Vercel environment variables
            </a>{" "}
            — set <code className="rounded bg-[var(--code-bg)] px-1">OPENAI_API_KEY</code>{" "}
            for production chat.
          </li>
        </ul>
      </section>
    </div>
  );
}
