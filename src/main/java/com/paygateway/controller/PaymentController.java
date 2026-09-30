package com.paygateway.controller;

import com.paygateway.dto.PaymentRequest;
import com.paygateway.model.Transaction;
import com.paygateway.service.PaymentService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST API for payments. Only handles HTTP here - the real logic is in PaymentService.
 * Errors are turned into JSON by GlobalExceptionHandler.
 */
@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;

    public PaymentController(PaymentService paymentService) {
        this.paymentService = paymentService;
    }

    /** Start a payment. Idempotent: the same key always returns the same transaction. */
    @PostMapping("/initiate")
    public ResponseEntity<Transaction> initiatePayment(@Valid @RequestBody PaymentRequest request) {
        log.info("Payment request: key={}, amount={}", request.getIdempotencyKey(), request.getAmount());
        Transaction transaction = paymentService.initiatePayment(request.getIdempotencyKey(), request.getAmount());
        return ResponseEntity.status(HttpStatus.CREATED).body(transaction);
    }

    /** Count of transactions in each status - used by the dashboard. */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(paymentService.getStats());
    }

    /** Current state of one transaction. */
    @GetMapping("/{transactionId}")
    public ResponseEntity<Transaction> getTransaction(@PathVariable String transactionId) {
        return ResponseEntity.ok(paymentService.getTransaction(transactionId));
    }
}
