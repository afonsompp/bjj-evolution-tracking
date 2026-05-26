# MVP — Escopo de base

> Documento de escopo do MVP do BJJ Evolution.
>
> Escopo do produto: **gerenciamento básico da academia + log de treino**.
>
> Regra de corte aplicada: *base é aquilo que feature futura vai precisar consumir; se chamar isso de feature, vira código duplicado depois.*

---

## 1. Base já entregue (não mexer)

| Camada | Status |
|---|---|
| Auth + `authClient` + JWT | ✅ |
| User profile + roles globais e por academia | ✅ |
| Academy CRUD + member lifecycle (join/approve/reject/remove/graduate) | ✅ |
| Class template + scheduled class + recorrência + auto-close | ✅ |
| Check-in (self + instrutor) | ✅ |
| Training log + dashboard pessoal de stats | ✅ |
| Catálogo (technique, belt, class type) | ✅ |
| Audit log via `@Auditable` | ✅ |
| Entitlement skeleton | ✅ |
| API `/api/v1` + datetime como `Instant` + i18n + theming | ✅ |

**Resumo:** o "produto" do MVP está pronto. Falta o que torna o produto *operável* fora do laptop.

---

## 2. Base que ainda falta (e DEVE entrar no MVP)

Cada item abaixo vira fundação que toda feature futura consome. Adiar significa: a primeira feature pós-MVP cria sua própria versão meia-boca disso, e na segunda já tem dois jeitos diferentes de fazer a mesma coisa.

### 2.1 Canal de notificação outbound 🔴

- **O que:** integração transacional de e-mail (Resend ou Postmark). Templates de `member_approved`, `member_rejected`, `welcome`.
- **Por que é base:** broadcast, waitlist, lembrete de aula, recovery de senha, convite de academia — *tudo* depende de "como eu mando uma mensagem pro aluno". Se só implementar e-mail de approve hoje, próxima feature copia o código.
- **Esforço:** 1-2 dias. Abstrair atrás de `NotificationService.send(channel, template, payload)` mesmo que hoje só tenha 1 canal e 3 templates.

### 2.2 Storage de arquivos 🔴

- **O que:** Supabase Storage ou S3 atrás de uma abstração `FileStorage.upload(scope, file)` → retorna URL assinada.
- **Por que é base:** foto de perfil do aluno, vídeo na técnica, foto de medalha em competição, waiver PDF, certificado de graduação — toda feature de mídia bate aqui. Sem isso, primeira foto de perfil vira `<input type="text" placeholder="cole link do imgur">`.
- **Esforço:** 1 dia. Mesmo que MVP só use pra foto de perfil.

### 2.3 LGPD básico 🟡

- **O que:** `GET /me/export` (zip JSON + CSV de tudo do usuário) e `DELETE /me` com soft-delete (anonimiza, mantém `audit_log`).
- **Por que é base:** abrir pra uma única academia paga em SP sem isso descumpre lei. Adicionar depois é cirurgia em quase toda tabela (decidir o que apagar, o que anonimizar). Modelado já no MVP, todo `entity` novo já nasce sabendo o que fazer.
- **Esforço:** 1 dia.

### 2.4 Observability mínima 🟡

- **O que:** Sentry no frontend, Spring Boot Actuator + Micrometer expondo `/actuator/health` e métricas básicas, logs estruturados (`trace_id` já existe).
- **Por que é base:** o dia que cair, é preciso saber **antes** do cliente reclamar. Adicionar depois funciona, mas o primeiro incidente custa caro.
- **Esforço:** meio dia.

### 2.5 Rate limiting nas bordas 🟡

- **O que:** Bucket4j em `/auth/*`, `/profiles/search`, `/academies/search`. Default conservador (60 req/min por IP).
- **Por que é base:** endpoints públicos sem isso são vetor de abuso. 1h de código que blinda o produto pra sempre.
- **Esforço:** 2h.

### 2.6 PWA mínimo 🟡

- **O que:** `manifest.json` + service worker que cacheia o shell. Sem offline-first ainda.
- **Por que é base:** academia instala no celular do aluno (homescreen) sem App Store. E **service worker é pré-requisito pra push notification futura** — sem PWA agora, todo aluno terá que reinstalar o app no dia que push virar feature.
- **Esforço:** meio dia.

