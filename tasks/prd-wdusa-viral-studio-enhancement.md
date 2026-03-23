# PRD: WDUSA Viral Studio — Application Enhancement Program

## 1. Introduction / Overview

**WDUSA Viral Studio** is an internal/operator-facing Next.js 15 application that combines:

- **Creatomate** for video rendering (template-based modifications or programmatic RenderScript).
- A **Postgres + Prisma** knowledge base (KB) seeded from Nate’s landing page and the corporate Window Depot Milwaukee site.
- **GoHighLevel (GHL)** Social Planner integration to schedule Reels/posts from rendered MP4 URLs.
- An **AI assistant** (Vercel AI SDK + OpenAI `gpt-4o`) with tools for KB search, renders, GHL listing/scheduling, template tweaks, and browser-automation task queuing.

**Problem this PRD addresses:** The codebase already delivers a vertical slice (studio → render → schedule; KB browse; templates; settings with encrypted credential storage). To make the app “the best it can be,” work should systematically close gaps in **security**, **operator UX**, **data lifecycle**, **reliability/observability**, and **quality assurance**—without losing the focused WDUSA workflow.

**Methodology (how to use this document):**

1. Implement stories in **dependency order** (security and data integrity before polish).
2. Each story should be **one focused session**; split if it grows.
3. **Verify** with lint, tests where applicable, and browser checks for UI stories.

---

## 2. Goals

- **G1 — Trustworthy operations:** Sensitive APIs and destructive actions are protected; secrets remain well-scoped; abuse surfaces (unauthenticated ingest, chat) are bounded.
- **G2 — End-to-end clarity:** Operators can see **render history**, **scheduled post outcomes**, and **browser task status** without opening the database or devtools.
- **G3 — Faster iteration:** KB and templates are easier to curate, refresh, and validate against brand rules.
- **G4 — Reliable delivery:** Failures are visible, retriable, and debuggable (logs, correlation IDs, user-visible errors).
- **G5 — Sustainable codebase:** Automated tests beyond trivial asserts; documented env and deploy checklist kept in sync with code.

---

## 3. Current State (Repository Snapshot)

| Area | What exists | Notable gaps |
|------|-------------|--------------|
| **Routing** | `/` → `/studio`; dashboard shell with Studio, Chat, KB, Templates, Settings | No `middleware` auth; dashboard is effectively public if deployed |
| **Studio** | Template vs RenderScript modes, polling, GHL account/user pickers, schedule | Errors often swallowed; no job list/history; datetime-local timezone semantics unclear for teams |
| **Chat** | Full-page + slide-out panel; tools mirror backend capabilities | History **session-only**; no saved “campaigns” or pinned context |
| **KB** | Read API + UI filters; ingest creates `SourcePage` + `page_chunk` facts | **POST `/api/kb/ingest` unauthenticated**; no dedup/versioning strategy; no operator “approve/edit fact” flow |
| **Templates** | CRUD-ish via API; browser agent hooks for Creatomate | Export RenderScript feedback mostly via console/DB message |
| **Settings** | Env readiness + encrypted DB credentials + optional admin PIN for writes | Read endpoints may still leak **whether** keys exist; entire app access not gated |
| **Data model** | `RenderJob`, `ScheduledPost`, `BrowserTask`, `VideoTemplate`, `KbFact` | Scheduled posts not surfaced in UI; no sync job to reconcile GHL status |
| **Testing** | `scripts/assert-modifications.ts` | No API/component tests; no Playwright smoke for critical paths |
| **Docs** | Strong README for Vercel/DB/GHL | Operational runbooks (failure modes, rate limits) thin |

---

## 4. User Stories

### US-001: Authenticate dashboard access

**Description:** As an operator, I want the dashboard to require sign-in so that API keys, GHL scheduling, and KB ingest cannot be used by anonymous visitors.

**Acceptance Criteria:**

- [ ] Unauthenticated users cannot access `/studio`, `/chat`, `/kb`, `/templates`, `/settings` (or policy-defined subset).
- [ ] API routes that mutate data or consume paid/limited quotas (`/api/chat`, `/api/renders`, `/api/ghl/*`, `/api/kb/ingest`, `/api/browser/*`, credential writes) require the same auth (session, API key header, or Vercel protection—**pick one approach and document it**).
- [ ] Local dev story documented (how to bypass or use test credentials).
- [ ] Typecheck/lint passes.

---

### US-002: Protect and audit KB ingest

