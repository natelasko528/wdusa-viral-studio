# PRD: WDUSA Viral Studio — Comprehensive Application Enhancement Plan

**Version:** 1.0.0
**Date:** 2026-03-23
**Status:** Draft
**Author:** AI Agent (comprehensive codebase audit)

---

## 1. Introduction / Overview

**WDUSA Viral Studio** is a Next.js 15 internal tool for Window Depot USA Milwaukee that renders short-form video (Reels) via Creatomate, manages a knowledge base of curated marketing facts, and schedules social posts to GoHighLevel. It also provides AI chat with tool-calling for scriptwriting and automation.

This PRD defines a comprehensive enhancement plan to transform the application from its current MVP state into a polished, production-grade internal platform. The plan addresses **9 domains**: architecture & reliability, security, UI/UX & design system, data layer, feature gaps, AI capabilities, performance, testing, and developer experience.

### Current State Audit Summary

| Domain | Maturity | Key Findings |
|--------|----------|-------------|
| **Architecture** | MVP | No error boundaries, no middleware, monolithic page components (Studio = 470 lines) |
| **Security** | Critical gap | Zero authentication; credentials page is publicly accessible; no rate limiting |
| **UI/UX** | Functional | Generic Geist font, no animations, no empty states, no skeletons, no toast system |
| **Data layer** | Adequate | Missing GIN index on `campaignProfiles`; no caching; destructive seed |
| **Features** | Partial | No render history, no scheduling calendar, no dashboard analytics, no KB editing |
| **AI** | Strong foundation | Good tool set but chat history is session-only and panel/page don't share state |
| **Performance** | Unoptimized | Polling instead of webhooks, no API response caching, no optimistic updates |
| **Testing** | Minimal | Single assertion script; no unit, integration, or E2E tests |
| **DX** | Acceptable | Turbopack dev, Prisma CLI scripts, but no CI pipeline or pre-commit hooks |

---

## 2. Goals

- **G1:** Secure the application with authentication so only authorized users can access the dashboard and API routes.
- **G2:** Elevate the UI to a distinctive, polished design system with consistent components, animations, and responsive excellence.
- **G3:** Fill critical feature gaps — render history, scheduling calendar, campaign management, KB editing, and a real dashboard.
- **G4:** Make the AI chat a first-class citizen — persistent history, shared state between panel and page, prompt templates, and smarter context awareness.
- **G5:** Improve reliability with error boundaries, input validation, toast notifications, and proper API error responses.
- **G6:** Optimize performance with caching, webhooks, optimistic updates, and database indexing.
- **G7:** Establish a testing foundation with unit tests for critical lib modules, API route tests, and at minimum smoke E2E tests.
- **G8:** Improve developer experience with linting, CI, and documentation.

---

## 3. User Stories

### Epic 1: Security & Authentication

#### US-001: Basic Authentication Gate
**Description:** As an admin user, I want to log in with a password or PIN so that unauthorized users cannot access the studio.

**Acceptance Criteria:**
- [ ] A `/login` page exists with a password/PIN input
- [ ] Unauthenticated users are redirected to `/login` from any dashboard route
- [ ] API routes return 401 for unauthenticated requests
- [ ] Session persists across page refreshes (cookie-based)
- [ ] Logout button in the header clears the session
- [ ] Typecheck passes

#### US-002: Rate Limiting on Sensitive Routes
**Description:** As a system operator, I want rate limiting on authentication and credential endpoints so that brute-force attacks are mitigated.

**Acceptance Criteria:**
- [ ] `/api/settings/credentials` POST/DELETE limited to 10 requests per minute per IP
- [ ] `/api/login` (if added) limited to 5 attempts per minute per IP
- [ ] Exceeding the limit returns 429 with a `Retry-After` header
- [ ] Typecheck passes

---

### Epic 2: Design System & UI Foundation

#### US-003: Shared UI Component Library
**Description:** As a developer, I want a set of reusable, styled primitives (Button, Input, Select, Card, Badge, Textarea, Dialog) so that UI is consistent and pages are not 400+ lines of inline styling.

