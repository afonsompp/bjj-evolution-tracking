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

### Feature-based organization (mandatory)

Each domain lives under `src/features/<domain>/` and owns its own data layer. Pages stay thin and only compose — they must not contain `apiClient`, `useQuery`, or `useMutation` inline.

A feature must follow this shape:

```
features/<domain>/
  api/
    keys.ts            # query key factories (single source of truth for cache)
    <domain>Api.ts     # raw HTTP calls, return typed data only
  hooks/
    use<Resource>.ts   # query hooks
    useManage<Resource>.ts  # mutation hooks (encapsulate invalidation)
  components/          # domain components reused across pages
  permissions/         # RBAC hooks + gates (when applicable, see RBAC below)
```

Pages live in `src/pages/` and contain UI + local state only. All server I/O goes through feature hooks.

### Data layer rules

- **Single Axios instance**: `apiClient` (from `src/api/client.ts`) auto-injects `Authorization: Bearer` from the Supabase session. Never import `axios` directly in features.
- **API modules are dumb**: each function takes typed args and returns typed data. No state, no React, no error mapping — let callers handle errors.
- **Query keys live in `keys.ts`**, never inline. Mutations invalidate via these factories so cache stays consistent. Cross-feature invalidations (e.g. updating a training invalidates `dashboardKeys`) belong inside the mutation hook, not the page.
- **Mutation hooks encapsulate invalidation**. Pages call `mutation.mutate(...)` and pass `{ onSuccess, onError }` for UI-side effects only (navigate, toast, close modal).
- **Pagination response shape**: `{ content, totalElements, totalPages, number, size, first, last }`. Pass `page`/`size` as params, never hand-build query strings.
- **Error shape**: `{ status, error, message, timestamp, violations?: [{field, message}] }`. Read `err?.response?.data?.message` for user-visible text; fall back to a translated default.
- **Date serialization**: `LocalDateTime` → `"2024-03-15T18:30:00"`. `LocalDate` → `"2024-03-15"`.

### RBAC (per-academy capabilities)

Permissions on the frontend mirror the backend's `@academySecurity` rules. Role is **per-academy**, not global — the same user can be `OWNER` of academy A and `STUDENT` of academy B. Global `ADMIN` is a staff/support bypass.

- **Capability matrix** in `features/academy/permissions/capabilities.ts` is the single source of truth. Add/remove capabilities here, not in components.
- **`useAcademyPermissions(academyId)`** returns `{ canEditAcademy, canManageMembers, canPromoteMember, canManageBilling, ... }`.
- **`<AcademyPermissionGate academyId={id} require="canManageMembers">`** for buttons and sections.
- **`<RequireAcademyCap cap="canEditAcademy">`** for route guards (in `router/index.tsx`).
- **Components consume capabilities, not roles.** Never write `if (role === 'OWNER')` in a component — the matrix decides.
- Frontend gating is UX, not security. The backend's `@PreAuthorize` is the real boundary; treat 403 responses as defense in depth.

### Forms

- **React Hook Form + Zod** is the default. Define a `schema`, infer `FormValues`, and write a `toRequest(values)` helper that adapts to the backend DTO.
- Use string fields for numeric/optional inputs (e.g. `stripe`, `belt`) and parse explicitly in `toRequest()` to avoid `zodResolver` type mismatches.
- Reset/populate via `useEffect` + `reset(...)` when loading existing entities for edit.
- Only fall back to plain `useState` when RHF gets in the way (e.g. arrays of selected IDs in pickers). Document why if you do.

### Auth & profile

- Supabase handles sign up / sign in. Backend accepts the Supabase JWT directly (issuer in `application.yaml`).
- **`useProfile()`** (from `features/profile/useProfile.ts`) is the only way to read the current user's profile. Never re-implement `GET /profiles` inline.
- **`useUpsertProfile()`** is the only writer; it calls `qc.setQueryData(profileKeys.me, data)` so consumers update without a refetch.
- `GET /profiles` returns 404 when no profile exists; gated pages redirect to `/onboarding` on `isError`.

### Internationalization (i18n)

- **No external library** — pure React Context + TypeScript.
- **Translations**: `src/lib/i18n/translations.ts` exports typed `en-US` and `pt-BR` dictionaries. Both must have the same keys. `{param}` interpolation is supported.
- **Hook**: `const { translate, locale, setLocale } = useTranslation()`. Usage: `translate('academy.pending.title')` or `translate('academy.count', { count: 42 })`.
- **Adding a key**: add it to both `en` and `pt` objects. `TranslationKey` is inferred from the `en` object — TS will error if you forget the other locale.
- **No user-visible strings inline.** Anything rendered to a user goes through `translate(...)`.
- Locale persists to `localStorage('locale')`. Initial detection: `navigator.language.startsWith('pt')` → `pt-BR`, else `en-US`.

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
- [ ] No `apiClient`, `useQuery`, or `useMutation` inline in pages — all server I/O goes through `features/<domain>/hooks/*`.
- [ ] New query keys live in `features/<domain>/api/keys.ts`; mutations invalidate via these factories.
- [ ] New UI affordances tied to academy roles are wrapped in `<AcademyPermissionGate>` (and routes in `<RequireAcademyCap>`) — capabilities, not roles, are checked.
