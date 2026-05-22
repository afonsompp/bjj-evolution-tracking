v# Roadmap de Profissionalização

> Documento de planejamento estratégico — o que precisa estar pronto **antes** de novas features, para que o projeto evolua de side-project para produto comercializável sem reescrita de big-bang.
>
> Premissa: *é barato reservar espaço hoje; é caro construir o espaço quando já tem dados em produção.*

---

## 1. Veredito atual

O projeto está em **~75% de "fácil de profissionalizar"**.

**O que já está bom (não mexer):**
- Bounded contexts claros no backend.
- RBAC contextual por academia (raro em side-project).
- Spring Security + JWT desacoplado de provider específico.
- DTOs como `record` com `fromEntity`/`toEntity` explícitos.
- Frontend feature-based com queryKeys centralizadas e RBAC declarativo.
- i18n e theming nativos.

**O que falta:** essencialmente **6 dias de trabalho** distribuídos nos itens da seção 3.

---

## 2. Modelo dual de cobrança (decisão de produto pendente)

Plano descrito: aluno individual paga features de log/estatísticas; academia paga gestão + entrega features ao aluno como valor agregado.

Três armadilhas a resolver **antes** de codar billing:

1. **Cannibalização B2C×B2B** — definir se B2B entrega *subset*, *superset*, ou *features ortogonais* ao B2C.
2. **Identidade composta** — mesmo usuário pode ser free, premium individual, e member de N academias com planos diferentes. Solução: pensar em **entitlements** (união de fontes), não em "plano do usuário".
3. **Cancellation cliff** — política explícita de downgrade quando academia atrasa. Read-only → suspended → export window → soft-delete.

**Recomendação estratégica:** B2C como feeder/lead-gen, B2B como receita principal. Pricing inicial sugerido para validar: B2C R$ 9,90/mês, B2B R$ 4,90/aluno ativo com mínimo R$ 99/mês.

---

## 3. Sprint 0 — Pavimentação irreversível

Esses itens são caros de adiar porque **cada feature nova construída em cima deles propaga o problema**. Atacar em ordem.