**Acceptance Criteria:**
- [ ] `components/ui/` directory with at least: `button.tsx`, `input.tsx`, `select.tsx`, `card.tsx`, `badge.tsx`, `textarea.tsx`, `dialog.tsx`
- [ ] Each component uses CSS variables from `globals.css` for theming
- [ ] Components accept standard HTML props via `React.ComponentProps`
- [ ] Existing pages refactored to use new primitives (at least Studio and Settings)
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-004: Toast / Notification System
**Description:** As a user, I want success/error/info messages as toast notifications so that feedback is visible regardless of scroll position and dismisses automatically.

**Acceptance Criteria:**
- [ ] A `ToastProvider` wraps the app in `layout.tsx`
- [ ] `useToast()` hook returns `{ toast }` function with `success`, `error`, `info` variants
- [ ] Toasts appear in the top-right corner, auto-dismiss after 5 seconds
- [ ] Toasts stack and animate in/out
- [ ] Studio and Settings pages use toast instead of inline `msg`/`err` state
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-005: Loading Skeletons & Empty States
**Description:** As a user, I want skeleton loading placeholders and rich empty states so that pages don't flash empty content.

**Acceptance Criteria:**
- [ ] `components/ui/skeleton.tsx` with pulse animation
- [ ] Templates page shows skeleton cards while loading
- [ ] KB page shows skeleton rows while loading
- [ ] Studio page shows skeleton for template dropdown while loading
- [ ] Each page with a list has a designed empty state with icon and action suggestion
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-006: Page Transition Animations
**Description:** As a user, I want subtle page-enter animations so that navigation feels smooth and intentional.

**Acceptance Criteria:**
- [ ] Main content area has a fade-up entry animation on route change
- [ ] Animation duration is 200–300ms, easing is `ease-out`
- [ ] Does not cause layout shift or flicker
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-007: Custom Branding & Typography
**Description:** As a stakeholder, I want the app to use WDUSA brand colors and a distinctive heading font so that it doesn't look like a generic Next.js starter.

**Acceptance Criteria:**
- [ ] Custom favicon (WDUSA-related, not default Vercel/Next.js icons)
- [ ] A distinctive display font for headings (e.g., a bold geometric or slab-serif loaded via `next/font/google`)
- [ ] Updated `metadata` in `layout.tsx` with proper OG image, description
- [ ] Light theme accent matches WDUSA gold/amber branding
- [ ] Public assets cleared of default Next.js SVGs (file.svg, globe.svg, vercel.svg, next.svg)
- [ ] Typecheck passes
- [ ] Verify in browser

---

### Epic 3: Dashboard & Analytics

#### US-008: Dashboard Home Page
**Description:** As a user, I want a dashboard home page (replacing the redirect to `/studio`) so that I can see an overview of recent activity at a glance.

**Acceptance Criteria:**
- [ ] `/` route renders a dashboard page (not a redirect)
- [ ] Shows 3 stat cards: total renders, renders this week, scheduled posts count
- [ ] Shows a "Recent Renders" table (last 10 jobs) with status badge, date, output link
- [ ] Shows a "Upcoming Scheduled Posts" list (next 5)
- [ ] Quick-action buttons: "New Render" → Studio, "Search KB" → KB, "Open Chat" → Chat
- [ ] Data fetched via API routes (new or reusing existing)
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-009: Render History Page
**Description:** As a user, I want to see all past render jobs so that I can track status, re-download outputs, or retry failed renders.

**Acceptance Criteria:**
- [ ] New page at `/renders` (added to nav)
- [ ] Table/list of all render jobs with columns: date, campaign, mode (template/renderscript), status badge, output link
- [ ] Click a row to expand details (input snapshot, Creatomate ID, error message if failed)
- [ ] Filter by status (all / rendering / succeeded / failed)
- [ ] Pagination or infinite scroll for large lists
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-010: Scheduling Calendar View
**Description:** As a user, I want a calendar view of scheduled posts so that I can visualize my content calendar and spot gaps.

