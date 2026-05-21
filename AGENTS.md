# CLAUDE.md

> Style guide, technical memory, and guidelines for AI agents (and humans) collaborating on this repository.

---

## 1. Project Overview

**BJJ Evolution Tracking** — A REST API built with Spring Boot 4 for managing Brazilian Jiu-Jitsu academies, plus a React frontend. The system manages the full lifecycle of a gym: student registration, technique catalogs, class scheduling, individual training logs (check-ins and performance), and a dashboard for athlete metrics.

## 2. Tech Stack

### Backend

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Language** | Java | **21** |
| **Framework** | Spring Boot | **4.0.1** |
| **Build** | Maven Wrapper | **3.9.12** |
| **Database** | PostgreSQL | *Runtime driver* |
| **Security** | Spring Security + OAuth2 (JWT) | *Auth0 / Supabase* |
| **Migrations** | Flyway | — |

### Frontend

| Layer | Choice | Version |
| :--- | :--- | :--- |
| **Build tool** | Vite | 8 |
| **Framework** | React | 19 |
| **Language** | TypeScript | 5.x |
| **Routing** | React Router | v7 |
| **Server state** | TanStack Query | v5 |
| **Forms** | React Hook Form + Zod | RHF v7 + Zod v3 |
| **Styling** | Tailwind CSS | v4 (@tailwindcss/vite plugin) |
| **Auth client** | @supabase/supabase-js | v2 |
| **HTTP client** | Axios | v1 |

## 3. Commands

```bash
# Backend — Full Setup and Build
cd backend && ./mvnw clean install

# Backend — Run in development mode
cd backend && ./mvnw spring-boot:run

# Backend — Run the unit and integration test suite
cd backend && ./mvnw test

# Backend — Swagger UI Documentation (while app is running)
# URL: http://localhost:8080/swagger-ui.html

# Frontend — Install dependencies
cd frontend && npm install

# Frontend — Development server (port 3000)
cd frontend && npm run dev

# Frontend — Production build
cd frontend && npm run build
```

## 4. Repository Structure (Monorepo)

```
tracking/                          ← repo root
├── backend/
│   ├── pom.xml, mvnw, .mvn/
│   ├── src/                       (all Java code + tests)
│   └── Dockerfile
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/                       (all TypeScript/React code)
│   └── vercel.json                (SPA rewrites for Vercel deploy)
├── docker-compose.yaml
├── .gitignore                     (separate backend/ + frontend/ ignores)
├── .github/workflows/
│   ├── backend.yml                (Maven build on push to backend/**)
│   └── frontend.yml               (npm build on push to frontend/**)
└── AGENTS.md
```

## 5. Backend Architecture & AI Patterns

### Bounded Contexts
Organization follows business functionalities rather than technical layers to help AI agents locate logic quickly:

