package com.paygateway.service;

import com.paygateway.model.Transaction;
import com.paygateway.model.TransactionStatus;
import com.paygateway.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.Random;

@Service
public class RetryService {

    private static final Logger log = LoggerFactory.getLogger(RetryService.class);
    private static final String REDIS_KEY_PREFIX = "idempotency:";

    private final TransactionRepository transactionRepository;
    private final WebhookService webhookService;
    private final RedisTemplate<String, String> redisTemplate;
    private final Random random = new Random();

    @Value("${app.retry.max-attempts:3}")
    private int maxRetryAttempts;

    @Value("${app.retry.initial-delay-ms:2000}")
    private long initialDelayMs;

    public RetryService(TransactionRepository transactionRepository,
                        WebhookService webhookService,
                        RedisTemplate<String, String> redisTemplate) {
        this.transactionRepository = transactionRepository;
        this.webhookService = webhookService;
        this.redisTemplate = redisTemplate;
    }

    /**
     * Runs every 5 seconds, picks up PROCESSING transactions that need retry.
     * Exponential backoff: 2s, 4s, 8s.
     * Not @Transactional at the loop level — each save() is its own transaction
     * so one optimistic-lock failure doesn't roll back the entire batch.
     */
    @Scheduled(fixedDelay = 5000)
    public void retryFailedPayments() {
        List<Transaction> stuck = transactionRepository
                .findByStatusAndRetryCountLessThan(TransactionStatus.PROCESSING, maxRetryAttempts);

        for (Transaction tx : stuck) {
            long expectedDelay = initialDelayMs * (long) Math.pow(2, tx.getRetryCount());
            long elapsedMs = Duration.between(tx.getUpdatedAt(), java.time.LocalDateTime.now()).toMillis();

            if (elapsedMs < expectedDelay) {
                continue; // Not time yet
            }

            log.info("Retrying transaction {} (attempt {}/{})", tx.getId(), tx.getRetryCount() + 1, maxRetryAttempts);
            tx.setRetryCount(tx.getRetryCount() + 1);

            boolean success = random.nextInt(10) < 6; // 60% success on retry

            if (success) {
                tx.setStatus(TransactionStatus.SUCCESS);
                transactionRepository.save(tx);
                log.info("Transaction {} succeeded on retry {}", tx.getId(), tx.getRetryCount());
                redisTemplate.opsForValue().set(
                    REDIS_KEY_PREFIX + tx.getIdempotencyKey(),
                    tx.getId(),
                    Duration.ofSeconds(86400)
                );
                webhookService.notifyTerminalState(tx);
            } else if (tx.getRetryCount() >= maxRetryAttempts) {
                tx.setStatus(TransactionStatus.FAILED);
                transactionRepository.save(tx);
                log.warn("Transaction {} permanently FAILED after {} retries", tx.getId(), maxRetryAttempts);
                webhookService.notifyTerminalState(tx);
            } else {
                transactionRepository.save(tx);
                log.warn("Transaction {} retry {} failed, will retry again", tx.getId(), tx.getRetryCount());
            }
        }
    }
}