**Acceptance Criteria:**
- [ ] New page at `/calendar` (added to nav)
- [ ] Monthly calendar grid showing scheduled posts on their date
- [ ] Each post shown as a small card with caption preview, status badge
- [ ] Click a post card to see details (media URL, GHL post ID, accounts)
- [ ] Previous/next month navigation
- [ ] Typecheck passes
- [ ] Verify in browser

---

### Epic 4: Studio Enhancements

#### US-011: Studio Page Component Decomposition
**Description:** As a developer, I want the Studio page broken into smaller, focused components so that it's maintainable and testable.

**Acceptance Criteria:**
- [ ] Studio page imports extracted components: `CampaignProfileSelect`, `RenderModeToggle`, `TemplateForm`, `RenderScriptForm`, `RenderStatus`, `ScheduleForm`
- [ ] Each sub-component is in its own file under `components/studio/`
- [ ] No single file exceeds 150 lines
- [ ] Behavior is identical to current Studio page
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-012: Inline Video Preview
**Description:** As a user, when my render succeeds, I want to see the video inline so that I don't have to open a new tab.

**Acceptance Criteria:**
- [ ] When `job.outputUrl` is available and status is `succeeded`, an HTML5 `<video>` player is shown
- [ ] Player has controls (play, pause, scrub, mute, fullscreen)
- [ ] Video is in a 9:16 container that fits the card width
- [ ] Download button below the player
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-013: AI-Assisted Script Generation in Studio
**Description:** As a user, I want a "Generate with AI" button in the Studio that fills in hook/subhead/CTA based on the campaign profile and an optional topic prompt.

**Acceptance Criteria:**
- [ ] "Generate with AI" button appears above the hook/subhead/CTA fields
- [ ] Clicking it opens a small modal or popover with a "Topic" text input and "Generate" button
- [ ] Backend calls OpenAI (via existing AI SDK) with KB context for the selected campaign profile
- [ ] Generated hook, subhead, and CTA are filled into the form fields
- [ ] User can accept, regenerate, or manually edit
- [ ] Typecheck passes
- [ ] Verify in browser

---

### Epic 5: Knowledge Base Enhancements

#### US-014: KB Fact CRUD (Create, Edit, Delete)
**Description:** As a user, I want to create, edit, and delete individual KB facts so that I can curate the knowledge base without re-running the seed.

**Acceptance Criteria:**
- [ ] "Add Fact" button on KB page opens a form (inline or modal) with: category, key, content, campaign profiles (multi-select), source URL
- [ ] Each fact card has "Edit" and "Delete" buttons
- [ ] Edit opens the form pre-filled; save calls PATCH on a new `/api/kb/[id]` route
- [ ] Delete shows confirmation dialog; calls DELETE on `/api/kb/[id]`
- [ ] New API routes: `PATCH /api/kb/[id]`, `DELETE /api/kb/[id]`, `POST /api/kb` (create)
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-015: KB Re-Ingest with Progress
**Description:** As a user, I want to trigger a KB re-ingest from the UI and see progress so that I can refresh data from source URLs.

**Acceptance Criteria:**
- [ ] "Re-Ingest Sources" button on KB page
- [ ] Button shows a loading spinner and disables while ingesting
- [ ] After completion, displays count of new facts added
- [ ] Toast notification on success or failure
- [ ] Typecheck passes
- [ ] Verify in browser

---

### Epic 6: AI Chat Improvements

#### US-016: Shared Chat State Between Panel and Page
**Description:** As a user, I want my chat conversation to persist when I switch between the slide-out panel and the full `/chat` page so that I don't lose context.

**Acceptance Criteria:**
- [ ] A `ChatProvider` context wraps the dashboard layout
- [ ] Both `ChatPanel` and `ChatPage` consume the same `useChat` instance from the provider
- [ ] Messages typed in the panel appear on the page and vice versa
- [ ] Opening the panel while on `/chat` redirects to the page (no duplicate UI)
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-017: Chat Prompt Templates
**Description:** As a user, I want quick-access prompt templates so that I can rapidly trigger common workflows (e.g., "Generate a reel about [topic]").

