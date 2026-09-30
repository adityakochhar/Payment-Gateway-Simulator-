package com.paygateway.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.time.Duration;

/**
 * Small wrapper around Redis that remembers: idempotencyKey -> transactionId.
 *
 * Redis is only a speed-up. MySQL always has the real data.
 * So if Redis is down, we log a warning and carry on instead of failing the payment.
 */
@Component
public class IdempotencyCache {

    private static final Logger log = LoggerFactory.getLogger(IdempotencyCache.class);
    private static final String KEY_PREFIX = "idempotency:";

    private final StringRedisTemplate redis;

    @Value("${app.idempotency.ttl-seconds:86400}")
    private long ttlSeconds = 86400;

    public IdempotencyCache(StringRedisTemplate redis) {
        this.redis = redis;
    }

    /** Returns the saved transaction id, or null if not found (or Redis is down). */
    public String findTransactionId(String idempotencyKey) {
        try {
            return redis.opsForValue().get(KEY_PREFIX + idempotencyKey);
        } catch (Exception e) {
            log.warn("Redis is not available, checking MySQL instead. Reason: {}", e.getMessage());
            return null;
        }
    }

    /** Remembers the transaction id for this key. Does nothing if Redis is down. */
    public void save(String idempotencyKey, String transactionId) {
        try {
            redis.opsForValue().set(KEY_PREFIX + idempotencyKey, transactionId, Duration.ofSeconds(ttlSeconds));
        } catch (Exception e) {
            log.warn("Could not save idempotency key to Redis. Reason: {}", e.getMessage());
        }
    }
}
