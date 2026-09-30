# Payment Gateway Simulator

A simulation of how a real payment gateway (like UPI) works on the inside — built with
**Java 17, Spring Boot 3, MySQL, Redis** and a **React** dashboard.

| Feature | What it does |
|---|---|
| **State machine** | `INITIATED → PROCESSING → SUCCESS / FAILED`. No skipping, no going backwards |
| **Idempotency** | The same `idempotencyKey` always returns the same payment — never charged twice, even if 5 requests arrive at the same moment |
| **Conflict check** | Reusing a key with a *different* amount is rejected with `409 Conflict` |
| **Retry + backoff** | Stuck payments are retried after 2s, 4s, 8s. `FAILED` after 3 failed retries |
| **Webhook** | A notification is logged every time a payment reaches `SUCCESS` or `FAILED` |
| **Optimistic locking** | JPA `@Version` stops two updates from silently overwriting each other |
| **Redis cache + fallback** | Idempotency keys are cached in Redis for 24h. If Redis is down, MySQL is used instead |

---

## Project structure

```
├── src/main/java/com/paygateway/
│   ├── PaymentGatewayApplication.java   Entry point (+ @EnableScheduling)
│   ├── config/WebConfig.java            CORS (lets the React app call the API)
│   ├── controller/PaymentController.java  REST endpoints (HTTP only, no logic)
│   ├── dto/PaymentRequest.java          Request body + validation rules
│   ├── exception/                       Custom errors + GlobalExceptionHandler (clean JSON errors)
│   ├── model/                           Transaction entity + TransactionStatus state machine
│   ├── repository/TransactionRepository.java  Database queries
│   └── service/
│       ├── PaymentService.java          Main logic: idempotency, state changes, stats
│       ├── IdempotencyCache.java        Redis wrapper (falls back to MySQL if Redis is down)
│       ├── RetryService.java            Background job: retries with exponential backoff
│       └── WebhookService.java          Webhook simulation
├── src/main/resources/
│   ├── application.properties           Settings (no passwords — safe to commit)
│   ├── secrets.properties.example       Template for your local passwords
│   └── static/index.html                Small "API is running" page
├── src/test/java/                       Unit tests
├── frontend/                            React dashboard (Vite)
│   ├── .env.development                 Backend URL for local dev (localhost:8080)
│   ├── .env.production                  Backend URL for the deployed site (Render)
│   └── src/
│       ├── api.js                       All calls to the backend (timeout + readable errors)
│       ├── utils.js                     Small helpers (dates, amounts, status colors, history)
│       ├── index.css                    Tailwind + our colors and fonts
│       ├── App.jsx                      Page state + auto-refresh of pending payments
│       └── components/                  UI pieces (Checkout, LiveTracker, Timeline, ...)
└── Dockerfile                           Used by Render to build and run the backend
```

---

## Run it locally

### Prerequisites
- Java 17+ and Maven
- Node.js 20.19+ (or 22+)
- A MySQL database (e.g. free [Aiven](https://aiven.io/free-mysql-database)) and a Redis database (e.g. free [Redis Cloud](https://redis.io/cloud/))

### 1. Add your passwords
```bash
cp src/main/resources/secrets.properties.example src/main/resources/secrets.properties
```
Open `secrets.properties` and fill in your MySQL and Redis details.
This file is git-ignored, so your passwords never reach GitHub.

### 2. Start the backend
```bash
mvn spring-boot:run
```
Wait for `Started PaymentGatewayApplication`. The API runs on http://localhost:8080.
The `transactions` table is created automatically on first start.

### 3. Start the frontend (second terminal)
```bash
cd frontend
npm install
npm run dev
```
Open the URL it prints (usually http://localhost:5173).

### 4. Run the tests
```bash
mvn test
```

---

## API

### `POST /api/payments/initiate`
```bash
curl -X POST http://localhost:8080/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{"idempotencyKey": "order-123", "amount": 499.99}'
```
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "idempotencyKey": "order-123",
  "amount": 499.99,
  "status": "SUCCESS",
  "createdAt": "2026-09-30T11:34:24Z",
  "updatedAt": "2026-09-30T11:34:25Z",
  "version": 2,
  "retryCount": 0
}
```

### `GET /api/payments/{id}` — current state of one payment
### `GET /api/payments/stats` — `{ "total": 12, "initiated": 0, "processing": 2, "success": 8, "failed": 2 }`

### Status codes
| Code | When |
|---|---|
| `201` | Payment created (or the existing one returned for a repeated key) |
| `400` | Invalid input — e.g. missing key, amount ≤ 0, more than 2 decimals, key longer than 64 characters |
| `404` | No payment with that id |
| `409` | Idempotency key already used with a different amount |
| `500` | Unexpected server error (details only in the server log, never sent to the client) |

All errors look like `{ "error": "message" }`.

---

## How it works

### Idempotency
```
Request with idempotencyKey
  │
  ├─ Redis has the key?  → return that payment        (fast path)
  ├─ MySQL has the key?  → return it, save key to Redis (Redis empty or down)
  └─ New key             → INSERT the payment
                            └─ INSERT fails with "duplicate key"?
                               Another request saved it a moment earlier → return that one
```
The `idempotency_key` column is `UNIQUE`, so the database itself guarantees a key is only used once.

### Retry with exponential backoff
`RetryService` runs every 5 seconds and picks up payments stuck in `PROCESSING`:

| Retry | Waits | Success chance (demo) |
|---|---|---|
| 1 | 2 s | 60% |
| 2 | 4 s | 60% |
| 3 | 8 s | 60% |
| — | — | → `FAILED` |

Every status change goes through `Transaction.changeStatus()`, which enforces the state machine.

### Dates
All times are stored and returned in UTC (e.g. `2026-09-30T11:34:24Z`). The browser shows them in the user's own time zone.

---

## Deploying

### Backend (Render, using the Dockerfile)
Add these **Environment Variables** in the Render dashboard (same names as in `secrets.properties`):

| Name | Example |
|---|---|
| `DB_URL` | `jdbc:mysql://HOST:PORT/defaultdb?sslMode=REQUIRED` |
| `DB_USERNAME` | `avnadmin` |
| `DB_PASSWORD` | your MySQL password |
| `REDIS_HOST` | `redis-12345.xxx.cloud.redislabs.com` |
| `REDIS_PORT` | `12345` |
| `REDIS_PASSWORD` | your Redis password |

`PORT` is set by Render automatically.

### Frontend
`npm run build` uses the backend URL from `frontend/.env.production`.
If your backend URL changes, update that file (or set `VITE_API_URL` in your hosting dashboard).

---

## Tech stack
| Layer | Technology |
|---|---|
| Backend | Java 17, Spring Boot 3.2, Spring Data JPA, Bean Validation |
| Database | MySQL 8 |
| Cache | Redis |
| Frontend | React 19, Vite, Tailwind CSS 4 |
| Tests | JUnit 5 |
| Deploy | Docker on Render |