### 2.7 Testes E2E do golden path 🟡

- **O que:** Playwright cobrindo um único fluxo: login → criar academia → outro user faz join → owner aprova → owner cria aula → aluno faz check-in → aluno registra treino → dashboard mostra.
- **Por que é base:** uma suíte que valida que nada do MVP quebrou. Cada feature futura adiciona seu próprio teste, mas o golden path é o canário.
- **Esforço:** 1 dia.

---

## 3. Pequenos gaps DENTRO do MVP que valem fechar

Coisas onde o backend já existe mas o frontend não surfaceou — completar é trivial e evita "MVP que parece pela metade":

- `membersApi.reject()` no frontend (backend tem `PATCH /{userId}/reject`) — 15min
- Histórico de graduação na página do membro (`GET /profiles/{userId}/graduations`) — 1-2h
- Histórico de presença do aluno (`GET /profiles/{userId}/attendances`) — 1-2h
- Foto de perfil no `UserProfile` (depende do storage do item 2.2) — 2h
- Mensagem de erro padronizada (RFC 7807) se ainda não tiver — meio dia

---

## 4. O que NÃO entra no MVP (mesmo que tente)

Toda a lista abaixo fica pro pós-MVP. O produto continua coerente sem nada disso porque a base do item 2 prevê o ponto de extensão. Nenhuma dessas exige reescrita.

**B2C / aluno:**
- Streak, metas, competição, lesões, peso/medidas, heatmap posicional
- Tag de parceiros, notas por rola
- Export do diário em PDF, mat hours até próxima faixa

**B2B / academia:**
- Reserva de vaga + lista de espera, broadcast, currículo de aula
- Avaliação formal de faixa, waiver digital, trial member
- Categorias de membership (kids/adulto/team), multi-unidade
- Relatórios pro dono (retenção, frequência, churn)

**Conteúdo:**
- Vídeo na técnica, biblioteca de drills

**Billing (separado, ver ROADMAP §3.6 e "Antes de cobrar"):**
- Integração de gateway (Stripe BR / Mercado Pago)
- Webhook handler com idempotência
- `SUSPENDED_FOR_NONPAYMENT` no `MemberStatus`
- Trial period, política de downgrade
- Resolver real do `EntitlementService`

---

## 5. Cronograma sugerido

| Dia | Item |
|---|---|
| 1 | Storage de arquivos + foto de perfil |
| 2 | Notification abstraction + e-mail de approve/reject |
| 3 | LGPD export + soft-delete |
| 4 | Observability (Sentry + Actuator) + rate limiting |
| 5 | PWA + Playwright golden path |
| 6 | Gaps de UI (reject, históricos, RFC 7807) |

**~6 dias de trabalho focado.**

Critério de pronto: o MVP pode (1) ser hospedado num cliente pagante sem multa de LGPD, (2) suportar qualquer das ~25 features futuras sem reabrir base, (3) ter operação básica visível.

---

## 6. Checklist de execução

### Base operacional
- [ ] `FileStorage` abstraído (Supabase Storage / S3) + foto de perfil
- [ ] `NotificationService` abstraído + provider transacional (Resend/Postmark)
- [ ] Templates: `member_approved`, `member_rejected`, `welcome`
- [ ] `GET /me/export` (zip JSON + CSV) + `DELETE /me` (soft-delete + anonimização)
- [ ] Sentry no frontend
- [ ] Spring Boot Actuator + Micrometer + `/actuator/health`
- [ ] Bucket4j em `/auth/*`, `/profiles/search`, `/academies/search`
- [ ] `manifest.json` + service worker mínimo (PWA instalável)
- [ ] Playwright: golden path login → academia → check-in → treino → dashboard
- [ ] Erro padronizado (RFC 7807) se ainda não existir

### Gaps de UI
- [ ] `membersApi.reject()` no frontend
- [ ] Histórico de graduação na página do membro
- [ ] Histórico de presença do aluno
- [ ] Foto de perfil no `UserProfile`

### Decisões de produto (não codar antes de decidir)
- [ ] Provider de e-mail (Resend ou Postmark)
- [ ] Provider de storage (Supabase Storage ou S3 próprio)
- [ ] Política de soft-delete: o que anonimiza, o que apaga, o que mantém em `audit_log`
