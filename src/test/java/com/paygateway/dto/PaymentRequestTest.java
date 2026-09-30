package com.paygateway.dto;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PaymentRequestTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    private PaymentRequest request(String key, String amount) {
        PaymentRequest request = new PaymentRequest();
        request.setIdempotencyKey(key);
        request.setAmount(amount == null ? null : new BigDecimal(amount));
        return request;
    }

    private String errorFor(PaymentRequest request) {
        Set<ConstraintViolation<PaymentRequest>> errors = validator.validate(request);
        assertEquals(1, errors.size(), "expected exactly one validation error");
        return errors.iterator().next().getMessage();
    }

    @Test
    void validRequestHasNoErrors() {
        assertTrue(validator.validate(request("order-1", "499.99")).isEmpty());
    }

    @Test
    void keyIsRequired() {
        assertEquals("idempotencyKey is required", errorFor(request("  ", "10")));
    }

    @Test
    void keyIsAtMost64Characters() {
        String longKey = "k".repeat(65);
        assertEquals("idempotencyKey must be at most 64 characters", errorFor(request(longKey, "10")));
    }

    @Test
    void amountIsRequired() {
        assertEquals("amount is required", errorFor(request("order-1", null)));
    }

    @Test
    void amountMustBePositive() {
        assertEquals("amount must be at least 0.01", errorFor(request("order-1", "0")));
    }

    @Test
    void amountHasAtMostTwoDecimals() {
        assertEquals("amount can have at most 13 digits and 2 decimal places", errorFor(request("order-1", "10.999")));
    }

    @Test
    void amountCannotBeHuge() {
        assertEquals("amount can have at most 13 digits and 2 decimal places",
                errorFor(request("order-1", "1000000000000000")));
    }
}
