---
trigger: always_on
---

# Antigravity Web App Rules (React + Vite + Supabase)

## 1. Environment & Project Targeting

- **Explicit target env:** Every run must state the intended environment: `local | staging | prod`.
- **Supabase project targeting:** Before any remote change, ensure the Supabase CLI is linked to the _correct_ project ref for the target env (never “whatever is currently linked”). :contentReference[oaicite:0]{index=0}
- **Vite env handling:** Use Vite modes + `.env.*` files; read config from `import.meta.env` (no ad-hoc globals). Restart dev server after env changes. :contentReference[oaicite:1]{index=1}
- **Secrets rule:** Never commit secrets. Client builds must not contain server-only keys.

## 2. Schema & “Metadata” Operations (Database as Source of Truth)

- **All schema changes via migrations:** No “dashboard-only” schema edits without capturing them into migration files committed to git. :contentReference[oaicite:2]{index=2}
- **Local-first workflow:** Develop against the local Supabase stack; validate migrations locally before pushing remotely. :contentReference[oaicite:3]{index=3}
- **Remote sync:** Push migrations using Supabase CLI DB push mechanisms (don’t hand-edit prod). :contentReference[oaicite:4]{index=4}
- **Seed data:** Use repeatable seed scripts for local/test environments; don’t rely on manual data creation. :contentReference[oaicite:5]{index=5}

## 3. Security (Non-Negotiable)

- **RLS everywhere:** Turn on Row Level Security for all user-facing tables and enforce access via policies. :contentReference[oaicite:6]{index=6}
- **Keys & trust boundaries:**
  - Browser/React app uses **anon/publishable** key only. :contentReference[oaicite:7]{index=7}
  - **Never** expose `service_role` in the browser (it can bypass RLS / has full access). :contentReference[oaicite:8]{index=8}
- **Auth + DB authorization:** Auth “scopes” are not DB authorization; DB access must be enforced with RLS policies. :contentReference[oaicite:9]{index=9}
- **Input safety:** Validate/normalize user input before writing to DB; avoid dynamic query construction patterns that can widen access unexpectedly.

## 4. React + Vite Development Rules

- **Rules of Hooks:** Hooks at top-level only; never in loops/conditions/try-catch. :contentReference[oaicite:10]{index=10}
- **Strict Mode on:** Keep `<StrictMode>` enabled in dev to catch unsafe side effects early. :contentReference[oaicite:11]{index=11}
- **Component hygiene:**
  - Keep components small; push data access into hooks/services.
  - Avoid side effects in render; effects must be idempotent.
  - Prefer controlled, accessible UI patterns (tests should reflect user behavior).

## 5. Supabase Client Usage (React)

- **Single client instance:** Create one `supabase` client (module singleton) and import it; don’t re-create per component render. :contentReference[oaicite:12]{index=12}
- **Session correctness:** Treat sessions/tokens as security-sensitive; don’t roll your own token storage logic unless you _must_. :contentReference[oaicite:13]{index=13}
- **Server-only admin actions:** Any admin/auth-management operations require server context; do not attempt from the browser. :contentReference[oaicite:14]{index=14}

## 6. Testing Rules (Mandatory)

### 6.1 Unit & Component Tests

- **Runner:** Use **Vitest** (Vite-native) for unit/component tests. :contentReference[oaicite:15]{index=15}
- **UI testing:** Use **React Testing Library**; tests should resemble real user behavior (avoid implementation-detail tests). :contentReference[oaicite:16]{index=16}
- **Coverage expectations:** Every new component/hook/utility must add tests covering:
  - happy path + error state
  - loading/empty states (for data fetching)
  - accessibility-critical behaviors (labels, roles where applicable)

### 6.2 Integration Tests (Supabase)

- Run integration tests against **local Supabase** with migrations applied.
- Add at least one test per feature that proves:
  - RLS allows the right user actions
  - RLS denies unauthorized access (negative tests)

### 6.3 E2E Tests (Critical Flows)

- Use **Playwright Test** for end-to-end coverage of core journeys (auth, primary CRUD, payments/checkout if applicable). :contentReference[oaicite:17]{index=17}
- Keep E2E resilient: use user-facing locators/contracts; avoid brittle selectors. :contentReference[oaicite:18]{index=18}

## 7. Summary Checklist for Tasks

- Did I explicitly choose `local | staging | prod`?
- Is the Supabase CLI linked to the correct project for this change?
- Are schema changes captured in migrations and committed?
- Are RLS policies enabled + tested (allow + deny)?
- Did I avoid exposing `service_role` anywhere in the client?
- Are new/changed React pieces covered by Vitest + React Testing Library?
- Do key user flows have Playwright coverage (or did I update existing E2E tests)?
