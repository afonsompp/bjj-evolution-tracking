# Plano — Notas de voz (WhatsApp) anexadas a treinos

> Documento de planejamento pronto para execução futura. **Nada aqui foi implementado ainda.**
> Decisões de design fechadas em conversa (2026-06-01). Ver memória `project-voice-notes-import`.
>
> Premissa central: a captura de áudio é **desacoplada** do log de treino. O áudio vira
> nota qualitativa anexada a um treino — **não** gera as estatísticas (essas seguem manuais).

---

## 1. Decisões já fechadas (não reabrir sem motivo)

- **Escopo**: áudio **enriquece** um treino já criado (notas/descrição qualitativa). Stats (`taps`, `submissions`, `sweeps`...) continuam manuais via formulário. O transcript bruto fica salvo → autofill de stats é porta aberta pro futuro, não escopo agora.
- **`VoiceNote` é uma caixa de entrada autônoma**: na criação tem **um único vínculo — o dono (`userProfile`)**. Sem FK pra treino/aula, porque no momento da captura o treino ainda não existe (ele só nasce depois da aula).
- **Reconexão por tempo + presença**: ao criar o treino, o app sugere as `VoiceNote` do aluno com `trainingId IS NULL` numa janela de `capturedAt` perto da aula.
- **Import** = projeta o transcript no treino **e** seta `trainingId` na nota → ela some da lista de importáveis.
- **Uma nota → no máximo um treino** (FK único).
- **Treino deletado → `ON DELETE SET NULL`**: a nota volta pra caixa de entrada e pode ser reutilizada.
- **Arquitetura**: monolito modular, **não** microserviço. Integrações externas (transcrição, WhatsApp) atrás de interfaces. Webhook responde rápido + processamento assíncrono.
- **Regra de ouro**: qualquer caminho novo converge no `TrainingService.create(TrainingRequest, userId)` existente — sem persistência paralela de treino.

---

## 2. Pendência herdada (pré-requisito de produto)

`TrainingService.create()` **hoje não checa presença** — cria treino pra qualquer usuário autenticado. A regra *"só importa treino se esteve presente"* (`ClassAttendance` = `CONFIRMED`) é **comportamento novo**. Decidir se é:
- (a) bloqueio rígido no `create()`, ou
- (b) só um filtro na sugestão de notas (treino livre, mas a UX de import só aparece pra aulas com presença).

Recomendação: começar por (b) — menos invasivo, não mexe na regra de negócio central do treino. Reavaliar (a) quando a feature de presença estiver madura.

---

## 3. Infra existente a reusar (não reinventar)

| Necessidade | Reusar | Local |
|---|---|---|
| Guardar o áudio | `FileStorage` (bucket privado + `signedUrl`) | `shared/storage/FileStorage.java` |
| Saída no WhatsApp (confirmações) | `NotificationSender` + `NotificationDispatcher` (canal whatsapp já previsto) | `shared/notification/` |
| Processamento assíncrono do webhook | `AsyncConfig` (`@Async` já configurado) | `shared/configuration/AsyncConfig.java` |
| Migration | Flyway — próximo script é `V2__` | `backend/src/main/resources/db/migration/` |
| Padrão de feature no front | feature-based + queryKeys centralizadas | `frontend/src/features/training/{api,hooks}` |

Transcrição (Whisper/etc.) e canal WhatsApp inbound **não existem** — são as duas integrações externas novas, ambas atrás de interface.

---

## 4. Modelo de dados

### Entidade `VoiceNote`
```
VoiceNote
  id            (PK)
  userProfile   (FK NOT NULL)          ← único vínculo na criação
  audioKey      (String)               ← chave do FileStorage (NÃO a URL)
  transcript    (text, nullable)       ← preenchido após transcrição
  status        (enum)                 ← RECEIVED → TRANSCRIBED → IMPORTED → FAILED
  capturedAt    (Instant NOT NULL)     ← chave de reconexão por tempo
  trainingId    (FK nullable, ON DELETE SET NULL)  ← null = na caixa de entrada
  source        (enum: WHATSAPP | IN_APP)
  createdAt / updatedAt
```

Migration `V2__voice_note.sql`:
- tabela `voice_note`
- FK `training_id` → `training(id)` **ON DELETE SET NULL**
- índice em `(user_profile_id, training_id, captured_at)` pra query de importáveis

### Onde o texto "pousa" no treino
Preferência: entidade filha **`TrainingNote`** (1 treino : N notas) — preserva granularidade por áudio (timestamp + link pro `audioKey`).
MVP alternativo mais barato: concatenar no campo `description` que já existe em `Training`. Decidir na Fase 2.

---

## 5. Faseamento (cada fase entrega valor e é testável isolada)

### Fase 0 — Fundação da caixa de entrada *(sem WhatsApp, sem transcrição)*
Objetivo: a `VoiceNote` existir e ser listável.
- Entidade `VoiceNote` + repository + migration `V2__`.
- Módulo novo isolado: `com.bjj.evolution.voicenote/`.
- Endpoint `GET /voice-notes?status=&importable=true` (lista a caixa de entrada do usuário).
- Testes de repositório/serviço.
- **Sem** áudio real ainda — pode semear via teste.

