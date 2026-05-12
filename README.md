# Payment Gateway Simulator

A backend simulation of how real UPI/payment systems work internally — built with Java, Spring Boot, MySQL, and Redis.

## What This Simulates

- **State Machine**: Every payment goes `INITIATED → PROCESSING → SUCCESS/FAILED`. No skipping, no going backwards.
- **Idempotency**: Send the same payment request twice, get the same result — never charged twice.
- **Retry with Exponential Backoff**: Failed payments auto-retry at 2s, 4s, 8s. After 3 failures, permanently marked FAILED.
- **Webhook Notifications**: On terminal state (SUCCESS/FAILED), a webhook fires to notify the merchant.
- **Optimistic Locking**: Concurrent updates to the same transaction are safely handled via JPA `@Version`.
- **Redis Deduplication**: Idempotency keys cached in Redis for 24 hours for ultra-fast duplicate detection.

## Prerequisites

- Java 17+
- Maven 3.8+
- MySQL 8+ running on `localhost:3306`
- Redis running on `localhost:6379`

## Setup

**1. Start MySQL and Redis**
```bash
# MySQL (macOS with Homebrew)
brew services start mysql

# Redis
brew services start redis
```

**2. Create MySQL user/database** (the app auto-creates the schema)
```sql
mysql -u root -p
-- If your root password is not "root", update application.properties
```

**3. Configure credentials**

Edit `src/main/resources/application.properties`:
```
spring.datasource.username=root
spring.datasource.password=your_password
```

**4. Build and Run**
```bash
mvn clean package -DskipTests
java -jar target/payment-gateway-simulator-1.0.0.jar
```

Or directly:
```bash
mvn spring-boot:run
```

Server starts at `http://localhost:8080`

---

## API Endpoints

### POST /api/payments/initiate
Initiate a payment. Idempotent — calling with the same `idempotencyKey` twice returns the same transaction.

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
  "id": "a1b2c3d4-...",
  "idempotencyKey": "550e8400-...",
  "amount": 499.99,
  "status": "SUCCESS",
  "createdAt": "2024-01-15T10:30:00",
  "updatedAt": "2024-01-15T10:30:00",
  "version": 2,
  "retryCount": 0
}
```

---

### GET /api/payments/{transactionId}
Get current status of a transaction.

```bash
curl http://localhost:8080/api/payments/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## How It Works

### State Machine
```
INITIATED ──► PROCESSING ──► SUCCESS
                        └──► FAILED
```
The `TransactionStatus.canTransitionTo()` method enforces valid transitions. Any invalid transition throws an exception.

### Idempotency Flow
```
Client sends idempotencyKey
    │
    ▼
Check Redis cache
    │ Found → return cached transaction (no DB hit)
    │
    ▼ Not found
Check MySQL
    │ Found → re-cache in Redis, return
    │
    ▼ Not found
Create new transaction → process → cache result
```

### Retry with Exponential Backoff
The `RetryService` runs every 5 seconds. It picks up transactions stuck in `PROCESSING`:
- Retry 1: waits 2 seconds
- Retry 2: waits 4 seconds  
- Retry 3: waits 8 seconds
- After 3 failures → mark `FAILED`, trigger webhook

### Webhook
When a transaction reaches SUCCESS or FAILED, `WebhookService.notifyTerminalState()` logs:
```
=== WEBHOOK NOTIFICATION ===
POST /webhook/notify
  transactionId : a1b2c3...
  status        : SUCCESS
  amount        : 499.99
============================
```
In production this would make an HTTP POST to the merchant's callback URL.

## Database Schema

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
Schema is auto-created by Hibernate (`ddl-auto=update`).

## Project Structure

```
src/main/java/com/paygateway/
├── PaymentGatewayApplication.java    # Entry point
├── controller/
│   └── PaymentController.java        # REST endpoints
├── service/
│   ├── PaymentService.java           # Core payment logic + idempotency
│   ├── RetryService.java             # Scheduled retry with backoff
│   └── WebhookService.java           # Webhook notification simulation
├── repository/
│   └── TransactionRepository.java    # JPA queries
├── model/
│   ├── Transaction.java              # JPA entity with optimistic locking
│   └── TransactionStatus.java        # Enum with state machine rules
└── config/
    └── RedisConfig.java              # Redis template setup
```