**Description:** As an admin, I want KB re-ingest to be authorized and traceable so the database cannot be filled by arbitrary POSTs.

**Acceptance Criteria:**

- [ ] `POST /api/kb/ingest` requires authentication (aligned with US-001).
- [ ] Response includes summary: URLs processed, facts created, duration (no need for full raw dump).
- [ ] Optional: admin-only role if multi-user auth is introduced.
- [ ] Typecheck/lint passes.

---

### US-003: Render job history and detail

**Description:** As an operator, I want to list past renders with status and output URL so I can reuse or schedule without re-rendering.

**Acceptance Criteria:**

- [ ] New UI section or page lists recent `RenderJob` rows (pagination or “last N”), filterable by status and campaign profile.
- [ ] Clicking a row shows `inputSnapshot` summary (template vs renderscript), timestamps, error text, output link.
- [ ] “Open in Studio for schedule” deep-link preselects job when possible (or documents manual steps if out of scope).
- [ ] Typecheck/lint passes.
- [ ] Verify in browser.

---

### US-004: Scheduled posts ledger

**Description:** As an operator, I want to see scheduled posts stored in the app and their GHL linkage so I can confirm scheduling succeeded.

**Acceptance Criteria:**

- [ ] UI lists `ScheduledPost` records with caption snippet, schedule time, status, media URL, linked render job.
- [ ] Displays `ghlPostId` when present; clear state when null.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser.

---

### US-005: Optional GHL status reconciliation

**Description:** As an operator, I want to refresh a post’s status from GHL when IDs exist so the ledger matches reality.

**Acceptance Criteria:**

- [ ] “Refresh from GHL” action (per row or batch) calls GHL read API where available and updates `ScheduledPost.status` or stores last error in a defined field (schema change acceptable if justified).
- [ ] Graceful failure when token lacks scope or ID is unknown.
- [ ] Typecheck/lint passes.

---

### US-006: Browser task status UX

**Description:** As an operator, I want Playwright-backed tasks to show progress in the UI instead of checking the database.

**Acceptance Criteria:**

- [ ] Templates (or dedicated) page lists recent `BrowserTask` rows: type, status, created time, error.
- [ ] Poll or SSE for in-progress tasks; completed tasks show structured output preview (truncated JSON ok).
- [ ] Typecheck/lint passes.
- [ ] Verify in browser.

---

### US-007: Chat persistence and workspace context

**Description:** As an operator, I want named chat threads with history so I can run multiple campaigns without losing prior scripts.

**Acceptance Criteria:**

- [ ] Persist threads per user (if auth) or per browser (if not)—**document choice**.
- [ ] Create/rename/select thread; messages reload on return.
- [ ] Tool calls remain functional; no regression in streaming.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser.

---

### US-008: Studio reliability and feedback

**Description:** As an operator, I want clear errors and loading states when templates, GHL, or renders fail.

**Acceptance Criteria:**

- [ ] Replace silent `catch { /* ignore */ }` patterns with user-visible toasts or inline errors (dedupe noise).
- [ ] Failed fetches for templates/GHL show actionable text (e.g. missing env key hint linking to Settings).
- [ ] Typecheck/lint passes.
- [ ] Verify in browser.

---

### US-009: Timezone-aware scheduling

**Description:** As an operator, I want to schedule in my business timezone without ambiguity.

**Acceptance Criteria:**

- [ ] UI states timezone (explicit selector or “uses browser timezone” copy).
- [ ] Server stores UTC; API contract documented; GHL payload remains ISO-8601.
- [ ] Typecheck/lint passes.

---

### US-010: KB curation (edit / deprecate facts)

**Description:** As an operator, I want to correct bad chunks or mark facts inactive without re-running ingest blindly.

**Acceptance Criteria:**

- [ ] Authenticated UI to edit `KbFact.content` or toggle `active` (schema addition) with audit fields (`updatedAt`, optional `updatedBy`).
- [ ] Inactive facts excluded from `search_kb` tool and default KB API unless “include inactive”.
- [ ] Typecheck/lint passes.
- [ ] Verify in browser.

---

### US-011: Automated test coverage for critical logic

**Description:** As a maintainer, I want automated tests so refactors do not break render merging or GHL payloads.

**Acceptance Criteria:**

- [ ] Add test runner (e.g. Vitest or Node test) integrated into `npm test` alongside or replacing the single assert script.
- [ ] Tests cover: `mergeModifications`, `buildWdusaReel` snapshot (stable keys), `scheduleRenderToGhl` payload shape (mocked fetch).
- [ ] CI runs `npm test` (document in README if CI file added).
- [ ] Tests pass; lint passes.

