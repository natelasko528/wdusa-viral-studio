"use client";

import { Button, Input, Select, Textarea } from "@/components/ui";
import { Card, CardTitle, CardDescription } from "@/components/ui/card";

type Account = { id: string; name: string };
type User = { id: string; name: string };

type Props = {
  accounts: Account[];
  users: User[];
  selectedAccounts: string[];
  onToggleAccount: (id: string) => void;
  userId: string;
  onUserChange: (v: string) => void;
  scheduleDate: string;
  onDateChange: (v: string) => void;
  summary: string;
  onSummaryChange: (v: string) => void;
  onSchedule: () => void;
  scheduleMsg: string;
};

export function ScheduleForm({
  accounts,
  users,
  selectedAccounts,
  onToggleAccount,
  userId,
  onUserChange,
  scheduleDate,
  onDateChange,
  summary,
  onSummaryChange,
  onSchedule,
  scheduleMsg,
}: Props) {
  return (
    <Card>
      <CardTitle>Schedule to GoHighLevel</CardTitle>
      <CardDescription>
        Render must finish with an output URL. Pick accounts and a future time.
      </CardDescription>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-xs font-medium text-[var(--text-muted)]">Accounts</p>
          <div className="mt-1 max-h-32 space-y-1 overflow-y-auto rounded-lg border border-[var(--border)] p-2">
            {accounts.length === 0 ? (
              <span className="text-xs text-[var(--text-muted)]">
                None loaded (check GHL credentials in Settings).
              </span>
            ) : (
              accounts.map((a) => (
                <label
                  key={a.id}
                  className="flex cursor-pointer items-center gap-2 rounded px-1 py-0.5 text-sm hover:bg-[var(--border)]"
                >
                  <input
                    type="checkbox"
                    checked={selectedAccounts.includes(a.id)}
                    onChange={() => onToggleAccount(a.id)}
                    className="accent-[var(--accent)]"
                  />
                  {a.name}
                </label>
              ))
            )}
          </div>
        </div>

        <Select
          label="User (required by GHL API)"
          value={userId}
          onChange={(e) => onUserChange(e.target.value)}
        >
          <option value="">Select…</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name}
            </option>
          ))}
        </Select>

        <Input
          label="Schedule (local datetime)"
          type="datetime-local"
          value={scheduleDate}
          onChange={(e) => onDateChange(e.target.value)}
        />

        <Textarea
          label="Caption / summary"
          value={summary}
          onChange={(e) => onSummaryChange(e.target.value)}
          rows={2}
        />

        <Button variant="secondary" className="w-full" data-testid="studio-schedule-post" onClick={onSchedule}>
          Schedule post
        </Button>

        {scheduleMsg ? (
          <p className="text-xs text-[var(--text-muted)]">{scheduleMsg}</p>
        ) : null}
      </div>
    </Card>
  );
}
