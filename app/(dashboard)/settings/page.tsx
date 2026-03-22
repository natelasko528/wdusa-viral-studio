"use client";

import { useCallback, useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

const ENV_KEYS = [
  "DATABASE_URL",
  "CREATOMATE_API_KEY",
  "CREATOMATE_TEMPLATE_ID",
  "CREATOMATE_EMAIL",
  "CREATOMATE_PASSWORD",
  "OPENAI_API_KEY",
  "GHL_API_TOKEN",
  "GHL_LOCATION_ID",
  "SETTINGS_ENCRYPTION_KEY",
  "SETTINGS_ADMIN_PIN",
] as const;

const CRED_LABELS: Record<string, string> = {
  CREATOMATE_API_KEY: "Creatomate API key",
  OPENAI_API_KEY: "OpenAI API key",
  GHL_API_TOKEN: "GoHighLevel API token",
  GHL_LOCATION_ID: "GHL location ID",
  CREATOMATE_EMAIL: "Creatomate login email",
  CREATOMATE_PASSWORD: "Creatomate login password",
  CREATOMATE_TEMPLATE_ID: "Default Creatomate template ID (seed / reference)",
};

type CredentialItem = {
  name: string;
  fromEnv: boolean;
  fromDatabase: boolean;
  hint?: string;
};

export default function SettingsPage() {
  const [env, setEnv] = useState<Record<string, boolean> | null>(null);
  const [effective, setEffective] = useState<Record<string, boolean> | null>(
    null,
  );
  const [credItems, setCredItems] = useState<CredentialItem[]>([]);
  const [encryptionConfigured, setEncryptionConfigured] = useState(false);
  const [requiresAdminPin, setRequiresAdminPin] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const loadEnv = useCallback(async () => {
    const res = await fetch("/api/settings/env-status");
    const data = (await res.json()) as {
      env?: Record<string, boolean>;
      effective?: Record<string, boolean>;
    };
    if (res.ok) {
      setEnv(data.env ?? null);
      setEffective(data.effective ?? null);
    }
  }, []);

  const loadCredentials = useCallback(async () => {
    const res = await fetch("/api/settings/credentials");
    const data = (await res.json()) as {
      items?: CredentialItem[];
      encryptionConfigured?: boolean;
      requiresAdminPin?: boolean;
      error?: string;
    };
    if (!res.ok) {
      setErr(data.error ?? "Failed to load credentials");
      return;
    }
    setErr("");
    setCredItems(data.items ?? []);
    setEncryptionConfigured(Boolean(data.encryptionConfigured));
    setRequiresAdminPin(Boolean(data.requiresAdminPin));
  }, []);

  useEffect(() => {
    void loadEnv();
    void loadCredentials();
  }, [loadEnv, loadCredentials]);

  const saveCredential = async (name: string) => {
    const value = drafts[name]?.trim();
    if (!value) {
      setErr("Enter a value before saving.");
      return;
    }
    setSaving(name);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          value,
          adminPin: requiresAdminPin ? adminPin : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setDrafts((d) => ({ ...d, [name]: "" }));
      setMsg(`Saved ${name} to encrypted database storage.`);
      await loadCredentials();
      await loadEnv();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  const removeCredential = async (name: string) => {
    if (!confirm(`Remove ${name} from the database? Environment variables are not changed.`)) {
      return;
    }
    setSaving(name);
    setMsg("");
    setErr("");
    try {
      const res = await fetch("/api/settings/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          adminPin: requiresAdminPin ? adminPin : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Remove failed");
      setMsg(`Removed ${name} from database.`);
      await loadCredentials();
      await loadEnv();
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Theme, environment readiness, and encrypted API keys stored in
          Postgres.
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
          Encrypted credentials (database)
        </h2>
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Values are encrypted with{" "}
          <code className="rounded bg-[var(--code-bg)] px-1">
            SETTINGS_ENCRYPTION_KEY
          </code>{" "}
          before storage. The browser never receives full secrets after save —
          only a short hint. If the same key exists in Vercel env, the env value
          takes precedence over the database.
        </p>

        {!encryptionConfigured ? (
          <p className="mt-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-text)]">
            Add{" "}
            <code className="rounded bg-[var(--code-bg)] px-1">
              SETTINGS_ENCRYPTION_KEY
            </code>{" "}
            to your server environment (32 random bytes as base64, 64-char hex,
            or a long passphrase), redeploy, then save keys here.
          </p>
        ) : null}

        {requiresAdminPin ? (
          <label className="mt-4 block text-xs font-medium text-[var(--text-muted)]">
            Admin PIN (matches{" "}
            <code className="rounded bg-[var(--code-bg)] px-1">
              SETTINGS_ADMIN_PIN
            </code>
            )
            <input
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              autoComplete="off"
              className="mt-1 block w-full rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 text-sm"
            />
          </label>
        ) : (
          <p className="mt-3 text-xs text-[var(--text-muted)]">
            Optional: set{" "}
            <code className="rounded bg-[var(--code-bg)] px-1">
              SETTINGS_ADMIN_PIN
            </code>{" "}
            on the server to require a PIN for saving or removing stored
            credentials.
          </p>
        )}

        {msg ? (
          <p className="mt-3 text-sm text-[var(--success)]">{msg}</p>
        ) : null}
        {err ? (
          <p className="mt-3 text-sm text-[var(--danger-text)]">{err}</p>
        ) : null}

        <ul className="mt-4 space-y-4">
          {credItems.map((item) => (
            <li
              key={item.name}
              className="rounded-lg border border-[var(--border)] p-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-medium">{item.name}</p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {CRED_LABELS[item.name] ?? item.name}
                  </p>
                </div>
                <div className="text-right text-[10px] text-[var(--text-muted)]">
                  {item.fromEnv ? (
                    <span className="text-[var(--success)]">env</span>
                  ) : null}
                  {item.fromEnv && item.fromDatabase ? " · " : null}
                  {item.fromDatabase ? (
                    <span className="text-[var(--accent)]">database</span>
                  ) : null}
                  {!item.fromEnv && !item.fromDatabase ? (
                    <span>not set</span>
                  ) : null}
                  {item.hint ? (
                    <span className="ml-1 font-mono">({item.hint})</span>
                  ) : null}
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  placeholder="Paste new value to store in DB…"
                  value={drafts[item.name] ?? ""}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [item.name]: e.target.value }))
                  }
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-mono text-xs"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={
                      saving === item.name ||
                      !encryptionConfigured ||
                      !(drafts[item.name]?.trim())
                    }
                    onClick={() => void saveCredential(item.name)}
                    className="rounded-lg bg-[var(--accent)] px-3 py-2 text-xs font-medium text-[var(--accent-text)] disabled:opacity-50"
                  >
                    {saving === item.name ? "Saving…" : "Save to DB"}
                  </button>
                  {item.fromDatabase ? (
                    <button
                      type="button"
                      disabled={saving === item.name}
                      onClick={() => void removeCredential(item.name)}
                      className="rounded-lg border border-[var(--danger-border)] px-3 py-2 text-xs text-[var(--danger-text)] disabled:opacity-50"
                    >
                      Clear DB
                    </button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-raised)] p-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          Environment variables
        </h2>
        <p className="mt-1 text-xs text-[var(--text-muted)]">
          Raw env presence and whether each integration is satisfied (env or DB
          store).
        </p>
        <ul className="mt-3 space-y-1 font-mono text-xs">
          {ENV_KEYS.map((k) => (
            <li key={k} className="flex justify-between gap-4 border-b border-[var(--border)] py-1 last:border-0">
              <span className="text-[var(--text-secondary)]">{k}</span>
              <span className="shrink-0 text-right">
                <span
                  className={
                    env?.[k]
                      ? "text-[var(--success)]"
                      : "text-[var(--text-muted)]"
                  }
                >
                  env:{env?.[k] ? "on" : "off"}
                </span>
                {effective && k in effective ? (
                  <span
                    className={`ml-2 ${
                      effective[k]
                        ? "text-[var(--success)]"
                        : "text-[var(--danger-text)]"
                    }`}
                  >
                    ok:{effective[k] ? "yes" : "no"}
                  </span>
                ) : null}
              </span>
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
            </a>
          </li>
        </ul>
      </section>
    </div>
  );
}
