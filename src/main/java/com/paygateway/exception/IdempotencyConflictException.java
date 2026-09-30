package com.paygateway.exception;

/**
 * Thrown when an idempotency key is reused with a different amount.
 * The same key must always mean the same payment. Returned to the client as 409.
 */
public class IdempotencyConflictException extends RuntimeException {

    public IdempotencyConflictException(String idempotencyKey) {
        super("idempotencyKey '" + idempotencyKey + "' was already used for a payment with a different amount");
    }
}
