# CLAUDE.md

> Style guide, technical memory, and guidelines for AI agents (and humans) collaborating on this repository.

---

## 1. Project Overview

**BJJ Evolution Tracking** — A REST API built with Spring Boot 4 for managing Brazilian Jiu-Jitsu academies. The system manages the full lifecycle of a gym: student registration, technique catalogs, class scheduling, and individual training logs (check-ins and performance).

## 2. Tech Stack

| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Language** | Java | **21** |
| **Framework** | Spring Boot | **4.0.1** |
| **Build** | Maven Wrapper | **3.9.12** |
| **Database** | PostgreSQL | *Runtime driver* |
| **Security** | Spring Security + OAuth2 (JWT) | *Auth0* |
| **Migrations** | Flyway | — |,

## 3. Commands

```bash
# Full Setup and Build
./mvnw clean install

# Run the application in development mode
./mvnw spring-boot:run

# Run the unit and integration test suite
./mvnw test

# Swagger UI Documentation (while app is running)
# URL: http://localhost:8080/swagger-ui.html

# 4. Architecture & AI Patterns

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

## 5. Implementation Guidelines

### Multi-tenancy & Security
* **Tenant ID**: The primary tenant is **Academy** (UUID).
* **Validation**: Every request targeting a specific academy must be validated using the `@academySecurity` bean.
* **Zero Trust**: Never assume a user has access to an `academyId` passed in the URL. Always verify the `sub` claim in the JWT against the resource ownership.

### Persistence & Error Handling
* **Migrations**: All schema changes must be versioned via **Flyway** scripts.
* **Errors**: Use a global exception handler. Throw `EntityNotFoundException` (Jakarta) for missing resources to return a consistent **404**.
* **Transactional**: Use `@Transactional(readOnly = true)` for all find/list operations in services.

---

## 6. Do's and Don'ts

### ✅ Do
* Check my pom.xml and ensure you are only using available dependencies.
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

## 7. PR Checklist

- [ ] `./mvnw test` passes locally.
- [ ] New DTOs are `records` with manual `fromEntity`/`toEntity` methods.
- [ ] `@PreAuthorize` security validation is applied to all new Controller methods.
- [ ] New files stay below the **300-line limit**.
- [ ] Flyway migration script included for any database change.
- [ ] Swagger documentation updated for new endpoints.



# Monorepo Migration + Frontend Architecture Plan — BJJ Evolution

## Context
The project currently lives at `/home/afonsopinheiro/projects/tracking` as a pure Spring Boot backend (remote: `https://github.com/afonsompp/bjj-evolution-tracking.git`, branch: `feature/class`). No frontend exists yet.

Goal: Reorganize into a monorepo (`backend/` + `frontend/`) before scaffolding the React app, so both apps share one git history, one Docker Compose, and one CI/CD pipeline.

Backend CORS allows: `http://localhost:3000` (dev) and `https://frontend-bjj-evolution.vercel.app` (prod). Backend runs on port **8080** (local).

---

## Part 1: Monorepo Migration

### Why simple folder split (no Turborepo/Nx)

| Option | Verdict |
|---|---|
| **Turborepo / pnpm workspaces** | JavaScript-only tooling — doesn't help with Maven. Overkill for 1 JS package. |
| **Nx** | Can handle Java + JS but heavy setup, steep learning curve, overkill for 2 apps. |
| **Simple folder split** | ✅ Recommended. Two apps, two ecosystems (Maven + Node). No shared packages. Clean and zero tooling overhead. |

### Target structure

```
tracking/                          ← repo root (keep same name)
├── backend/                       ← moved from current root
│   ├── pom.xml
│   ├── mvnw, mvnw.cmd
│   ├── .mvn/
│   ├── src/
│   └── Dockerfile
├── frontend/                      ← new Vite React app
│   ├── package.json
│   ├── vite.config.ts
│   ├── src/
│   └── vercel.json
├── docker-compose.yaml            ← updated to reference ./backend
├── .gitignore                     ← updated with frontend ignores
├── .github/
│   └── workflows/
│       ├── backend.yml            ← Maven build + test on push
│       └── frontend.yml          ← TypeScript check + Vercel deploy
└── AGENTS.md                      ← stays at root
```

