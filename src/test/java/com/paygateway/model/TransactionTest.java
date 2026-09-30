package com.paygateway.model;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TransactionTest {

    @Test
    void newTransactionStartsAsInitiated() {
        Transaction transaction = new Transaction("order-1", new BigDecimal("100.00"));

        assertNotNull(transaction.getId());
        assertEquals(TransactionStatus.INITIATED, transaction.getStatus());
        assertEquals(0, transaction.getRetryCount());
    }

    @Test
    void followsTheStateMachine() {
        Transaction transaction = new Transaction("order-2", new BigDecimal("100.00"));

        transaction.changeStatus(TransactionStatus.PROCESSING);
        transaction.changeStatus(TransactionStatus.SUCCESS);

        assertEquals(TransactionStatus.SUCCESS, transaction.getStatus());
    }

    @Test
    void rejectsInvalidStatusChange() {
        Transaction transaction = new Transaction("order-3", new BigDecimal("100.00"));

        // Cannot jump from INITIATED straight to SUCCESS
        assertThrows(IllegalStateException.class,
                () -> transaction.changeStatus(TransactionStatus.SUCCESS));
        assertEquals(TransactionStatus.INITIATED, transaction.getStatus());
    }

    @Test
    void countsRetries() {
        Transaction transaction = new Transaction("order-4", new BigDecimal("100.00"));

        transaction.increaseRetryCount();
        transaction.increaseRetryCount();

        assertEquals(2, transaction.getRetryCount());
    }
}