| # | Item | Custo agora | Custo se adiar |
|---|---|---|---|
| 1 | Renomear `AcademyMember.stripe` → `beltStripe` | 30 min | Colisão com Stripe billing em todo lugar que tocar pagamento |
| 2 | Migrar `LocalDateTime` → `Instant`/`OffsetDateTime` em campos de "momento no tempo" | 2-3 h | Ambiguidade de fuso quando rodar fora de UTC ou vender pra outro país; migration dolorosa de dado existente |
| 3 | Criar `audit_log` table + aspect/event listener | 1 dia | Dado não capturado é dado perdido. Compliance/LGPD impossível retroativamente |
| 4 | Encapsular `supabase-js` atrás de `authClient` no frontend | 2 h | Migração futura toca dezenas de componentes |
| 5 | Versionar API com prefixo `/api/v1/` | 10 min | Quebrar contrato pra mobile/parceiros vira dupla manutenção |
| 6 | Esqueletizar axis de `Entitlement` (backend + frontend), retornando "tudo liberado" hoje | 1 dia | Feature gates viram `if (role === ...)` espalhados; refactor de billing futuro toca toda UI |
| 7 | Estender `audit_log` para registrar ações de ADMIN bypass | (incluso no #3) | Vetor de incidente de compliance |

### 3.1 Detalhamento

#### Item 1 — Rename `stripe` → `beltStripe`
- Backend: entidade, DTOs, services, testes.
- Banco: Flyway script renomeando coluna.
- Frontend: `AcademyMemberResponse` no `types/api.ts` + qualquer consumo.

#### Item 2 — Datas com fuso
- "Momento no tempo" → `Instant` (ou `OffsetDateTime`): `sessionDate`, `startTime`, `checkInTime`, `createdAt`, `updatedAt`.
- "Data pura" (sem hora) → `LocalDate`: ex. `startsIn` (data de início no BJJ).
- Frontend exibe convertido para fuso do usuário (`new Date(iso).toLocaleString()` já faz isso).

#### Item 3 — `audit_log`
```sql
CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID,                    -- quem fez (null = sistema)
  academy_id UUID,                  -- contexto tenant
  action VARCHAR(80) NOT NULL,      -- "MEMBER_APPROVED", "TRAINING_DELETED", etc
  resource_type VARCHAR(40),
  resource_id VARCHAR(80),
  payload JSONB,                    -- estado antes/depois
  ip_address INET,
  user_agent TEXT
);
CREATE INDEX ON audit_log (academy_id, occurred_at DESC);
CREATE INDEX ON audit_log (actor_id, occurred_at DESC);
```
Implementação: Spring AOP com `@Auditable` ou `ApplicationEventPublisher` + listener async.

Ações mínimas a logar desde o dia 1:
- `MEMBER_APPROVED`, `MEMBER_REJECTED`, `MEMBER_REMOVED`
- `MEMBER_GRADUATED`
- `ACADEMY_UPDATED`, `ACADEMY_DELETED`
- `TRAINING_DELETED`
- `ADMIN_BYPASS` (qualquer ação com role ADMIN global)

#### Item 4 — `authClient`
```ts
// src/lib/authClient.ts
export const authClient = {
  getSession: () => supabase.auth.getSession(),
  onAuthStateChange: (cb) => supabase.auth.onAuthStateChange(cb),
  signInWithPassword: (email, password) =>
    supabase.auth.signInWithPassword({ email, password }),
  signUp: (email, password) => supabase.auth.signUp({ email, password }),
  signOut: () => supabase.auth.signOut(),
}
```
Regra: **nenhum componente pode importar `supabase` direto para auth.** `apiClient` interceptor continua usando supabase internamente — está OK, está num lugar só.

#### Item 5 — Versionar API
- `application.yaml`: `server.servlet.context-path: /api/v1`
- `.env` do frontend: `VITE_API_BASE_URL=.../api/v1`

#### Item 6 — Skeleton de Entitlement

**Backend:**
```java
public enum Feature {
  TRAINING_LOG, ADVANCED_STATS, AI_INSIGHTS,
  ACADEMY_MANAGEMENT, BILLING, ANALYTICS_EXPORT
}

public record Entitlement(UUID userId, Set<Feature> features, Instant validUntil) {}

@Service
public class EntitlementService {
  public Entitlement resolveFor(UUID userId) {
    // hoje: todo mundo tem todas as features
    return new Entitlement(userId, EnumSet.allOf(Feature.class), null);
  }
}
```

**Frontend:**
```
features/billing/
  entitlements/
    capabilities.ts          // enum Feature
    useEntitlements.ts       // hoje retorna { all: true }
    EntitlementGate.tsx      // <EntitlementGate feature="ADVANCED_STATS">
```

Quando bater a hora de cobrar, **só o resolver muda**. Componentes não tocam.

---

## 4. Importante mas não bloqueia (Sprint 1+)

Pode ser feito em paralelo ao desenvolvimento de features, sem reescrita:

- **Observability**: Sentry (frontend) + Spring Boot Actuator + Micrometer/Prometheus (backend).
- **Tests frontend**: Playwright em fluxos críticos (login → aprovar membro → criar treino).
- **Comunicação transacional**: Resend ou Postmark para e-mail; templates mínimos (approved, rejected, weekly summary).
- **Rate limiting**: Bucket4j ou via Cloudflare/gateway.
- **PWA**: manifest + service worker mínimo. Academias instalam no celular.
- **LGPD básico**: endpoint de exportação de dados + soft-delete de profile.

---

## 5. Pode esperar até ter clientes pagantes

- SSR / SEO para páginas públicas de academia.
- Multi-tenancy de DB (schema-per-tenant ou RLS).
- React Native / app nativo.
- Analytics avançado (PostHog/Mixpanel).
- CI/CD complexo (canary, blue/green).
- Comunicação WhatsApp / push notifications.
- Caching avançado.

---

## 6. Não fazer

- ❌ Microsserviços.
- ❌ Event sourcing / CQRS completo.
- ❌ Tenant-per-schema antes de ter clientes.
- ❌ Migrar de Supabase agora (apenas desacoplar).
- ❌ Reescrever o que já está bom (RBAC, features-based front, bounded contexts).
- ❌ Otimização prematura de queries antes de ter perfil de carga real.

---

## 7. Checklist de execução

Marcar conforme avança.

### Sprint 0 — Pavimentação (~6 dias)
- [ ] Rename `AcademyMember.stripe` → `beltStripe` (entidade, DTOs, services, testes, Flyway, types do front)
- [ ] Migrar `LocalDateTime` → `Instant` nos campos temporais; manter `LocalDate` para datas puras
- [ ] Criar `audit_log` table + Flyway + Spring AOP `@Auditable`
- [ ] Wire de eventos audit: aprovação, rejeição, remoção, graduação, atualização de academia, deleção de treino, ações ADMIN
- [ ] Criar `authClient` no frontend e proibir `supabase.auth.*` fora dele
- [ ] Prefixo `/api/v1` em backend + atualização do `VITE_API_BASE_URL`
- [ ] Backend: enum `Feature` + `Entitlement` record + `EntitlementService` (retorna tudo)
- [ ] Frontend: `features/billing/entitlements/` com `useEntitlements` e `<EntitlementGate>`

### Decisões de produto (antes de billing)
- [ ] Estratégia A, B ou C de relação B2C × B2B
- [ ] Lista explícita de features por persona (free, premium individual, academy member, academy admin)
- [ ] Política de downgrade quando academia atrasa pagamento
- [ ] Pricing inicial validado com 3-5 academias-piloto

### Antes de cobrar
- [ ] Rename `Subscription` / `Plan` / `Invoice` no domínio
- [ ] Integração de gateway (Stripe BR ou Mercado Pago)
- [ ] Webhook handler com idempotência
- [ ] Estado `SUSPENDED_FOR_NONPAYMENT` no `MemberStatus`
- [ ] Trial period configurável
- [ ] E-mail transacional para eventos de cobrança

---

## 8. Referência rápida — riscos por categoria

| Categoria | Status | Ação |
|---|---|---|
| Domínio modelado | ✅ Bom | Manter |
| Segurança (RBAC) | ✅ Bom | Manter |
| Persistência (Flyway, JPA) | ✅ Bom | Manter |
| Frontend feature-based | ✅ Bom | Manter |
| i18n / theming | ✅ Bom | Manter |
| Naming de domínio (`stripe`) | 🔴 Bloqueador | Sprint 0 #1 |
| Fuso horário | 🔴 Bloqueador | Sprint 0 #2 |
| Trilha de auditoria | 🔴 Bloqueador | Sprint 0 #3 |
| Acoplamento Supabase | 🟡 Médio | Sprint 0 #4 |
| Versionamento API | 🟡 Médio | Sprint 0 #5 |
| Axis de Entitlement | 🔴 Bloqueador | Sprint 0 #6 |
| Observability | 🟡 Médio | Sprint 1 |
| Tests frontend | 🟡 Médio | Sprint 1 |
| Comunicação transacional | 🟡 Médio | Sprint 1+ |
| SSR / SEO | 🟢 Pode esperar | Pós-clientes |
| Multi-tenancy DB | 🟢 Pode esperar | Pós-10K academias |
| Mobile nativo | 🟢 Pode esperar | Pós-validação |