### Migration steps (ordered, all via `git mv` to preserve history)

**Step 1 — Create backend/ and move all backend files:**
```bash
mkdir backend
git mv pom.xml mvnw mvnw.cmd .mvn src Dockerfile backend/
```

**Step 2 — Move docker-compose.yaml stays at root but update build context:**
Edit `docker-compose.yaml`: change `build: .` → `build: ./backend`

**Step 3 — Update .gitignore** (add frontend ignores):
```
# Frontend
frontend/node_modules/
frontend/dist/
frontend/.env.local
frontend/.env*.local
```

**Step 4 — Create frontend/ with Vite scaffold** (see Part 2).

**Step 5 — Add GitHub Actions CI** (see below).

### docker-compose.yaml change

Current (line with backend build context):
```yaml
build: .
```
Change to:
```yaml
build:
  context: ./backend
```

### GitHub Actions — `backend.yml`
```yaml
name: Backend CI
on:
  push:
    paths: ['backend/**']
  pull_request:
    paths: ['backend/**']
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { java-version: '21', distribution: 'temurin' }
      - run: ./mvnw verify -q
```

### GitHub Actions — `frontend.yml`
```yaml
name: Frontend CI
on:
  push:
    paths: ['frontend/**']
  pull_request:
    paths: ['frontend/**']
jobs:
  build:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm' }
      - run: npm ci
      - run: npm run build
```

### Vercel configuration
In the Vercel project settings: set **Root Directory** to `frontend/`. Vercel will only run the frontend build and ignore the backend directory entirely.

---

## Part 2: Frontend Architecture

---

## Architecture

### Stack

| Layer | Choice | Version | Rationale |
|---|---|---|---|
| Build tool | **Vite** | 6 | Fast HMR, native ESM, SPA-first, Vercel deploy with zero config. No SSR needed — entire app is private/auth-gated. |
| Framework | **React** | 19 | Latest stable, concurrent features, shadcn/ui fully supports it. |
| Language | **TypeScript** | 5.x | Type safety across API contracts and component props. |
| Routing | **React Router** | v7 | Standard SPA routing, declarative, `<Navigate>` for guards, nested layouts. |
| Server state | **TanStack Query** | v5 | Caching, pagination (`useInfiniteQuery`), invalidation after mutations. No Redux needed. |
| Forms | **React Hook Form + Zod** | RHF v7 + Zod v3 | Zod schemas mirror backend constraints exactly. |
| UI components | **shadcn/ui** | latest | Built on Radix UI primitives + Tailwind v4. Copy-paste components, fully customizable, no runtime overhead. |
| Styling | **Tailwind CSS** | v4 | Utility-first, pairs natively with Vite via `@tailwindcss/vite` plugin. |
| Auth client | **@supabase/supabase-js** | v2 | Backend issuer is Supabase — same SDK for auth. |
| HTTP client | **Axios** | v1 | Interceptor to auto-inject `Authorization: Bearer` header from Supabase session. |

### Dev server port
Configure Vite to use **port 3000** (`server.port: 3000` in `vite.config.ts`) — matches backend CORS allowlist exactly.

---

### Project Structure