*   **academy/**: Academy settings, members (`AcademyMember`), and class schedules.
*   **catalog/**: Knowledge repository for BJJ techniques and positions.
*   **training/**: Core athlete features (training logs, check-ins, and performance).
*   **user/**: Identity management and user profiles (`UserProfile`).
*   **shared/**: Cross-cutting utilities, converters, and security configurations.

---

### AI-Optimized Coding Standards
To ensure the AI understands and edits code without hallucinations or context loss:

#### Small Files
Keep files and functions below **300 lines**. If a service grows, split it by sub-responsibility.

#### DTOs as record
All data transfer objects must be immutable **Java records**.

#### Explicit Mapping
Use static methods `fromEntity(Entity e)` and `toEntity()` inside records. Avoid "magic" libraries (**MapStruct/ModelMapper**) that obscure logic from the AI.

#### Explicit Typing
Avoid `var` in public API contracts or complex logic; explicit types help the LLM maintain state.

## 6. Implementation Guidelines

### Multi-tenancy & Security
* **Tenant ID**: The primary tenant is **Academy** (UUID).
* **Validation**: Every request targeting a specific academy must be validated using the `@academySecurity` bean.
* **Zero Trust**: Never assume a user has access to an `academyId` passed in the URL. Always verify the `sub` claim in the JWT against the resource ownership.

### Validation
* Always add `@Valid` on `@RequestBody` in controller endpoints — invalid data should never reach the service layer.
* Do NOT accept raw enums as `@RequestBody`. Wrap them in a DTO with `@NotNull` and use `@Valid`.
* Use domain exception hierarchy in `shared/exception/`: `ResourceNotFoundException` (404), `ConflictException` (409), `BusinessRuleException` (422), `ForbiddenException` (403).
* `ApiError` response record has fields: `status`, `error` (category label), `message` (exception text), `timestamp`, `violations`.
* Do NOT use `EntityNotFoundException`, `IllegalArgumentException`, `IllegalStateException`, or `SecurityException` in services — always use the domain types.

### Persistence & Error Handling
* **Migrations**: All schema changes must be versioned via **Flyway** scripts.
* **Transactional**: Use `@Transactional(readOnly = true)` for all find/list operations in services.

### Testing
* Controller testing uses `@SpringBootTest` + `@AutoConfigureMockMvc` with explicit JWT Bearer tokens (no `spring-security-test` dependency).
* Use `@MockitoBean` (not `@MockBean`), and `@WebMvcTest`/`@AutoConfigureMockMvc` from `org.springframework.boot.webmvc.test.autoconfigure` package (Spring Boot 4).
* Pure service unit tests use `@ExtendWith(MockitoExtension.class)`, `@Mock`, and `@InjectMocks`.

### Security patterns
* When securing controller endpoints that need ADMIN/MANAGER global role, do NOT use `@PreAuthorize("hasAnyRole(...)")`. Instead inject `UserProfileRepository` into the controller and call a private `requireGlobalAdmin()` helper that uses `SecurityUtils.getCurrentUserId()` + `SecurityUtils.isNotAdminOrManager(profile)` and throws `ForbiddenException`. GET endpoints (list, search, get-by-id) should remain public with no security check.

---

## 7. Backend Do's and Don'ts

### ✅ Do
* Check pom.xml and ensure you are only using available dependencies.
* **Use Domain Language**: Use specific BJJ terms (e.g., *Guard, Submission, Belt, Stripe*).
* **Explain "Why"**: Add comments for complex business rules (e.g., "Why a check-in is blocked if the member is inactive").
* **Composite Keys**: Use `@EmbeddedId` for many-to-many relationships like `AcademyMember`.
* ** All commits and code are in english, except if makes sense only in other language.

### ❌ Don't
* **No Lombok**: Keep the code explicit and native to Java 21+ to facilitate static analysis and AI understanding.
* **No Database in Logic**: Keep business logic in **Services**, not in JPA Entities or Controllers.
* **No Unrelated Refactors**: Keep PRs focused on the specific feature or bug to minimize AI context noise.
* ** Do not try to guess the code if they are not in the context; ask for them to be added to the context before generating a solution

---

## 8. Frontend Conventions

### Project Structure
```
frontend/src/
├── api/                    # Per-domain API functions (axios client)
│   └── client.ts           # Axios instance with auth interceptor
├── components/ui/          # Shared UI components
├── features/               # Feature modules (co-locate component + hook + types)
│   ├── auth/               # AuthContext, LoginForm, RegisterForm
│   ├── profile/            # ProfileForm
│   └── dashboard/          # Dashboard components, hooks, utils
├── layouts/                # AuthLayout (centered), AppLayout (sidebar)
├── lib/                    # Third-party wrappers and app-level utilities
│   ├── supabase.ts         # Supabase client
│   ├── ThemeContext.tsx     # Dark/light theme context + toggle + localStorage persistence
│   └── i18n/               # Internationalization
│       ├── translations.ts # en-US / pt-BR dictionaries with typed keys
│       └── I18nContext.tsx  # React Context provider + useTranslation() hook
├── pages/                  # Route-level page components
├── router/                 # Route definitions + layout nesting
└── types/                  # TypeScript types mirroring backend DTOs
    └── api.ts              # All backend DTOs and enums as TS types
```

### Key patterns
- **API client**: `apiClient` (Axios) auto-injects `Authorization: Bearer` header from Supabase session via interceptor. All API calls go through this instance.
- **Pagination response**: `{ content: T[], totalElements, totalPages, number, size, first, last }`
- **Error shape**: `{ status, error, message, timestamp, violations?: [{field, message}] }`
- **Date serialization**: `LocalDateTime` → ISO string `"2024-03-15T18:30:00"`. `LocalDate` → `"2024-03-15"`.
- **Form validation**: Zod + React Hook Form mirroring backend constraints. Use string fields for numeric inputs (like `stripe`) and parse explicitly in a `toRequest()` helper to avoid type mismatches with `zodResolver`.
- **State management**: React Context for auth (`AuthContext`), React Query for server state (cache key convention: `['resource', id]`).
- **Profile check**: `GET /profiles` returns 404 if no profile exists. Frontend checks this on dashboard load and redirects to `/onboarding`.
- **Auth flow**: Supabase handles sign up / sign in. Backend accepts Supabase JWT directly (issuer configured in `application.yaml`).

### Internationalization (i18n)
- **No external library** — pure React Context + TypeScript.
- **Translation files**: `src/lib/i18n/translations.ts` exports typed dictionaries for `en-US` and `pt-BR`. Each dictionary has the same keys with string values. Supports `{param}` interpolation via the `t()` function.
- **Provider**: `<I18nProvider>` wraps the entire app in `App.tsx`. Detects browser language on mount (`navigator.language` — `pt` → `pt-BR`, anything else → `en-US`). Persists choice to `localStorage` key `'locale'`.
- **Hook**: `const { translate, locale, setLocale } = useTranslation()`. Usage: `translate('dashboard.sessions')` or `translate('dashboard.subtitle', { days: 30 })`.
- **Adding a new key**: add the key to both the `en` and `pt` objects in `translations.ts`, then use `translate('your.new.key')` in components. The `TranslationKey` type automatically infers available keys from the `en` object.
- **Language switcher**: A `<select>` dropdown in `AppLayout.tsx` sidebar (desktop) and top bar (mobile). Calls `setLocale(locale)` which triggers a re-render of all `translate()` calls.

### History Page
- **Paginated list** via `GET /trainings?page=N&size=M` (default 25). Page size selector (10/25/50 buttons).
- **Expand/collapse**: Clicking a card toggles detail sections — techniques, submissions made/allowed, combat stats grid, session config, notes.
- **Quick stats bar**: Always-visible row on each card shows cardio/intensity ratings, roll count, taps, subs, escapes.
- **Delete**: Trash icon → `ConfirmModal` (confirmation dialog) → `DELETE /trainings/{id}` → invalidates `['trainings']` and `['dashboard']` caches.
- **Edit**: Pencil icon navigates to `/training/{id}/edit`.

### Training Form (Create + Edit)
- **Single shared component** (`TrainingFormPage.tsx`) — detects mode from `useParams().id`: create (`/training/new`) or edit (`/training/:id/edit`).
- **Populate on edit**: `GET /trainings/{id}` fetched when `id` param is present, populates all form fields via `useEffect`.
- **Plain `useState`** (no React Hook Form) because technique selectors manage `number[]` arrays that don't map cleanly to RHF. Validation is manual via `validate()`.
- **Technique picker**: `TechniquePicker` subcomponent renders techniques grouped by type (`SUBMISSION`, `POSITION`, etc.), with search/filter, select-all per group checkbox, and selected-count footer. Fetches via `GET /techniques?size=200`.
- **Three technique selectors**: "Techniques Practiced" (all types), "Submissions Made" (typeFilter=`['SUBMISSION']`), "Submissions Allowed" (typeFilter=`['SUBMISSION']`).
- **Star ratings**: Clickable inline SVG star buttons for cardio/intensity (1–5). `StarRating` subcomponent.
- **Submit**: `POST /trainings` on create, `PUT /trainings/{id}` on edit. Both invalidate `['trainings']` and `['dashboard']` caches, then navigate to `/training`.
- **Date/time**: `<input type="date">` + `<input type="time">` combined into ISO string `{date}T{time}:00`.
- **Numeric fields**: `NumInput` subcomponent enforces `min=0` and parses to integer.

### Dashboard API
- **Single endpoint**: `GET /trainings/dashboard?days=30` replaces the old approach of fetching all raw trainings and computing stats client-side.
- **Response shape**: `DashboardResponse` (`current: TrainingStatsResponse`, `previous: TrainingStatsResponse`, `topAttacks: TechniqueCount[]`, `topDefenses: TechniqueCount[]`).
- **Period options**: 7, 14, 30, 45, 60, 90, 180, 365 days — defined as `PERIOD_OPTIONS` in the page component.
- **Derived stats** computed client-side: hours (totalMinutes / 60), sub rate (submissions / totalRolls), defense index (escapes / taps).
- **Icons**: No external icon library. All icons are inline SVGs defined in an `Icons` const object in the page. No need to install `lucide-react` or similar.

### Styling & Theming
- **No hardcoded CSS color values** in component files. All colors are CSS custom properties defined in `src/index.css` under `:root` (light) and `.dark` (dark) selectors.
- Components reference theme tokens via Tailwind's arbitrary value syntax: `bg-[var(--bg-card)]`, `text-[var(--text-primary)]`, `border-[var(--border-card)]`.
- Semantic token names (not zinc/gray numbers): `--bg-page`, `--bg-card`, `--bg-subtle`, `--border-card`, `--text-primary`, `--text-muted`, `--text-subtle`, etc. See `index.css` for the full token list.
- **Theme toggle**: `ThemeContext.tsx` provides `useTheme()` hook with `theme`, `toggle()`, `setTheme()`. Toggles `<html class="dark">` and persists to `localStorage('theme')`. Defaults to `prefers-color-scheme`.
- **Provider order** in `App.tsx`: `ThemeProvider` wraps `I18nProvider` wraps `RouterProvider`. Theme must be outermost so layouts and pages can consume it.
- Toggle buttons are in `AppLayout.tsx` sidebar (desktop) and top bar (mobile), plus `AuthLayout.tsx` header.
- Accent colors (rose-500, emerald-500, yellow-500, etc.) are still hardcoded as Tailwind semantic colors — they don't change between themes.
- Dark theme uses the `zinc` palette (bg: `zinc-950`, surface: `zinc-900`, border: `zinc-800`, text: `zinc-100`). Light theme uses the reverse (bg: `zinc-50`, surface: `white`, border: `zinc-200`, text: `zinc-900`).

---

## 9. PR Checklist

- [ ] `cd backend && ./mvnw test` passes locally.
- [ ] `cd frontend && npm run build` passes (TypeScript + Vite).
- [ ] New backend DTOs are `records` with manual `fromEntity`/`toEntity` methods.
- [ ] `@Valid` applied to all new `@RequestBody` parameters.
- [ ] `@PreAuthorize` security validation is applied to all new Controller methods.
- [ ] New files stay below the **300-line limit**.
- [ ] Flyway migration script included for any database change.
- [ ] Swagger documentation updated for new endpoints.
- [ ] TypeScript types added in `frontend/src/types/api.ts` for any new backend DTOs/enums.
- [ ] Translation keys added in `frontend/src/lib/i18n/translations.ts` for any new user-facing text (both en-US and pt-BR).
- [ ] No hardcoded color values in new frontend components — use CSS variable tokens (`var(--bg-card)`, `var(--text-primary)`, etc.) instead of Tailwind color classes.
