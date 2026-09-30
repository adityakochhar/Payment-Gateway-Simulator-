package com.paygateway.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @Column(name = "id", columnDefinition = "VARCHAR(36)")
    private String id;

    @Column(name = "idempotency_key", unique = true, nullable = false, length = 64)
    private String idempotencyKey;

    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private TransactionStatus status;

    // Instant = an exact moment in UTC. It is sent to the browser like
    // "2026-09-30T11:30:37Z" and the browser shows it in the user's own time zone.
    @Column(name = "created_at", columnDefinition = "datetime")
    private Instant createdAt;

    @Column(name = "updated_at", columnDefinition = "datetime")
    private Instant updatedAt;

    // Optimistic locking: JPA increases this number on every update.
    // If two updates happen at the same time, the second one fails
    // instead of silently overwriting the first one.
    @Version
    @Column(name = "version")
    private Integer version;

    @Column(name = "retry_count")
    private int retryCount;

    // Empty constructor is required by JPA. Our code uses the other constructor.
    protected Transaction() {
    }

    public Transaction(String idempotencyKey, BigDecimal amount) {
        this.id = UUID.randomUUID().toString();
        this.idempotencyKey = idempotencyKey;
        this.amount = amount;
        this.status = TransactionStatus.INITIATED;
        this.retryCount = 0;
    }

    @PrePersist
    protected void onCreate() {
        // The DB column stores whole seconds, so we drop the fraction here.
        // That way the first API response matches what is saved in MySQL.
        Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now().truncatedTo(ChronoUnit.SECONDS);
    }

    /**
     * The ONLY way to change the status.
     * It follows the state machine: INITIATED -> PROCESSING -> SUCCESS / FAILED.
     */
    public void changeStatus(TransactionStatus nextStatus) {
        if (!status.canTransitionTo(nextStatus)) {
            throw new IllegalStateException(
                    "Invalid status change " + status + " -> " + nextStatus + " for transaction " + id);
        }
        status = nextStatus;
    }

    public void increaseRetryCount() {
        retryCount = retryCount + 1;
    }

    public String getId() { return id; }

    public String getIdempotencyKey() { return idempotencyKey; }

    public BigDecimal getAmount() { return amount; }

    public TransactionStatus getStatus() { return status; }

    public Instant getCreatedAt() { return createdAt; }

    public Instant getUpdatedAt() { return updatedAt; }

    public Integer getVersion() { return version; }

    public int getRetryCount() { return retryCount; }
}