```
bjj-evolution-frontend/
├── public/
├── src/
│   ├── api/                    # Per-domain API functions (thin wrappers over axios)
│   │   ├── client.ts           # Axios instance with auth interceptor
│   │   ├── trainings.ts
│   │   ├── techniques.ts
│   │   ├── profiles.ts
│   │   └── academies.ts
│   ├── components/
│   │   └── ui/                 # shadcn/ui generated components (Button, Input, etc.)
│   ├── features/               # Feature modules (co-locate component + hook + types)
│   │   ├── auth/
│   │   │   ├── AuthContext.tsx
│   │   │   ├── LoginForm.tsx
│   │   │   └── RegisterForm.tsx
│   │   ├── profile/
│   │   ├── training/
│   │   │   ├── TrainingCard.tsx
│   │   │   ├── TrainingForm.tsx
│   │   │   └── useTrainings.ts
│   │   ├── technique/
│   │   │   ├── TechniqueSelector.tsx
│   │   │   └── TechniqueCreateModal.tsx
│   │   ├── dashboard/
│   │   │   ├── StatCard.tsx
│   │   │   ├── PeriodFilter.tsx
│   │   │   └── useTrainingStats.ts
│   │   └── academy/
│   │       └── AcademySwitcher.tsx
│   ├── layouts/
│   │   ├── AuthLayout.tsx      # Unauthenticated pages (login, register)
│   │   └── AppLayout.tsx       # Authenticated pages (sidebar + mobile header)
│   ├── lib/
│   │   └── supabase.ts         # createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
│   ├── pages/                  # Route-level components (thin, delegate to features/)
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── OnboardingPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── TrainingListPage.tsx
│   │   ├── TrainingFormPage.tsx
│   │   └── ProfilePage.tsx
│   ├── router/
│   │   └── index.tsx           # Route definitions + ProtectedRoute wrapper
│   ├── types/
│   │   └── api.ts              # TypeScript types mirroring all backend DTOs and enums
│   └── main.tsx
├── .env.local                  # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_API_BASE_URL
├── vite.config.ts
├── tailwind.config.ts
└── vercel.json                 # { "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

### Key files to create first

**`src/lib/supabase.ts`**
```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

**`src/api/client.ts`**
```ts
import axios from 'axios'
import { supabase } from '../lib/supabase'

export const apiClient = axios.create({ baseURL: import.meta.env.VITE_API_BASE_URL })

apiClient.interceptors.request.use(async (config) => {
  const { data: { session } } = await supabase.auth.getSession()
  if (session?.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`
  }
  return config
})
```

**`vercel.json`** — required for SPA routing (without this, refreshing a route returns 404 on Vercel):
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }
```

**`.env.local`**
```
VITE_SUPABASE_URL=https://tpltengabmlhpkhdmqbm.supabase.co
VITE_SUPABASE_ANON_KEY=<anon key from Supabase dashboard>
VITE_API_BASE_URL=http://localhost:8080
```

### TypeScript types (`src/types/api.ts`)
Generate one type per backend DTO/enum. Example:
```ts
export type Belt = 'WHITE' | 'BLUE' | 'PURPLE' | 'BROWN' | 'BLACK'
  | 'GRAY_WHITE' | 'GRAY' | 'GRAY_BLACK' | 'YELLOW_WHITE' | 'YELLOW' | 'YELLOW_BLACK'
  | 'ORANGE_WHITE' | 'ORANGE' | 'ORANGE_BLACK' | 'GREEN_WHITE' | 'GREEN' | 'GREEN_BLACK'

export type TrainingType = 'GI' | 'NO_GI'
export type ClassType = 'REGULAR' | 'PRIVATE' | 'OPEN_MAT' | 'SEMINAR' | 'CAMP' | 'COMPETITION' | 'TEACHING'
export type TechniqueType = 'SUBMISSION' | 'PIN' | 'POSITION' | 'GUARD_PASS' | 'GUARD_POSITION' | 'SCAPE' | 'SWEEP' | 'TAKEDOWN' | 'GRIP'
export type TechniqueTarget = 'HEAD' | 'NECK' | 'SHOULDER' | 'TORSO' | 'LEG' | 'FOOT' | 'ANKLE' | 'KNEE' | 'HIP' | 'BACK' | 'SPINE' | 'ARM' | 'ELBOW' | 'WRIST' | 'HAND' | 'GUARD_PASS' | 'GUARD_POSITION' | 'PIN' | 'TAKEDOWN' | 'SWEEP' | 'ESCAPE'
export type CheckInStatus = 'REGISTERED' | 'CONFIRMED' | 'CANCELED'
export type UserRole = 'ACADEMY_OWNER' | 'CUSTOMER' | 'MANAGER' | 'ADMIN'

export interface Page<T> { content: T[]; totalElements: number; totalPages: number; number: number; size: number; first: boolean; last: boolean }
export interface ApiError { status: number; error: string; message: string; timestamp: string; violations?: { field: string; message: string }[] }

export interface ProfileResponse { id: string; name: string; secondName?: string; nickname: string; belt?: Belt; stripe?: number; startsIn?: string; role: UserRole }
export interface TrainingStatsResponse { totalSessions: number; totalMinutes: number; avgCardioRating: number; avgIntensityRating: number; totalTaps: number; totalSubmissions: number; totalEscapes: number; totalSweeps: number; totalTakedowns: number; totalGuardPasses: number; totalRolls: number }
// ... (one interface per DTO)
```

