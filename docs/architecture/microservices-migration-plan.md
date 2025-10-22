# Microservices Migration Plan for Todo Solution

Last updated: 2025-09-17

This document outlines the plan to decompose the current Spring Boot monolith into two independently deployable microservices.

- User Service: Registration, login, password reset, admin approval, JWT issuance, user management.
- Todo Service: CRUD for todos and tags, ownership enforcement, and business rules.

The plan uses a strangler pattern to minimize risk and enable incremental cutover.

---

## 1) Objectives

- Separate bounded contexts into independent services with clear ownership.
- Make user authentication/authorization a first-class concern in a dedicated service (IdP-like).
- Keep Todo Service independent from user persistence; rely only on trusted JWT claims.
- Enable flexible deployment and scaling (e.g., scale User Service and Todo Service independently).
- Improve security posture (asymmetric JWT, key rotation, secrets in Key Vault).
- Preserve current API contracts to avoid frontend breakage during migration.

---

## 2) Current State (Monolith)

Spring Boot app with:

- Controllers:
  - AuthController (login, register, password reset)
  - AdminController (user approval/actions)
  - TodoController, TagController
- Security: JWT-based
- Repositories: UserRepository, TodoRepository, TagRepository
- Single application and single datasource config
- React frontend calling a single backend base URL

---

## 3) Target Architecture

- Services
  - User Service: issues JWTs, manages users and approvals.
  - Todo Service: validates JWTs, manages todos/tags, enforces ownership.
- API Gateway (recommended)
  - Route /auth, /users, /admin to User Service
  - Route /todos, /tags to Todo Service
  - Central place for CORS, rate limiting, request logging, and metrics
- AuthN/AuthZ
  - Asymmetric JWT (RS256/ES256) signed by User Service
  - JWKS endpoint exposed by User Service for public key discovery
  - Todo Service validates JWTs using JWKS (supports key rotation)
  - Include approved=true claim to enforce access without synchronous calls
- Data
  - Dedicated databases per service (no cross-service joins)
  - User Service owns user tables
  - Todo Service owns todos/tags
- Inter-service Communication
  - Avoid synchronous calls where possible; Todo Service trusts token claims
  - Optional eventing (e.g., UserApproved) via Azure Service Bus for advanced cases
- Observability
  - Central logging with correlation IDs (traceId)
  - Distributed tracing (OpenTelemetry)
  - Metrics per service and health endpoints

---

## 4) Service Boundaries

### 4.1 User Service

- Endpoints (example)
  - POST /auth/register
  - POST /auth/login
  - POST /auth/forgot-password
  - POST /auth/reset-password
  - GET /auth/jwks (public keys / JWKS)
  - GET /users/me
  - Admin: GET/PUT /admin/users, POST /admin/users/{id}/approve
- Responsibilities
  - Persist users, password hashing
  - Admin approval toggles user status
  - Issue JWTs with claims
    - sub: userId (stable identifier)
    - username or email
    - roles: [USER, ADMIN]
    - approved: boolean
    - exp, iat, iss, aud, kid (for key rotation)
- Security
  - Private key stored in Key Vault or secure secret store
  - Publish public keys via JWKS for validation
  - Optionally support refresh tokens
- Data Store
  - Separate DB for users and auth metadata

### 4.2 Todo Service

- Endpoints (example)
  - CRUD: /todos
  - CRUD/List: /tags
- Responsibilities
  - Require and validate JWTs from User Service
  - Enforce approved==true and ownership via subject claim (sub)
  - Persist todos/tags only; no user tables
- Security
  - Configure as a JWT resource server using User Service’s JWKS URL
  - Authorization checks based on roles and approved claim
- Data Store
  - Separate DB for todos/tags

---

## 5) JWT Strategy

- Asymmetric signing (RS256/ES256)
  - Benefits: public key distribution, safe validation by other services, rotation capability
- JWKS
  - User Service hosts /auth/jwks
  - Todo Service caches JWKS and refreshes periodically
