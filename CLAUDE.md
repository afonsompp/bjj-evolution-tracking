# CLAUDE.md

Guia de estilo e memória técnica para agentes de IA que colaboram neste repositório.
Mantenha este arquivo atualizado sempre que padrões arquiteturais mudarem.

---

## 1. Project Overview

**BJJ Evolution Tracking** — API REST em Spring Boot para gerenciamento de academias de Brazilian Jiu-Jitsu, cobrindo cadastro de alunos, agendamento de aulas, check-ins (attendance), catálogo de técnicas e log de treinos individuais.

---

## 2. Tech Stack

| Camada | Tecnologia | Versão |
|---|---|---|
| Linguagem | Java | **21** |
| Framework | Spring Boot | **4.0.1** |
| Build | Maven Wrapper | **3.9.12** |
| Persistência | Spring Data JPA (Hibernate) | herdada do Boot |
| Banco de Dados | PostgreSQL (runtime driver) | _placeholder: versão não definida em config_ |
| Segurança | Spring Security + OAuth2 Resource Server (JWT) | herdada do Boot |
| Validação | Jakarta Bean Validation | herdada do Boot |
| Documentação | springdoc-openapi (Swagger UI) | **2.5.0** |
| Migrations | _placeholder: nenhuma ferramenta (Flyway/Liquibase) declarada no pom_ |

---

## 3. Build & Run Commands

Use sempre o **Maven Wrapper** (`./mvnw`) para garantir reprodutibilidade.

