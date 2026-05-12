package com.paygateway.model;

public enum TransactionStatus {
    INITIATED,
    PROCESSING,
    SUCCESS,
    FAILED;

    // Valid transitions: INITIATED -> PROCESSING -> SUCCESS or FAILED
    public boolean canTransitionTo(TransactionStatus next) {
        return switch (this) {
            case INITIATED -> next == PROCESSING;
            case PROCESSING -> next == SUCCESS || next == FAILED;
            case SUCCESS, FAILED -> false; // terminal states
        };
    }
}
