package com.paygateway.model;

/**
 * Payment states and the allowed moves between them:
 *
 *   INITIATED -> PROCESSING -> SUCCESS
 *                          \-> FAILED
 *
 * SUCCESS and FAILED are final: nothing can change after that.
 */
public enum TransactionStatus {
    INITIATED,
    PROCESSING,
    SUCCESS,
    FAILED;

    public boolean canTransitionTo(TransactionStatus next) {
        if (this == INITIATED) {
            return next == PROCESSING;
        }
        if (this == PROCESSING) {
            return next == SUCCESS || next == FAILED;
        }
        // SUCCESS and FAILED are final states
        return false;
    }
}
