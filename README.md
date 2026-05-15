# Payment Gateway Simulator

A production-style backend simulation of how real UPI/payment systems work internally — built with Java 17, Spring Boot 3, MySQL, and Redis. Includes a live web UI served directly from the app.

## What This Simulates

| Feature | Details |
|---|---|
| **State Machine** | `INITIATED → PROCESSING → SUCCESS/FAILED`. Strictly enforced — no skipping, no going backwards |
| **Idempotency** | Same `idempotencyKey` always returns the same transaction, never processed twice |
| **Retry + Backoff** | Auto-retries at 2 s, 4 s, 8 s. Permanently FAILED after 3 attempts |
| **Webhook** | Fires a notification on every terminal state (SUCCESS / FAILED) |
| **Optimistic Locking** | JPA `@Version` prevents concurrent updates from corrupting state |
| **Redis Dedup** | Idempotency keys cached in Redis with 24-hour TTL for instant duplicate detection |

---

## How to Run Locally

### Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8+ on `localhost:3306`
- Redis on `localhost:6379`

### Step 1 — Start MySQL and Redis

```bash
# macOS (Homebrew)
brew services start mysql
brew services start redis

# Linux
sudo systemctl start mysql redis
```

### Step 2 — Configure credentials (if needed)

The app defaults to `root / root` for MySQL. If your setup differs, edit:

```
src/main/resources/application.properties
```

```properties
spring.datasource.username=root
spring.datasource.password=your_password
```

The database `paygateway` is auto-created on first run (`createDatabaseIfNotExist=true`).

### Step 3 — Build and run

```bash
mvn spring-boot:run
```

That's it. The server starts on port 8080.

### Step 4 — Open the UI

```
http://localhost:8080
```

The web dashboard lets you initiate payments, check transaction status, view live stats, and watch the state machine in action.

---

## API Endpoints

### `POST /api/payments/initiate`

Initiate a payment. Idempotent — calling twice with the same key returns the existing transaction.

```bash
curl -X POST http://localhost:8080/api/payments/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
    "amount": 499.99
  }'
```

**Response:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "idempotencyKey": "550e8400-e29b-41d4-a716-446655440000",
  "amount": 499.99,
  "status": "SUCCESS",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:01",
  "version": 2,
  "retryCount": 0
}
```

---

### `GET /api/payments/{transactionId}`

Get the current state of a transaction.

```bash
curl http://localhost:8080/api/payments/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

### `GET /api/payments/stats`

Get live transaction counts by status — used by the dashboard.

```bash
curl http://localhost:8080/api/payments/stats
```

```json
{ "total": 12, "initiated": 0, "processing": 2, "success": 8, "failed": 2 }
```

---

## How It Works

### State Machine

```
INITIATED ──► PROCESSING ──► SUCCESS
                        └──► FAILED
```

`TransactionStatus.canTransitionTo()` enforces every transition. Any invalid transition throws an exception before touching the database.

### Idempotency Flow

```
Client sends idempotencyKey
    │
    ▼
Check Redis (O(1))
    ├─ HIT  → return cached transaction (no DB hit)
    │
    └─ MISS → Check MySQL
                  ├─ Found  → re-cache in Redis, return
                  └─ Not found → create new transaction
```

### Retry with Exponential Backoff

`RetryService` runs on a 5-second schedule. It picks up any transaction stuck in `PROCESSING`:

| Attempt | Waits before retrying | Success chance |
|---|---|---|
| 1 | 2 s | 60% |
| 2 | 4 s | 60% |
| 3 | 8 s | 60% |
| — | — | → permanent FAILED |

### Webhook

When a transaction reaches `SUCCESS` or `FAILED`, `WebhookService.notifyTerminalState()` fires:

```
=== WEBHOOK NOTIFICATION ===
POST /webhook/notify
  transactionId : a1b2c3...
  status        : SUCCESS
  amount        : 499.99
============================
```

In production this would make an actual HTTP POST to the merchant's callback URL.

---

## Database Schema

Auto-created by Hibernate (`ddl-auto=update`):

```sql
CREATE TABLE transactions (
    id              VARCHAR(36)    PRIMARY KEY,
    idempotency_key VARCHAR(64)    UNIQUE NOT NULL,
    amount          DECIMAL(15,2)  NOT NULL,
    status          VARCHAR(20)    NOT NULL,
    created_at      DATETIME,
    updated_at      DATETIME,
    version         INT,
    retry_count     INT DEFAULT 0
);
```

---

## Project Structure

```
src/main/java/com/paygateway/
├── PaymentGatewayApplication.java    # Entry point + @EnableScheduling
├── config/
│   ├── RedisConfig.java              # RedisTemplate bean
│   └── WebConfig.java                # CORS configuration
├── controller/
│   └── PaymentController.java        # REST endpoints + request validation
├── service/
│   ├── PaymentService.java           # Core logic: idempotency, state transitions, stats
│   ├── RetryService.java             # Scheduled retry with exponential backoff
│   └── WebhookService.java           # Webhook notification simulation
├── repository/
│   └── TransactionRepository.java    # JPA queries
└── model/
    ├── Transaction.java              # JPA entity with @Version optimistic locking
    └── TransactionStatus.java        # Enum with state machine rules

src/main/resources/
├── application.properties            # DB + Redis + app config
└── static/
    └── index.html                    # Web dashboard (served at http://localhost:8080)
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.2 |
| Language | Java 17 |
| Database | MySQL 8 |
| Cache | Redis |
| Build | Maven |
| Container | Docker (multi-stage, Alpine) |
| Frontend | HTML5 + Vanilla JS (no dependencies) |
