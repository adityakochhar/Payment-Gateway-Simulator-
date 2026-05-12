package com.paygateway.controller;

import com.paygateway.model.Transaction;
import com.paygateway.service.PaymentService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);
    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /**
     * Initiate a payment. Idempotent — safe to call multiple times with same key.
     */
    @PostMapping("/initiate")
    public ResponseEntity<Transaction> initiatePayment(@Valid @RequestBody PaymentRequest request) {
        log.info("Payment initiation request: key={}, amount={}", request.getIdempotencyKey(), request.getAmount());
        Transaction transaction = paymentService.initiatePayment(request.getIdempotencyKey(), request.getAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }

    /**
     * Get transaction status by ID.
     */
    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> getPaymentStatus(@PathVariable String transactionId) {
        Transaction transaction = paymentService.getTransaction(transactionId);
        return ResponseEntity.ok(transaction);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        log.error("Request error: {}", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", ex.getMessage()));
    }

    public static class PaymentRequest {
        @NotBlank(message = "idempotencyKey is required")
        private String idempotencyKey;

        @NotNull(message = "amount is required")
        @DecimalMin(value = "0.01", message = "amount must be positive")
        private BigDecimal amount;

        public String getIdempotencyKey() { return idempotencyKey; }
        public void setIdempotencyKey(String idempotencyKey) { this.idempotencyKey = idempotencyKey; }

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
    }
}