---

## Technical Foundations (apply to all epics)

- **API client**: Axios or `fetch` wrapper with auto-injected `Authorization` header from Supabase session.
- **Pagination response shape**: `{ content: T[], totalElements, totalPages, number, size, first, last }`.
- **Error shape**: `{ status, error, message, timestamp, violations?: [{field, message}] }`.
- **Date serialization**: `LocalDateTime` → ISO string `"2024-03-15T18:30:00"`. `LocalDate` → `"2024-03-15"`.
- **Form validation**: Zod + React Hook Form mirroring backend constraints.
- **State management**: React Context + React Query (server state) recommended.

---

## Epic 1: Autenticação e Conta do Atleta

### Story 1.1: Registro e Acesso Seguro

**Goal:** Criar e autenticar conta via Supabase. Backend já está configurado com `issuer-uri: https://tpltengabmlhpkhdmqbm.supabase.co/auth/v1` — o JWT do Supabase é aceito diretamente.

#### Tasks

**T1.1.1 — Configurar cliente Supabase**
- Instalar `@supabase/supabase-js`.
- Criar `src/lib/supabase.ts` com `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)`.
- Expor `getSession()` e `onAuthStateChange()` para uso no contexto global.
- Criar `src/lib/api.ts`: axios instance que injeta `session.access_token` em cada request.

**T1.1.2 — Tela de Registro (Sign Up)**
- Formulário: `email`, `password`, `confirmPassword`.
- Zod schema: email válido, senha mínimo 8 chars, confirmação igual à senha.
- Chamar `supabase.auth.signUp({ email, password })`.
- Exibir mensagem de verificação de e-mail pós-cadastro.
- Rota: `/register`.

**T1.1.3 — Tela de Login (Sign In)**
- Formulário: `email`, `password`.
- Chamar `supabase.auth.signInWithPassword({ email, password })`.
- Em caso de erro, exibir mensagem mapeada do código Supabase (`invalid_credentials`, `email_not_confirmed`, etc.).
- Rota: `/login`.

**T1.1.4 — Componente AuthLayout**
- Layout wrapper para `/login` e `/register`: centralizado, sem sidebar.
- Incluir logo e link de alternância entre login ↔ registro.

**T1.1.5 — Contexto de sessão global (AuthContext)**
- `AuthContext` com `{ user, session, loading, signOut }`.
- `useEffect` com `supabase.auth.onAuthStateChange` para reatividade.
- Expor `useAuth()` hook.
- `loading = true` enquanto Supabase verifica sessão ao carregar a página (evita flash de redirect).

---

### Story 1.2: Onboarding e Perfil do Atleta

**Goal:** Forçar preenchimento de perfil antes de acessar o app. Endpoint: `GET /profiles` (404 se sem perfil) e `POST /profiles`.

#### Tasks

**T1.2.1 — ProtectedRoute com verificação de perfil**
- Wrapper de rota que:
    1. Redireciona para `/login` se não há sessão.
    2. Chama `GET /profiles`. Se 404 → redireciona para `/onboarding`.
    3. Se perfil existe → renderiza `children`.
- Cachear resultado com React Query (key: `['profile', userId]`).

**T1.2.2 — Formulário de Onboarding / Edição de Perfil (ProfileForm)**
- Campos baseados em `ProfileRequest`:
    - `name` (required, not blank)
    - `secondName` (opcional)
    - `nickname` (required, not blank)
    - `belt` (select com todos os valores do enum `Belt` — incluir separador visual entre faixas infanto-juvenis e adultas)
    - `stripe` (number input 0–4)
    - `startsIn` (date picker, formato ISO `LocalDate`)
