package com.paygateway.service;

import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.StringRedisTemplate;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertNull;

class IdempotencyCacheTest {

    // A Redis template with no connection behaves like "Redis is down"
    private final IdempotencyCache cache = new IdempotencyCache(new StringRedisTemplate());

    @Test
    void findReturnsNullWhenRedisIsDown() {
        assertNull(cache.findTransactionId("order-1"));
    }

    @Test
    void saveDoesNotCrashWhenRedisIsDown() {
        assertDoesNotThrow(() -> cache.save("order-1", "some-transaction-id"));
    }
}