**Acceptance Criteria:**
- [ ] A "Templates" button in the chat input area opens a dropdown of saved prompts
- [ ] At least 5 built-in templates: reel script, batch hooks, KB search, schedule post, render status
- [ ] Selecting a template fills the input with the prompt text (user can edit before sending)
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-018: Chat History Persistence
**Description:** As a user, I want chat history to persist in the database so that conversations survive page reloads and I can review past interactions.

**Acceptance Criteria:**
- [ ] New Prisma models: `ChatSession` and `ChatMessage`
- [ ] Chat sessions are created automatically on first message
- [ ] Messages are saved as they stream in (assistant) or are sent (user)
- [ ] A "History" sidebar or dropdown lists past sessions with timestamps
- [ ] Clicking a session loads its messages
- [ ] "New Chat" button starts a fresh session
- [ ] Typecheck passes
- [ ] Verify in browser

---

### Epic 7: Campaign & Template Management

#### US-019: Dynamic Campaign Profiles
**Description:** As a user, I want to create and manage campaign profiles beyond the hardcoded `nate_landing` and `corporate` so that the platform scales to new campaigns.

**Acceptance Criteria:**
- [ ] New Prisma model: `CampaignProfile` with fields: `id`, `slug`, `displayName`, `description`, `contactPhone`, `contactEmail`, `bookingUrl`, `active`
- [ ] Settings or dedicated page to CRUD campaign profiles
- [ ] All profile dropdowns (Studio, KB, Chat tools) are dynamically populated from the DB
- [ ] Migration adds existing `nate_landing` and `corporate` as seed data
- [ ] Typecheck passes
- [ ] Verify in browser

#### US-020: Template Preview Thumbnails
**Description:** As a user, I want to see a thumbnail preview of each Creatomate template so that I can visually identify templates.

**Acceptance Criteria:**
- [ ] Templates page shows a thumbnail for each template (fetched from Creatomate API `GET /v1/templates/:id` → `preview_url`)
- [ ] Thumbnails are cached in the DB or a `VideoTemplate.thumbnailUrl` field
- [ ] Fallback placeholder if no thumbnail is available
- [ ] Typecheck passes
- [ ] Verify in browser

---

### Epic 8: Performance & Reliability

#### US-021: Creatomate Webhook Integration
**Description:** As a system, I want Creatomate to push render status updates via webhook so that the app doesn't need to poll.

**Acceptance Criteria:**
- [ ] New API route: `POST /api/webhooks/creatomate`
- [ ] Route validates Creatomate webhook signature (if available)
- [ ] On receiving `succeeded` or `failed`, updates the `RenderJob` in DB
- [ ] Frontend uses SSE or a simple refetch instead of `setInterval` polling
- [ ] `CREATOMATE_WEBHOOK_URL` added to `.env.example`
- [ ] Typecheck passes

#### US-022: Database Index Optimization
**Description:** As a system, I want proper indexes on frequently queried columns so that KB and render queries are fast at scale.

**Acceptance Criteria:**
- [ ] New migration adds GIN index on `KbFact.campaignProfiles`
- [ ] Index on `RenderJob.campaignProfile`
- [ ] Index on `RenderJob.status`
- [ ] Index on `ScheduledPost.scheduleDate`
- [ ] Typecheck passes

#### US-023: API Input Validation with Zod
**Description:** As a developer, I want all API routes to validate request bodies with Zod so that invalid data is rejected early with clear error messages.

**Acceptance Criteria:**
- [ ] Every POST/PATCH/DELETE API route has a Zod schema for the request body
- [ ] Invalid requests return 400 with `{ error: "...", issues: [...] }` shape
- [ ] Existing chat tools validation patterns are reused
- [ ] Typecheck passes

#### US-024: React Error Boundaries
**Description:** As a user, I want the app to gracefully handle component errors instead of showing a white screen.

**Acceptance Criteria:**
- [ ] A root error boundary wraps the dashboard layout
- [ ] Error boundary shows a "Something went wrong" UI with a "Try Again" button
- [ ] Error is logged to the console (and optionally to an error service)
- [ ] Individual page-level error boundaries for Studio and Chat (the most complex pages)
- [ ] Typecheck passes
- [ ] Verify in browser

---

### Epic 9: Testing & CI