- Zod schema espelhando constraints do backend.
- Ao salvar: `POST /profiles` com body `ProfileRequest`. Resposta: `ProfileResponse`.
- Após salvar no onboarding, redirecionar para `/dashboard`.
- Rota onboarding: `/onboarding`. Rota edição: `/profile/edit`.

> **Nota sobre Belt:** O enum inclui faixas infanto-juvenis (`GRAY_WHITE`, `YELLOW`, `ORANGE`, `GREEN` e suas variantes). Exibir grupo "Adulto" e grupo "Infanto-Juvenil" no select para facilitar seleção.

**T1.2.3 — Tela de Perfil com Editar / Logout**
- Exibir dados de `ProfileResponse`: nome, nickname, faixa + graus, data de início.
- Botão "Editar" → navega para `/profile/edit` com dados pré-populados.
- Botão "Sair" → `supabase.auth.signOut()` + limpar cache React Query + redirecionar para `/login`.
- Rota: `/profile`.

---

## Epic 2: Dashboard de Performance

### Story 2.1: Visão Geral e Filtros de Período

**Goal:** Mostrar métricas do período via `GET /trainings/stats?startDate=&endDate=`. A resposta contém: `totalSessions`, `totalMinutes`, `avgCardioRating`, `avgIntensityRating`, `totalTaps`, `totalSubmissions`, `totalEscapes`, `totalSweeps`, `totalTakedowns`, `totalGuardPasses`, `totalRolls`.

Para calcular a **tendência (trend)**, são necessárias **2 chamadas** para o mesmo endpoint: período selecionado + período imediatamente anterior de igual duração.

#### Tasks

**T2.1.1 — Componente de filtro de período (PeriodFilter)**
- Dropdown: `7 dias`, `30 dias`, `90 dias`, `180 dias`, `365 dias`, `Personalizado`.
- Ao selecionar, computa `startDate` e `endDate` do período atual e do período anterior (mesma duração).
- Expor como hook `usePeriodFilter()` → `{ startDate, endDate, prevStartDate, prevEndDate }`.

**T2.1.2 — Hook `useTrainingStats(startDate, endDate)`**
- Chama `GET /trainings/stats?startDate=<ISO>&endDate=<ISO>`.
- Retornar dois resultados (atual + anterior) em paralelo com `Promise.all`.
- Calcular diff relativo: `trend = ((current - previous) / previous) * 100`.
- Tipo de retorno: `{ current: TrainingStatsResponse, previous: TrainingStatsResponse, trends: Record<keyof TrainingStatsResponse, number> }`.

**T2.1.3 — Componente StatCard**
- Props: `label`, `value`, `unit?`, `trend?` (número).
- Exibir valor principal + badge de tendência: verde com `▲ +X%` se positivo, vermelho com `▼ -X%` se negativo, cinza se zero ou ausente.
- Cards principais: `totalSessions`, `totalMinutes` (converter para horas: `totalMinutes / 60`), `totalRolls`.

**T2.1.4 — Cards de rating com barra de progresso**
- Para `avgCardioRating` e `avgIntensityRating` (escala 1–5).
- Barra de progresso com fill `(value / 5) * 100%`.
- Exibir valor numérico com 1 casa decimal.

---

### Story 2.2: Rankings e Consolidado de Combate

**Goal:** Mostrar top técnicas e totais de combate. **Atenção:** O endpoint `GET /trainings/stats` NÃO retorna ranking de técnicas — apenas totais. Para o top de técnicas, é necessário agregar no frontend iterando os treinos do período via `GET /trainings?startDate=&endDate=`.

#### Tasks

**T2.2.1 — Agregação de técnicas no frontend**
- Hook `useTopTechniques(startDate, endDate, limit = 3)`:
    - Chama `GET /trainings?startDate=&endDate=&size=100` (paginar se necessário).
    - Para cada `TrainingResponse`, iterar `submissionTechniques` (finalizações aplicadas).
    - Contar ocorrências por `technique.id + technique.name` usando um `Map`.
    - Retornar top `N` ordenado por contagem decrescente: `{ id, name, count }[]`.
- Fazer o mesmo para `techniques` (drills) se for exibir ranking geral.

