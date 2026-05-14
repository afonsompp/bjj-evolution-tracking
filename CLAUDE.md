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