### Fase 1 — Captura in-app + transcrição
Objetivo: validar a cadeia áudio→texto **sem** a complexidade do WhatsApp.
- `POST /voice-notes` (multipart: upload de áudio pelo próprio app) → grava via `FileStorage`, cria `VoiceNote` status `RECEIVED`.
- Interface `TranscriptionService` (porta) + 1 implementação (Whisper API) atrás de `@ConditionalOnProperty`, espelhando o padrão de `NotificationConfig`/`StorageConfig`. Implementação `Disabled...` pra manter app bootável sem chave.
- Transcrição roda **`@Async`**: ao receber, enfileira → preenche `transcript` → status `TRANSCRIBED`.
- Tela simples no front (feature `voice-notes`) pra gravar/enviar e ver a transcrição.

### Fase 2 — Import no treino *(o coração da feature)*
Objetivo: anexar notas a um treino e tirá-las da caixa.
- Decidir `TrainingNote` vs `description` (recomendado: `TrainingNote`).
- Endpoint `GET /trainings/{id}/importable-notes` → `VoiceNote` do dono, `trainingId IS NULL`, `capturedAt` na janela da aula (ex.: ±12h do `sessionDate`).
- Endpoint `POST /trainings/{id}/notes/import` body `{ voiceNoteIds: [] }`:
  1. valida que as notas são do dono e estão `trainingId IS NULL`;
  2. (opcional Fase 2/3) gate de presença `CONFIRMED`;
  3. projeta o transcript pro treino (`TrainingNote` ou `description`);
  4. seta `trainingId` + status `IMPORTED` na `VoiceNote`.
- FK com `ON DELETE SET NULL` já cobre "treino deletado → nota volta". Adicionar teste explícito disso.
- Front: no fluxo de salvar treino, detectar notas do dia e oferecer *"anexar a este treino?"*.

### Fase 3 — Canal WhatsApp inbound
Objetivo: o aluno manda áudio pelo WhatsApp e cai na caixa.
- Provider: WhatsApp Business Cloud API (Meta) **ou** Twilio. Decidir por custo vs. simplicidade.
- `POST /webhooks/whatsapp` (público, validação de assinatura) → **responde rápido** e enfileira `@Async`.
- Mapear telefone → `userProfile`: campo `phone` verificado no perfil. Tratar telefone desconhecido (resposta orientando a cadastrar).
- Baixar a mídia → `FileStorage` → cria `VoiceNote` `source=WHATSAPP` → dispara transcrição (reusa Fase 1).
- Saída de confirmação pelo `NotificationDispatcher` (canal whatsapp).

### Fase 4 — Refinamentos (backlog)
- Resumo/limpeza do transcript via LLM (Claude) antes de virar nota.
- Dedup e reabertura de sessão.
- Vocabulário de BJJ pra melhorar transcrição.
- (Stretch) sugestão de stats a partir do texto pro aluno aplicar com 1 toque — reabre o objetivo original de autofill.

---

## 6. Decisões/risco a resolver antes da Fase 3

- **Custo por mensagem**: WhatsApp (conversa) + transcrição + (LLM) por áudio. Estimar com volume esperado de alunos.
- **Aprovação WhatsApp Business**: verificação de número/empresa + templates aprovados pra mensagens proativas.
- **LGPD**: áudio é dado pessoal. Definir retenção — apagar o áudio do storage após transcrever? Consentimento explícito. Cobrir no fluxo de export/delete do usuário (`UserDataExportService` já existe).
- **Verificação de telefone**: como mapear número → conta de forma confiável (OTP).

---

## 7. Checklist de execução (ordem)

- [ ] **F0**: migration `V2__voice_note.sql` + entidade + repo + `GET /voice-notes` + testes
- [ ] **F1**: `POST /voice-notes` (upload) + `TranscriptionService` (porta + Whisper + Disabled) + transcrição `@Async` + tela
- [ ] **F2**: `TrainingNote` (ou `description`) + `importable-notes` + `notes/import` + `SET NULL` testado + UX de anexar
- [ ] **F2/F3**: decisão e implementação do gate de presença
- [ ] **F3**: webhook WhatsApp + mapeamento telefone→user + download mídia + confirmação via dispatcher
- [ ] **F4**: refinamentos conforme backlog

---

## 8. Pontos de convergência (invariantes a não violar)

1. Treino só se cria/edita por `TrainingService.create/update` — caminho único.
2. `VoiceNote` nasce só com dono; FK pro treino só aparece no import.
3. Áudio sempre via `FileStorage` (chave persistida, nunca URL).
4. Toda integração externa atrás de interface + `@ConditionalOnProperty` (app bootável sem chaves).
5. Webhook nunca processa síncrono — sempre `@Async`.