#### US-025: Unit Tests for Core Lib Modules
**Description:** As a developer, I want unit tests for the most critical lib modules so that regressions are caught early.

**Acceptance Criteria:**
- [ ] Test runner configured (Vitest or Jest)
- [ ] Tests for: `renderscript.ts` (buildWdusaReel output structure), `modifications.ts` (merge behavior), `secret-crypto.ts` (encrypt/decrypt roundtrip), `creatomate.ts` (status mapping, URL extraction)
- [ ] At least 80% coverage on the tested modules
- [ ] `npm test` runs all tests
- [ ] Typecheck passes

#### US-026: API Route Integration Tests
**Description:** As a developer, I want integration tests for API routes so that endpoint contracts are verified.

**Acceptance Criteria:**
- [ ] Tests for: `GET /api/templates`, `GET /api/kb`, `POST /api/renders` (with mock Creatomate), `GET /api/settings/env-status`
- [ ] Tests use a test database or mock Prisma client
- [ ] All tests pass in CI
- [ ] Typecheck passes

#### US-027: Lint & CI Pipeline
**Description:** As a developer, I want a GitHub Actions CI pipeline so that every PR runs lint, typecheck, and tests.

**Acceptance Criteria:**
- [ ] `.github/workflows/ci.yml` file with jobs: lint, typecheck, test, build
- [ ] Runs on push to `main` and on pull requests
- [ ] Uses caching for `node_modules` and `.next`
- [ ] Build step runs `prisma generate` before `next build`
- [ ] All jobs pass on the current codebase
- [ ] Typecheck passes

---

### Epic 10: Developer Experience

#### US-028: Idempotent Seed Script
**Description:** As a developer, I want the seed script to be idempotent (upsert instead of delete-all) so that running seed doesn't destroy user-created data.

**Acceptance Criteria:**
- [ ] Seed uses `upsert` for curated facts (matched by `sourceSite` + `key`)
- [ ] Seed uses `upsert` for the default video template (matched by `id`)
- [ ] Ingested page chunks use `upsert` or are skipped if source page already exists
- [ ] Running seed twice produces the same result
- [ ] Typecheck passes

#### US-029: Consistent API Response Shapes
**Description:** As a developer, I want all API routes to return consistent response shapes so that client code is predictable.

**Acceptance Criteria:**
- [ ] Success responses: `{ data: T }` or `{ [resourceName]: T }`
- [ ] Error responses: `{ error: string, code?: string }`
- [ ] All routes set appropriate status codes (200, 201, 400, 401, 404, 500)
- [ ] A shared `apiError(message, status)` helper in `lib/api-helpers.ts`
- [ ] Typecheck passes

---

## 4. Functional Requirements

### Authentication & Security
- **FR-1:** The system must require authentication to access any `/api/*` route except `/api/webhooks/*`.
- **FR-2:** The system must require authentication to access any `/(dashboard)/*` page.
- **FR-3:** The system must enforce rate limits on credential management and authentication endpoints.
- **FR-4:** The system must validate all API request bodies using Zod schemas.

### UI/UX
- **FR-5:** The system must provide a shared component library under `components/ui/` with at least 7 primitives.
- **FR-6:** The system must show toast notifications for all user-initiated actions (render start, schedule, credential save, etc.).
- **FR-7:** The system must show skeleton loading states on all pages that fetch data.
- **FR-8:** The system must display a custom favicon and WDUSA branding.

### Dashboard & History
- **FR-9:** The home page (`/`) must display aggregate statistics (total renders, weekly renders, scheduled posts).
- **FR-10:** The system must provide a `/renders` page listing all render jobs with filtering.
- **FR-11:** The system must provide a `/calendar` page with a monthly view of scheduled posts.

### Studio
- **FR-12:** The Studio page must be decomposed into sub-components (no file > 150 lines).
- **FR-13:** The system must display an inline `<video>` player when a render completes.
- **FR-14:** The system must provide an "AI Generate" feature in Studio that fills hook/subhead/CTA.

### Knowledge Base
- **FR-15:** The system must allow creating, editing, and deleting individual KB facts via the UI.
- **FR-16:** The system must provide a re-ingest button with progress indication.