> **Limitação:** Se o usuário tiver muitos treinos no período, pode haver múltiplas páginas. O hook deve iterar todas as páginas (`while (!page.last)`) ou implementar com `GET /trainings?size=200`.

**T2.2.2 — Componente TechniqueList**
- Exibir lista de técnicas com barra de progresso relativa à técnica mais usada (100% = max count).
- Props: `techniques: { id, name, count }[]`.

**T2.2.3 — Componente CombatStatsGrid**
- Grid 2x3 com ícones representativos para cada stat do `TrainingStatsResponse`:
    - `totalSubmissions` → ícone de submissão
    - `totalTaps` → ícone de tap
    - `totalTakedowns` → ícone de queda
    - `totalSweeps` → ícone de raspagem
    - `totalGuardPasses` → ícone de passagem de guarda
    - `totalEscapes` → ícone de escape
- Usar dados de `TrainingStatsResponse` diretamente (sem chamada extra).

---

## Epic 3: Diário de Treino (Feed)

### Story 3.1: Visualização do Histórico

**Goal:** Listar treinos paginados via `GET /trainings?page=&size=10&sort=sessionDate,desc`.

#### Tasks

**T3.1.1 — Página de listagem (TrainingListPage)**
- React Query com paginação (`useInfiniteQuery` para scroll infinito OU `usePaginatedQuery` para paginação clássica).
- Endpoint: `GET /trainings?page=0&size=10&sort=sessionDate,desc` (+ filtros opcionais de data).
- `Page<TrainingResponse>` → renderizar `content[]`.

**T3.1.2 — Empty State**
- Exibir quando `totalElements === 0`: ilustração + CTA "Registrar primeiro treino".

**T3.1.3 — TrainingCard (estado colapsado)**
- Exibir a partir de `TrainingResponse`:
    - Data: `sessionDate` formatada (`dd/MM/yyyy`).
    - Tipo: `trainingType` (`GI` ou `NO_GI`) como badge.
    - Classe: `classType` como badge secundário.
    - Preview numérico: `totalRolls`, `durationMinutes` em minutos/horas.

**T3.1.4 — TrainingCard (estado expandido)**
- **Tags técnicas** (3 seções separadas):
    - `techniques` → "Drills / Posições"
    - `submissionTechniques` → "Finalizações Aplicadas"
    - `submissionTechniquesAllowed` → "Finalizações Recebidas"
    - Cada tag exibe `technique.name` (de `TechniqueSummaryResponse: { id, name }`).
- **Scorecard**: tabela com `taps`, `submissions`, `escapes`, `sweeps`, `takedowns`, `guardPasses`.
- **Barras de energia**: `cardioRating` e `intensityRating` (1–5) como barra de progresso.
- **Notas**: `description` em área de texto readonly.

---

### Story 3.2: Gerenciamento do Feed

#### Tasks

**T3.2.1 — Botões de ação no TrainingCard**
- "Editar" e "Excluir" no header do card expandido.
- Visíveis apenas quando o card está expandido ou em hover (desktop).

**T3.2.2 — Deleção com confirmação**
- Ao clicar "Excluir": modal de confirmação (`"Tem certeza? Esta ação não pode ser desfeita."`).
- Confirmar → `DELETE /trainings/{id}` → invalidar cache React Query `['trainings']` → card desaparece da lista.

**T3.2.3 — Link de edição**
- "Editar" → `navigate('/trainings/{id}/edit')`.
- Carregar `GET /trainings/{id}` → pré-popular `TrainingForm` com dados existentes.
- Salvar → `PUT /trainings/{id}` com body `TrainingRequest`.

---

## Epic 4: Registro e Edição de Treino

### Story 4.1: Formulário de Dados Básicos e Placar

**Goal:** Formulário que submete `TrainingRequest` para `POST /trainings` (criação) ou `PUT /trainings/{id}` (edição).

#### Tasks

