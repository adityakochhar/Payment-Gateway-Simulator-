package com.paygateway.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TransactionStatusTest {

    @Test
    void allowedMoves() {
        assertTrue(TransactionStatus.INITIATED.canTransitionTo(TransactionStatus.PROCESSING));
        assertTrue(TransactionStatus.PROCESSING.canTransitionTo(TransactionStatus.SUCCESS));
        assertTrue(TransactionStatus.PROCESSING.canTransitionTo(TransactionStatus.FAILED));
    }

    @Test
    void cannotSkipProcessing() {
        assertFalse(TransactionStatus.INITIATED.canTransitionTo(TransactionStatus.SUCCESS));
        assertFalse(TransactionStatus.INITIATED.canTransitionTo(TransactionStatus.FAILED));
    }

    @Test
    void cannotGoBackwards() {
        assertFalse(TransactionStatus.PROCESSING.canTransitionTo(TransactionStatus.INITIATED));
    }

    @Test
    void finalStatesNeverChange() {
        for (TransactionStatus next : TransactionStatus.values()) {
            assertFalse(TransactionStatus.SUCCESS.canTransitionTo(next));
            assertFalse(TransactionStatus.FAILED.canTransitionTo(next));
        }
    }
}