### AI Chat
- **FR-17:** The chat panel and chat page must share the same conversation state.
- **FR-18:** The system must persist chat sessions and messages in the database.
- **FR-19:** The system must provide quick-access prompt templates in the chat input.

### Campaigns & Templates
- **FR-20:** Campaign profiles must be database-driven, not hardcoded.
- **FR-21:** Templates page must show thumbnail previews when available.

### Performance
- **FR-22:** The system must support Creatomate webhooks for render status updates.
- **FR-23:** The database must have GIN index on `KbFact.campaignProfiles` and indexes on frequently filtered columns.

### Testing
- **FR-24:** The project must have unit tests for core lib modules with ≥80% coverage.
- **FR-25:** The project must have a CI pipeline that runs lint, typecheck, and tests.

---

## 5. Non-Goals (Out of Scope)

- **Multi-tenant SaaS:** This is an internal tool for one organization. Multi-tenancy is not planned.
- **OAuth / SSO:** Simple password/PIN authentication is sufficient for the current user base.
- **Mobile native app:** The web app is mobile-responsive; no native iOS/Android app.
- **Real-time collaboration:** Only one user operates the studio at a time.
- **Video editing in-browser:** Video composition is handled by Creatomate; the app only provides inputs.
- **Payment / billing:** No monetization layer.
- **Internationalization (i18n):** English only.
- **CMS for public-facing content:** The KB is internal; it does not power a public website.

---

## 6. Design Considerations

### Aesthetic Direction
The app should feel like a **premium internal tool** — think Linear or Vercel Dashboard rather than a generic admin panel. Key attributes:

- **Dark-first** with a refined light mode
- **WDUSA amber/gold accent** carried through buttons, badges, and active states (already partially implemented)
- **Geometric or slab-serif display font** for headings to stand apart from Geist body text
- **Generous spacing** and clear visual hierarchy
- **Subtle micro-interactions**: hover lifts on cards, smooth transitions on modals, toast slide-ins

### Component Patterns
- Card-based layouts for lists (templates, KB facts, render jobs)
- Status badges with semantic colors (green = succeeded, amber = rendering, red = failed, gray = queued)
- Slide-over panels for detail views (instead of navigating away)
- Command palette / keyboard shortcut layer (future enhancement)

### Responsive Strategy
- Sidebar on desktop (≥768px), bottom tab bar on mobile (existing pattern, retained)
- Cards stack vertically on mobile
- Chat panel becomes full-screen on mobile
- Calendar view degrades to list view on mobile

---

## 7. Technical Considerations

### Tech Stack (Current)
| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 15.5.14 |
| Language | TypeScript | ^5 |
| Database | PostgreSQL (Prisma ORM) | Prisma 6.4.1 |
| AI | Vercel AI SDK + OpenAI | ai 6.0, @ai-sdk/openai 3.0 |
| Video API | Creatomate v2 | REST |
| Social API | GoHighLevel v2 | REST |
| Styling | Tailwind CSS v4 | ^4 |
| Browser automation | Playwright | ^1.58 |

### Proposed Additions
| Addition | Purpose |
|----------|---------|
| **Vitest** | Unit + integration test runner (fast, Vite-native, TS-first) |
| **@next-auth/prisma-adapter** or custom cookie auth | Authentication |
| **Sonner** or custom toast | Toast notification system |
| **date-fns** | Date formatting for calendar and history views |

### Migration Strategy
- All Prisma schema changes via separate migrations (never alter existing migrations)
- New indexes added as their own migration for rollback safety
- Seed script made idempotent before any schema changes
- Feature flags not needed (internal tool, single deployment)

### Known Constraints
- Vercel serverless timeout: 10s default, 300s max (Playwright tasks already use 300s)
- Creatomate API rate limits: unknown exact limits; renders are async
- GHL API version pinned to `2021-07-28` — must not change without testing
- No WebSocket support in Vercel Serverless (SSE is fine)

### Dependencies
- `SETTINGS_ENCRYPTION_KEY` must exist for credential CRUD to work
- `CREATOMATE_API_KEY` must exist for any render functionality
- `OPENAI_API_KEY` must exist for chat and AI-generate features
- `GHL_API_TOKEN` + `GHL_LOCATION_ID` for scheduling (gracefully degraded if missing)