**T4.1.1 — Setup do formulário (TrainingForm)**
- React Hook Form + Zod schema espelhando `TrainingRequest`:
    - `classType`: enum `ClassType` (REGULAR, PRIVATE, OPEN_MAT, SEMINAR, CAMP, COMPETITION, TEACHING)
    - `trainingType`: enum `TrainingType` (GI, NO_GI)
    - `sessionDate`: datetime ISO — usar `datetime-local` input, converter para `LocalDateTime` format ao submeter
    - `durationMinutes`: integer ≥ 0 (required)
    - `roundLengthMinutes`: integer ≥ 0 (required)
    - `restLengthMinutes`: integer ≥ 0 (required)
    - `totalRolls`: integer ≥ 0 (required)
    - `cardioRating`: integer 1–5 (required)
    - `intensityRating`: integer 1–5 (required)
    - `taps`, `submissions`, `escapes`, `sweeps`, `takedowns`, `guardPasses`: integer ≥ 0 (required)
    - `description`: string opcional
    - **Não enviar o campo `duration`** (campo legado, ignorado pelo backend — usar apenas `durationMinutes`)

**T4.1.2 — Seção "Informações Gerais"**
- Select para `classType` e `trainingType`.
- Input `datetime-local` para `sessionDate`.
- Inputs numéricos para `durationMinutes`, `roundLengthMinutes`, `restLengthMinutes`.

**T4.1.3 — Seção "Scorecard de Combate"**
- Inputs numéricos com `min={0}` para: `taps`, `submissions`, `escapes`, `sweeps`, `takedowns`, `guardPasses`, `totalRolls`.
- Layout em grid para leitura rápida pós-treino.

**T4.1.4 — Seção "Avaliações" e "Notas"**
- `cardioRating` e `intensityRating`: star rating ou slider 1–5.
- `description`: `<textarea>` livre.

---

### Story 4.2: Seletor Dinâmico de Técnicas

**Goal:** 3 instâncias do TechniqueSelector para os 3 campos de técnicas do `TrainingRequest`: `techniqueIds`, `submissionTechniqueIds`, `submissionTechniqueAllowedIds`.

Endpoint de busca: `GET /techniques?query=<string>&page=0&size=10`.
Criação de técnica: `POST /techniques` — **requer role ADMIN/MANAGER** (guard: `@catalogSecurity.isGlobalAdmin`). Atletas comuns NÃO podem criar técnicas.

#### Tasks

**T4.2.1 — Componente TechniqueSelector**
- Exibir como campo fechado mostrando quantidade de técnicas selecionadas: "3 técnicas selecionadas".
- Clicar abre drawer/modal com:
    - Barra de busca com debounce 300ms → `GET /techniques?query=<valor>`.
    - Lista de resultados com checkbox por técnica.
    - Botão "Confirmar seleção" fecha e atualiza o form field.
- Reutilizável: recebe `label`, `value` (array de IDs), `onChange`.

**T4.2.2 — Filtros rápidos por TechniqueType**
- Chips/tabs dentro do drawer do TechniqueSelector para filtrar por `TechniqueType`:
  `SUBMISSION`, `GUARD_PASS`, `SWEEP`, `TAKEDOWN`, `POSITION`, `GUARD_POSITION`, `PIN`, `SCAPE`, `GRIP`.
- Filtro client-side sobre os resultados já carregados da API (ou adicionar `type` como query param se implementado no backend).

**T4.2.3 — TechniqueCreateModal (somente para ADMIN/MANAGER)**
- Verificar `user.role` do `ProfileResponse` (`ADMIN` ou `MANAGER`) antes de exibir o botão "Criar nova técnica".
- Se autorizado: abrir modal com `TechniqueRequest` fields:
    - `name` (3–100 chars, required)
    - `alternativeName` (max 100, opcional)
    - `type`: select com valores de `TechniqueType`
    - `target`: select com valores de `TechniqueTarget` (HEAD, NECK, SHOULDER, etc.)
- Submeter `POST /techniques` → ao salvar, **auto-selecionar** a técnica criada no seletor que originou o modal.
- Para usuários sem role admin/manager: exibir apenas a busca, sem opção de criar.

---

## Epic 5: Navegação e Layout Base

### Story 5.1: Navegação Multi-dispositivo

#### Tasks

