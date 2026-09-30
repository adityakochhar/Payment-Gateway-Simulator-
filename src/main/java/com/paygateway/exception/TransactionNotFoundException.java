package com.paygateway.exception;

/** Thrown when no transaction exists with the given id. Returned to the client as 404. */
public class TransactionNotFoundException extends RuntimeException {

    public TransactionNotFoundException(String transactionId) {
        super("Transaction not found: " + transactionId);
    }
}