- Claims
  - Required: sub (userId), roles, approved, exp, iat, iss
  - Optional: username/email, aud
- Token lifetimes
  - Short-lived access tokens (e.g., 15 minutes)
  - Optional refresh tokens for session continuity
- Revocation & Approval changes
  - Prefer short-lived tokens; immediate revocation requires added complexity:
    - Token introspection endpoint (sync)
    - Revocation list or eventing (async)
    - Or trigger logout/refresh after approval change

---

## 6) Migration Plan (Strangler Pattern)

### Phase 0: Preparation

- Choose deployment model: 2x Azure App Services or containers on AKS
- Choose databases: separate DBs (recommended) or separate schemas temporarily
- Decide on API Gateway: Spring Cloud Gateway or Azure API Management
- Optional: Azure Service Bus for events
- Define non-functional requirements (SLOs, security, audit)

### Phase 1: Extract User Service

- Create new Spring Boot project: todo-user-service
  - Extract User model, DTOs (RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest)
  - Move AuthController and AdminController
  - Implement token issuance (TokenService) with asymmetric keys
  - Implement JWKS endpoint (/auth/jwks)
  - Introduce Flyway/Liquibase migrations for user DB schema
- Deployment
  - Deploy User Service with its own DB
  - Update frontend or gateway to route /auth/* and /admin/* to User Service
- Keep monolith serving todo/tag endpoints

### Phase 2: Convert Monolith into Todo Service

- Remove user-related code from monolith (controllers, repos, configs)
- Add JWT Resource Server configuration
  - Validate tokens via JWKS URL from User Service
  - Map claims to principal (sub, roles, approved)
  - Enforce approved==true and role-based access
- Ensure all todo operations use userId from token’s sub claim
- Limit DB objects to todos/tags only

### Phase 3: Introduce/Finalize API Gateway

- Configure routes:
  - /auth, /users, /admin -> User Service
  - /todos, /tags -> Todo Service
- Apply:
  - CORS, rate limiting, request/response logging, metrics
  - Consistent error mapping and headers

### Phase 4: Data Migration and Cutover

- Users
  - Migrate users from monolith DB to User Service DB
  - Maintain password hash compatibility; if changing algorithm, support both during rolling migration
- Todos
  - Ensure todos reference a stable user identifier
  - If previously tied to username, introduce a mapping username -> userId and backfill
- Routing
  - Route traffic gradually through gateway
  - Monitor error rates; rollback by toggling routes if needed
- Decommission monolith user endpoints after validation

### Phase 5: Observability, Hardening, SLOs

- Centralized logging with correlation IDs
- Tracing via OpenTelemetry to Azure Monitor/Jaeger/Zipkin
- Metrics (request rate, latency, error rates, auth failures, DB health)
- Security
  - Rotate keys regularly
  - Store secrets/keys in Azure Key Vault
  - Harden CORS, rate limits, WAF rules

---

## 7) API Contracts and Versioning

- Freeze existing payloads to avoid breaking the frontend
- Publish OpenAPI specs per service
- Consider versioning: /v1/...
- Consistent error response formats across services
- Contract testing (e.g., Pact) or OpenAPI validation in CI

---

## 8) Testing Strategy

- Unit tests within each service
- Integration tests for:
  - JWT issuance/validation
  - Admin approval toggling and its effect on access control
- Contract tests between frontend and each service
- E2E Playwright tests via gateway
  - Update env to use gateway base URL
- Load testing for critical paths (login, todo CRUD)

---

## 9) Deployment on Azure

- Compute
  - Azure App Service (Linux/Java) for each service or containerized on AKS
- Databases
  - Two managed databases (e.g., Azure SQL, Cosmos DB) — one per service
- Networking and Gateway
  - Azure API Management or App Gateway (or Spring Cloud Gateway in front)
- Messaging (optional)
  - Azure Service Bus for domain events
- Secrets
  - Azure Key Vault for private keys and credentials

---

## 10) Incremental Code Changes Map

### 10.1 User Service (new project)

- Packages
  - controller: AuthController, AdminController, JwksController
  - service: UserService, TokenService, PasswordService
  - repository: UserRepository
  - security: SecurityConfig, KeyProvider, JwtConfig
  - dto: RegisterRequest, LoginRequest, ForgotPasswordRequest, ResetPasswordRequest
  - model: User
- Features
  - JWT issuance (RS256/ES256)
  - JWKS publishing
  - Admin approval endpoints
- Tooling
  - Flyway/Liquibase for DB schema
  - Tests (unit/integration) and test keys for signing in test env

### 10.2 Todo Service (refactor existing monolith)

- Remove
  - AuthController, AdminController, UserRepository, user domain artifacts
- Add
  - JwtResourceServerConfig with JWKS validation
  - Converter from JWT claims to SecurityPrincipal (sub, roles, approved)
  - Method-level or filter-based authorization enforcing approved==true
- Update
  - Service layer uses principal.sub as owner id
  - Tests generating JWTs signed by a test key matching test JWKS

---

## 11) Data Migration Notes

- Users
  - Preserve user IDs and password hashes
  - If changing hashing algorithms: support dual validation during migration; rehash on next login
- Todos
  - Ensure todos are linked to userId (token sub) instead of mutable identifiers (e.g., username)
  - Backfill ownerId where necessary
- One-time scripts
  - Create scripts for user export/import, mapping generation, and data integrity validation

---

## 12) Risk Management and Rollback

- Use gateway feature flags for routing
- Dark launch User Service; mirror traffic for testing where feasible
- Rollback plan: revert /auth/* and /admin/* routes to previous implementation
- Monitoring: alert on spikes in 401/403/5xx during cutover
- Blue/green or canary deployments for both services

---

## 13) Open Decisions

- Gateway now vs. later
  - Start with two base URLs or introduce gateway immediately?
- Database isolation
  - Separate servers vs. separate schemas (migration path to full isolation)
- Token revocation strategy
  - Short-lived tokens only vs. introspection/revocation events
- Messaging
  - Introduce Azure Service Bus now or defer until needed

---

## 14) Next Steps

1. Scaffold todo-user-service with JWT issuance and JWKS endpoint.
2. Deploy User Service with its own database and migrations.
3. Route /auth/* and /admin/* to User Service (via gateway or frontend config).
4. Refactor existing backend into Todo Service; configure JWKS-based JWT validation and claim enforcement.
5. Migrate user data; verify login/approval flows end-to-end.
6. Run E2E tests through gateway; monitor and then fully cut over.

---

## 15) Appendix

### 15.1 Suggested Repository/Module Layout

- mono-repo (initial)
  - todo-user-service/
  - todo-backend/ (becomes todo-service)
  - todo-frontend/
  - docs/architecture/
- or split into separate repos per service later for autonomy

### 15.2 Environment Variables (examples)

- USER_SERVICE
  - JWT_ISSUER
  - JWT_PRIVATE_KEY / KEY_VAULT_URI
  - JWKS_KID
  - DB_URL, DB_USER, DB_PASSWORD
- TODO_SERVICE
  - JWT_ISSUER_EXPECTED
  - JWKS_URL
  - DB_URL, DB_USER, DB_PASSWORD
- GATEWAY (if applicable)
  - USER_SERVICE_BASE_URL
  - TODO_SERVICE_BASE_URL

### 15.3 Example Claims

```json
{
  "iss": "https://user-service.example.com",
  "sub": "c2f6b1a8-1c7b-4c8c-b1e6-2d6f1f0b9a2e",
  "username": "alice",
  "roles": ["USER"],
  "approved": true,
  "iat": 1710000000,
  "exp": 1710000900,
  "aud": "todo-api",
  "kid": "key-2025-09"
}
```

### 15.4 Validation Rules in Todo Service

- Deny if:
  - Token invalid/expired
  - iss or aud mismatch
  - approved != true
- Authorize access to resources only if resource.ownerId == token.sub (unless ADMIN role)

---

This document serves as the reference plan. Update this as decisions are finalized and phases are executed.