**T5.1.1 — AppLayout base**
- Layout wrapper para rotas autenticadas.
- Renderiza `<Sidebar>` em desktop e `<MobileHeader>` em mobile.
- Slots para `<main>` content.

**T5.1.2 — Sidebar (desktop, ≥ 768px)**
- Links: Dashboard (`/dashboard`), Meus Treinos (`/trainings`), Perfil (`/profile`).
- Seção inferior: `AcademySwitcher` (Story 5.2) + botão Logout.
- Link ativo: comparar `useLocation().pathname` com a rota do link.

**T5.1.3 — Header mobile + Hamburger Menu**
- Header fixo com logo + botão hamburger.
- Ao abrir: drawer lateral com os mesmos links da Sidebar + overlay de fundo.
- Fechar ao clicar em link ou overlay.
- Gerenciar com `useState(isOpen)`.

**T5.1.4 — Classes de estado ativo**
- Usar `NavLink` do React Router com `className={({ isActive }) => isActive ? 'active-class' : ''}`.

---

### Story 5.2: Alternância de Contexto (AcademySwitcher)

**Goal:** Permitir que instrutores/donos de academia alternem para o contexto da academia. Endpoint: `GET /academies` retorna `Page<AcademyResponse>` com as academias do usuário autenticado. `AcademyResponse: { id: UUID, name: string, address: string }`.

#### Tasks

**T5.2.1 — Componente AcademySwitcher**
- Dropdown exibindo: "Conta Pessoal" (padrão) + lista de academias do usuário.
- Chamar `GET /academies` ao montar (somente se `user.role` in `['ACADEMY_OWNER', 'MANAGER', 'ADMIN']`).
- Exibir apenas se o usuário tiver ≥ 1 academia — esconder para atletas sem academia.

**T5.2.2 — Contexto de academia selecionada (AcademyContext)**
- `AcademyContext` com `{ selectedAcademy: AcademyResponse | null, setSelectedAcademy }`.
- Persistir seleção em `localStorage` para sobreviver ao refresh.

**T5.2.3 — Redirecionamento condicional de rotas**
- Quando `selectedAcademy !== null`, rotas da sidebar incluem link para `/academies/{id}/dashboard` (painel do instrutor).
- Quando `null`, exibir apenas rotas do atleta pessoal.

---

## Ordem de Implementação Recomendada

1. **T1.1.1 + T1.1.5** — Base: cliente Supabase + AuthContext (sem isso nada funciona)
2. **T1.1.4 + T1.1.2 + T1.1.3** — Auth UI: AuthLayout, Register, Login
3. **T5.1.1 + T5.1.2 + T5.1.3 + T5.1.4** — Layout base (Sidebar + Mobile)
4. **T1.2.1 + T1.2.2 + T1.2.3** — Onboarding + Perfil + ProtectedRoute
5. **T3.1.1 → T3.1.4** — Feed de treinos (read-only)
6. **T3.2.1 → T3.2.3** — Editar/excluir treinos
7. **T4.1.1 → T4.1.4** — Formulário de treino (criar/editar)
8. **T4.2.1 → T4.2.3** — TechniqueSelector
9. **T2.1.1 → T2.1.4** — Dashboard: stats e filtros
10. **T2.2.1 → T2.2.3** — Dashboard: rankings
11. **T5.2.1 → T5.2.3** — AcademySwitcher

---

## Verificação end-to-end por epic

| Epic | Forma de verificar |
|---|---|
| Auth | Criar conta Supabase → receber email → login → JWT injetado em header → `GET /profiles` retorna 200 ou 404 |
| Onboarding | 404 em `/profiles` → redirect para `/onboarding` → preencher form → `POST /profiles` 200 → redirect dashboard |
| Dashboard | Criar 5 treinos em datas distintas → selecionar período "30 dias" → StatCards refletem os valores corretos |
| Feed | `GET /trainings` lista treinos → expandir card → técnicas e scorecard visíveis → deletar → card some |
| Formulário | Criar treino com técnicas → aparece no feed → editar → mudanças persistem → `GET /trainings/{id}` retorna dados atualizados |
| Navegação | Redimensionar janela → sidebar colapsa em mobile → hamburger abre drawer → links ativos destacados |