---

### US-012: Observability

**Description:** As an operator or developer, I want request/render correlation in logs to debug failures quickly.

**Acceptance Criteria:**

- [ ] Structured log lines for render start/finish, GHL schedule, ingest (no secrets in logs).
- [ ] Optional `x-request-id` propagation on API responses.
- [ ] Typecheck/lint passes.

---

## 5. Functional Requirements

- **FR-1:** The system must enforce a single documented authentication model for dashboard and sensitive API routes.
- **FR-2:** The system must not allow unauthenticated KB ingest or credential mutation.
- **FR-3:** The system must expose render jobs and scheduled posts in the UI with stable sorting (newest first by default).
- **FR-4:** The system must preserve existing Creatomate + GHL flows; enhancements must be backward compatible unless versioned.
- **FR-5:** The system must surface errors from downstream APIs (Creatomate, GHL, OpenAI) to the operator in a safe form (no raw tokens).
- **FR-6:** The AI assistant must continue to use KB-grounded tools; any persistence change must not weaken tool authorization boundaries.
- **FR-7:** Environment readiness indicators in Settings must remain accurate when combining env vars and DB-stored credentials.

---

## 6. Non-Goals (Out of Scope for This Program)

- **NG-1:** Full multi-tenant SaaS for arbitrary customers (location/brand model may stay WDUSA-focused).
- **NG-2:** Replacing Creatomate or GHL with alternate vendors.
- **NG-3:** Mobile-native apps (responsive web improvements are in scope only if tied to operator tasks).
- **NG-4:** Full marketing analytics (impressions, ROI) unless GHL exposes them with clear API support.

---

## 7. Design Considerations

- Reuse existing dashboard chrome, CSS variables (`--accent`, surfaces, borders), and typography patterns for new pages.
- Prefer **tables + detail drawers** for history views to match current information-dense operator UI.
- Empty states should link to Settings when configuration is missing.

---

## 8. Technical Considerations

- **Auth options:** NextAuth/Auth.js, Clerk, or Vercel deployment protection + server-side API keys—choose based on who operates the app (single team vs broader users).
- **Prisma migrations:** Any new columns (`KbFact.active`, audit fields) need migrations and seed compatibility.
- **Rate limits:** Consider OpenAI and Creatomate quotas; optional per-IP or per-user limits on `/api/chat` and `/api/renders`.
- **Long-running routes:** Browser/Playwright routes may need Vercel **fluid** or background job pattern if timeouts persist.
- **Security review:** Ensure `env-status` and credential list endpoints leak minimal information post-auth.

---

## 9. Success Metrics

- **M1:** Zero unauthenticated calls succeed against ingest/credential/render/chat endpoints in production (verified by automated smoke or manual checklist).
- **M2:** Median time to confirm “render + schedule succeeded” drops because operators use in-app ledgers instead of external tools.
- **M3:** Test suite catches at least one realistic regression class (e.g. modification merge or schedule payload).
- **M4:** Support/debug time decreases via visible errors and correlated logs (qualitative review after one release cycle).

---

## 10. Open Questions

1. **Who is the audience?** Only Nate/internal team vs external franchisees (drives auth choice and multi-location modeling).
2. **Should GHL `locationId` be configurable per session** instead of a single env var?
3. **KB strategy:** Should ingest **replace** prior facts per URL, **version** them, or **append** only with dedup keys?
4. **Chat data retention:** How long should threads be kept; any PII considerations?
5. **Browser agent:** Will Creatomate credentials remain server-only with PIN-gated settings, or move entirely to env on Vercel?

---

## 11. Suggested Implementation Phases

| Phase | Focus | Stories |
|-------|--------|---------|
| **P0 — Safety** | Close public abuse surfaces | US-001, US-002 |
| **P1 — Operator truth** | History and clarity | US-003, US-004, US-008 |
| **P2 — Depth** | Reconciliation, browser UX, timezone | US-005, US-006, US-009 |
| **P3 — Stickiness** | Chat persistence, KB curation | US-007, US-010 |
| **P4 — Engineering excellence** | Tests and observability | US-011, US-012 |

---

## Document Control

| Field | Value |
|--------|--------|
| **Product** | WDUSA Viral Studio |
| **Repository** | `wdusa-viral-studio` (Next.js 15, Prisma, Vercel) |
| **Version** | 1.0 |
| **Status** | Draft for implementation breakdown |
