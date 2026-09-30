package com.paygateway.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

/**
 * JSON body for POST /api/payments/initiate
 * Example: { "idempotencyKey": "order-123", "amount": 499.99 }
 */
public class PaymentRequest {

    @NotBlank(message = "idempotencyKey is required")
    @Size(max = 64, message = "idempotencyKey must be at most 64 characters")
    private String idempotencyKey;

    @NotNull(message = "amount is required")
    @DecimalMin(value = "0.01", message = "amount must be at least 0.01")
    @Digits(integer = 13, fraction = 2, message = "amount can have at most 13 digits and 2 decimal places")
    private BigDecimal amount;

    public String getIdempotencyKey() { return idempotencyKey; }
    public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
}
