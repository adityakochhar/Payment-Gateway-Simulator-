package com.paygateway.service;

import com.paygateway.model.Transaction;
import com.paygateway.model.TransactionStatus;
import com.paygateway.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Random;

/**
 * Background job that retries payments stuck in PROCESSING.
 *
 * Exponential backoff: wait 2s before retry 1, 4s before retry 2, 8s before retry 3.
 * After 3 failed retries the payment is marked FAILED for good.
 */
@Service
public class RetryService {

    private static final Logger log = LoggerFactory.getLogger(RetryService.class);

    // Demo only: each retry succeeds 60% of the time
    private static final int RETRY_SUCCESS_PERCENT = 60;

    private final TransactionRepository transactionRepository;
    private final PaymentService paymentService;
    private final WebhookService webhookService;
    private final Random random = new Random();

    @Value("${app.retry.max-attempts:3}")
    private int maxRetryAttempts;

    @Value("${app.retry.initial-delay-ms:2000}")
    private long initialDelayMs;

    public RetryService(TransactionRepository transactionRepository,
                        PaymentService paymentService,
                        WebhookService webhookService) {
        this.transactionRepository = transactionRepository;
        this.paymentService = paymentService;
        this.webhookService = webhookService;
    }

    /** Runs every 5 seconds. */
    @Scheduled(fixedDelay = 5000)
    public void retryStuckPayments() {
        List<Transaction> stuckPayments = transactionRepository
                .findByStatusAndRetryCountLessThan(TransactionStatus.PROCESSING, maxRetryAttempts);

        for (Transaction transaction : stuckPayments) {
            if (!isTimeToRetry(transaction)) {
                continue;
            }

            // One bad payment must not stop the others from being retried
            try {
                retry(transaction);
            } catch (Exception e) {
                log.error("Retry of transaction {} failed, will try again next round: {}",
                        transaction.getId(), e.getMessage());
            }
        }
    }

    private boolean isTimeToRetry(Transaction transaction) {
        // 2s, 4s, 8s ... (doubles after every retry)
        long waitMs = initialDelayMs * (long) Math.pow(2, transaction.getRetryCount());
        long waitedMs = Duration.between(transaction.getUpdatedAt(), Instant.now()).toMillis();
        return waitedMs >= waitMs;
    }

    private void retry(Transaction transaction) {
        transaction.increaseRetryCount();
        int attempt = transaction.getRetryCount();
        log.info("Retrying transaction {} (attempt {}/{})", transaction.getId(), attempt, maxRetryAttempts);

        boolean paymentSucceeded = random.nextInt(100) < RETRY_SUCCESS_PERCENT;

        if (paymentSucceeded) {
            Transaction saved = paymentService.updateStatus(transaction, TransactionStatus.SUCCESS);
            log.info("Transaction {} succeeded on retry {}", saved.getId(), attempt);
            webhookService.notifyTerminalState(saved);
        } else if (attempt >= maxRetryAttempts) {
            Transaction saved = paymentService.updateStatus(transaction, TransactionStatus.FAILED);
            log.warn("Transaction {} permanently FAILED after {} retries", saved.getId(), attempt);
            webhookService.notifyTerminalState(saved);
        } else {
            // Still PROCESSING - just save the new retry count
            transactionRepository.save(transaction);
            log.warn("Transaction {} retry {} failed, will retry again", transaction.getId(), attempt);
        }
    }
}