---

## 8. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Auth coverage** | 100% of routes behind auth | Audit all API/page routes |
| **UI consistency** | 0 raw `<button>` or `<input>` in page files | Grep for unstyled primitives |
| **Error handling** | 0 uncaught errors in production (white screens) | Error boundary + monitoring |
| **Test coverage** | ≥80% on core lib modules | Vitest coverage report |
| **Build success** | CI passes on every PR | GitHub Actions status |
| **Page load time** | < 2s on dashboard, studio, KB | Lighthouse / Web Vitals |
| **Render status latency** | < 5s from Creatomate completion to UI update | Webhook vs poll timing |
| **Feature completeness** | All 29 user stories accepted | Checklist in this PRD |

---

## 9. Prioritized Implementation Roadmap

### Phase 1: Foundation (highest priority)
*Architecture, security, and design system — everything else builds on these.*

| Priority | Story | Rationale |
|----------|-------|-----------|
| P0 | US-001: Auth Gate | Security is the most critical gap |
| P0 | US-003: UI Component Library | Every subsequent UI story depends on shared primitives |
| P0 | US-004: Toast System | Required by every form action in subsequent stories |
| P0 | US-024: Error Boundaries | Prevents white-screen crashes |
| P0 | US-023: Zod Validation | Prevents silent data corruption |
| P1 | US-022: DB Indexes | Prevents performance degradation as data grows |
| P1 | US-028: Idempotent Seed | Prevents data loss during development |
| P1 | US-029: API Response Shapes | Makes all subsequent API work consistent |

### Phase 2: Core Features
*The features users interact with daily.*

| Priority | Story | Rationale |
|----------|-------|-----------|
| P1 | US-005: Skeletons & Empty States | Polish for all list views |
| P1 | US-007: Branding & Typography | Visual identity |
| P1 | US-008: Dashboard Home | Primary landing experience |
| P1 | US-009: Render History | Critical for operational visibility |
| P1 | US-011: Studio Decomposition | Required before adding Studio features |
| P1 | US-012: Video Preview | Key usability improvement |
| P2 | US-014: KB CRUD | Content management without re-seeding |
| P2 | US-016: Shared Chat State | UX improvement for chat |

### Phase 3: Advanced Features
*Differentiation and power-user capabilities.*

| Priority | Story | Rationale |
|----------|-------|-----------|
| P2 | US-006: Page Transitions | Polish |
| P2 | US-010: Calendar View | Content planning |
| P2 | US-013: AI Script Generation | Productivity accelerator |
| P2 | US-015: KB Re-Ingest | Content freshness |
| P2 | US-017: Chat Prompt Templates | Workflow speed |
| P2 | US-019: Dynamic Campaigns | Scalability |
| P2 | US-020: Template Thumbnails | Visual template selection |
| P3 | US-018: Chat Persistence | History and review |
| P3 | US-021: Webhooks | Performance optimization |

### Phase 4: Quality & CI
*Testing and automation.*

| Priority | Story | Rationale |
|----------|-------|-----------|
| P1 | US-025: Unit Tests | Regression safety |
| P1 | US-027: CI Pipeline | Automated quality gate |
| P2 | US-026: API Tests | Contract verification |
| P3 | US-002: Rate Limiting | Hardening |

---

## 10. Open Questions

1. **Authentication mechanism:** Should we use a simple shared password (current `SETTINGS_ADMIN_PIN` pattern), or implement proper user accounts? For a 1–3 person team, a shared PIN + cookie may be sufficient. For a growing team, NextAuth with email/password or magic link would be better.

2. **Chat persistence storage:** Should chat history be stored in the same Postgres DB, or would a separate storage (e.g., Vercel KV / Redis) be more appropriate for potentially large conversation logs?

3. **Creatomate webhook availability:** Does the Creatomate plan in use support webhooks? If not, the polling optimization (US-021) needs an alternative approach (SSE from server-side polling loop).

