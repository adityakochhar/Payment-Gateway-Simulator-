package com.paygateway.service;

import com.paygateway.model.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

@Service
public class WebhookService {

    private static final Logger log = LoggerFactory.getLogger(WebhookService.class);

    /**
     * Simulates sending a webhook to a merchant callback URL.
     * In production this would make an actual HTTP POST.
     */
    public void notifyTerminalState(Transaction transaction) {
        log.info("=== WEBHOOK NOTIFICATION ===");
        log.info("POST /webhook/notify");
        log.info("  transactionId : {}", transaction.getId());
        log.info("  status        : {}", transaction.getStatus());
        log.info("  amount        : {}", transaction.getAmount());
        log.info("  idempotencyKey: {}", transaction.getIdempotencyKey());
        log.info("============================");
    }
}
