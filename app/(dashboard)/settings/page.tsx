"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Input } from "@/components/ui";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "@/components/theme-provider";

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
  CREATOMATE_TEMPLATE_ID: "Default Creatomate template ID",
};

type CredentialItem = { name: string; fromEnv: boolean; fromDatabase: boolean; hint?: string };

export default function SettingsPage() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [env, setEnv] = useState<Record<string, boolean> | null>(null);
  const [effective, setEffective] = useState<Record<string, boolean> | null>(null);
  const [credItems, setCredItems] = useState<CredentialItem[]>([]);
  const [encryptionConfigured, setEncryptionConfigured] = useState(false);
  const [requiresAdminPin, setRequiresAdminPin] = useState(false);
  const [adminPin, setAdminPin] = useState("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const loadEnv = useCallback(async () => {
    const res = await fetch("/api/settings/env-status");
    const data = (await res.json()) as { env?: Record<string, boolean>; effective?: Record<string, boolean> };
    if (res.ok) { setEnv(data.env ?? null); setEffective(data.effective ?? null); }
  }, []);

  const loadCredentials = useCallback(async () => {
    const res = await fetch("/api/settings/credentials");
    const data = (await res.json()) as { items?: CredentialItem[]; encryptionConfigured?: boolean; requiresAdminPin?: boolean; error?: string };
    if (!res.ok) { toast.error(data.error ?? "Failed to load credentials"); return; }
    setCredItems(data.items ?? []);
    setEncryptionConfigured(Boolean(data.encryptionConfigured));
    setRequiresAdminPin(Boolean(data.requiresAdminPin));
  }, [toast]);

  useEffect(() => { void loadEnv(); void loadCredentials(); }, [loadEnv, loadCredentials]);

  const saveCredential = async (name: string) => {
    const value = drafts[name]?.trim();
    if (!value) { toast.error("Enter a value before saving."); return; }
    setSaving(name);
    try {
      const res = await fetch("/api/settings/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, value, adminPin: requiresAdminPin ? adminPin : undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setDrafts((d) => ({ ...d, [name]: "" }));
      toast.success(`Saved ${name} to encrypted database storage.`);
      await loadCredentials();
      await loadEnv();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  const removeCredential = async (name: string) => {
    if (!confirm(`Remove ${name} from the database?`)) return;
    setSaving(name);
    try {
      const res = await fetch("/api/settings/credentials", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, adminPin: requiresAdminPin ? adminPin : undefined }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Remove failed");
      toast.success(`Removed ${name} from database.`);
      await loadCredentials();
      await loadEnv();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          Theme, environment readiness, and encrypted API keys stored in Postgres.
        </p>
      </div>

      <Card>
        <CardTitle>Appearance</CardTitle>
        <div className="mt-3 flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-[var(--text-secondary)] capitalize">{theme} mode</span>
        </div>
      </Card>

      <Card>
        <CardTitle>Encrypted credentials</CardTitle>
        <CardDescription>
          Values are encrypted with <code className="rounded bg-[var(--code-bg)] px-1">SETTINGS_ENCRYPTION_KEY</code> before storage.
          Env values take precedence over the database.
        </CardDescription>

        {!encryptionConfigured ? (
          <div className="mt-3 rounded-lg border border-[var(--danger-border)] bg-[var(--danger-bg)] p-3 text-sm text-[var(--danger-text)]">
            Add <code className="rounded bg-[var(--code-bg)] px-1">SETTINGS_ENCRYPTION_KEY</code> to your server environment, then redeploy.
          </div>
        ) : null}

        {requiresAdminPin ? (
          <div className="mt-4">
            <Input
              label="Admin PIN"
              type="password"
              value={adminPin}
              onChange={(e) => setAdminPin(e.target.value)}
              autoComplete="off"
            />
          </div>
        ) : null}

        <ul className="mt-4 space-y-3">
          {credItems.map((item) => (
            <li key={item.name} className="rounded-lg border border-[var(--border)] p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-mono text-xs font-medium">{item.name}</p>
                  <p className="text-[11px] text-[var(--text-muted)]">{CRED_LABELS[item.name] ?? item.name}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  {item.fromEnv ? <Badge variant="success">env</Badge> : null}
                  {item.fromDatabase ? <Badge variant="accent">database</Badge> : null}
                  {!item.fromEnv && !item.fromDatabase ? <Badge>not set</Badge> : null}
                  {item.hint ? <span className="ml-1 font-mono text-[10px] text-[var(--text-muted)]">({item.hint})</span> : null}
                </div>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  placeholder="Paste new value…"
                  value={drafts[item.name] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [item.name]: e.target.value }))}
                  autoComplete="off"
                  className="min-w-0 flex-1 rounded-lg border border-[var(--border)] bg-[var(--input-bg)] px-3 py-2 font-mono text-xs transition-colors focus:border-[var(--accent)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    disabled={saving === item.name || !encryptionConfigured || !(drafts[item.name]?.trim())}
                    loading={saving === item.name}
                    onClick={() => void saveCredential(item.name)}
                  >
                    Save to DB
                  </Button>
                  {item.fromDatabase ? (
                    <Button variant="danger" size="sm" disabled={saving === item.name} onClick={() => void removeCredential(item.name)}>
                      Clear
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>Environment variables</CardTitle>
        <CardDescription>Raw env presence and effective status for each integration.</CardDescription>
        <ul className="mt-3 space-y-1 font-mono text-xs">
          {ENV_KEYS.map((k) => (
            <li key={k} className="flex justify-between gap-4 border-b border-[var(--border)] py-1.5 last:border-0">
              <span className="text-[var(--text-secondary)]">{k}</span>
              <span className="flex items-center gap-2 shrink-0">
                <Badge variant={env?.[k] ? "success" : "default"}>
                  env:{env?.[k] ? "on" : "off"}
                </Badge>
                {effective && k in effective ? (
                  <Badge variant={effective[k] ? "success" : "danger"}>
                    {effective[k] ? "ready" : "missing"}
                  </Badge>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle>External links</CardTitle>
        <ul className="mt-3 space-y-2 text-sm">
          {[
            { href: "https://cloud.prisma.io/", label: "Prisma Cloud console" },
            { href: "https://app.creatomate.com/", label: "Creatomate dashboard" },
            { href: "https://vercel.com/docs/environment-variables", label: "Vercel environment variables" },
          ].map((link) => (
            <li key={link.href}>
              <a href={link.href} className="text-[var(--accent)] underline" target="_blank" rel="noreferrer">
                {link.label} <span className="text-[var(--text-muted)]">↗</span>
              </a>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
