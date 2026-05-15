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