4. **GHL API version:** The current integration pins `Version: 2021-07-28`. Should we upgrade to a newer API version? What breaking changes exist?

5. **Campaign profiles at scale:** How many campaign profiles are anticipated? If >10, the dynamic campaigns feature (US-019) should include search/filter on the management page.

6. **Video storage:** Currently, rendered videos are hosted on Creatomate's CDN. Should we mirror them to our own storage (e.g., Vercel Blob, S3) for long-term retention?

7. **Existing data migration:** When making the seed idempotent, should there be a one-time migration script to normalize any existing production data?

---

## Appendix A: Current Bug Fixes (Quick Wins)

These are bugs found during the audit that should be fixed regardless of the roadmap:

| Bug | File | Fix |
|-----|------|-----|
| Nav label mismatch: sidebar says "Knowledge Base", mobile says "KB" | `nav-mobile.tsx` | Change "KB" to "Knowledge Base" (or vice versa) |
| Chat FAB overlaps mobile nav on small screens | `dashboard-chrome.tsx` | Adjust `bottom-[4.5rem]` or use `safe-area-inset` |
| `export_renderscript` browser task is a stub (only opens page, doesn't export) | `browser-agent.ts` | Document as known limitation or implement via Creatomate API |
| Swallowed errors in Studio template load | `(dashboard)/studio/page.tsx` | Add toast/console.error in catch block |
| `DefaultChatTransport` instantiated on every render | `chat-panel.tsx`, `chat/page.tsx` | Memoize or move to module scope |

---

## Appendix B: File Structure (Proposed)

```
app/
├── (auth)/
│   └── login/page.tsx
├── (dashboard)/
│   ├── layout.tsx
│   ├── page.tsx                    ← Dashboard (was redirect)
│   ├── studio/page.tsx
│   ├── renders/page.tsx            ← NEW
│   ├── calendar/page.tsx           ← NEW
│   ├── kb/page.tsx
│   ├── templates/page.tsx
│   ├── chat/page.tsx
│   └── settings/page.tsx
├── api/
│   ├── auth/route.ts               ← NEW
│   ├── chat/route.ts
│   ├── dashboard/stats/route.ts    ← NEW
│   ├── kb/route.ts
│   ├── kb/[id]/route.ts            ← NEW
│   ├── kb/ingest/route.ts
│   ├── renders/route.ts
│   ├── renders/[id]/route.ts
│   ├── ghl/...
│   ├── templates/...
│   ├── settings/...
│   ├── browser/...
│   └── webhooks/
│       └── creatomate/route.ts     ← NEW
├── globals.css
├── layout.tsx
└── page.tsx

components/
├── ui/                             ← NEW shared primitives
│   ├── button.tsx
│   ├── input.tsx
│   ├── select.tsx
│   ├── textarea.tsx
│   ├── card.tsx
│   ├── badge.tsx
│   ├── dialog.tsx
│   ├── skeleton.tsx
│   └── toast.tsx
├── studio/                         ← NEW decomposed Studio
│   ├── campaign-select.tsx
│   ├── render-mode-toggle.tsx
│   ├── template-form.tsx
│   ├── renderscript-form.tsx
│   ├── render-status.tsx
│   ├── video-preview.tsx
│   └── schedule-form.tsx
├── chat/                           ← NEW
│   ├── chat-provider.tsx
│   └── prompt-templates.tsx
├── dashboard-chrome.tsx
├── nav-sidebar.tsx
├── nav-mobile.tsx
├── chat-panel.tsx
├── chat-message.tsx
├── theme-provider.tsx
├── theme-toggle.tsx
└── error-boundary.tsx              ← NEW

lib/
├── api-helpers.ts                  ← NEW
├── auth.ts                         ← NEW
├── prisma.ts
├── ...existing...

prisma/
├── schema.prisma                   ← Updated with new models
├── migrations/
│   ├── ...existing...
│   ├── YYYYMMDD_gin_indexes/
│   ├── YYYYMMDD_campaign_profiles/
│   └── YYYYMMDD_chat_sessions/
└── seed.ts                         ← Updated to upsert

.github/
└── workflows/
    └── ci.yml                      ← NEW
```
