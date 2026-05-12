package com.paygateway.service;

import com.paygateway.model.Transaction;
import com.paygateway.model.TransactionStatus;
import com.paygateway.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Optional;
import java.util.Random;
import java.util.UUID;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);
    private static final String REDIS_KEY_PREFIX = "idempotency:";

    private final TransactionRepository transactionRepository;
    private final RedisTemplate<String, String> redisTemplate;
    private final WebhookService webhookService;
    private final Random random = new Random();

    @Value("${app.idempotency.ttl:86400}")
    private long idempotencyTtlSeconds;

    public PaymentService(TransactionRepository transactionRepository,
                          RedisTemplate<String, String> redisTemplate,
                          WebhookService webhookService) {
        this.transactionRepository = transactionRepository;
        this.redisTemplate = redisTemplate;
        this.webhookService = webhookService;
    }

    /**
     * Initiates a payment. Returns existing result if idempotency key already seen.
     */
    @Transactional
    public Transaction initiatePayment(String idempotencyKey, BigDecimal amount) {
        String redisKey = REDIS_KEY_PREFIX + idempotencyKey;
        String cachedTransactionId = redisTemplate.opsForValue().get(redisKey);

        if (cachedTransactionId != null) {
            log.info("Idempotency hit for key {}. Returning cached transaction {}", idempotencyKey, cachedTransactionId);
            return transactionRepository.findById(cachedTransactionId)
                    .orElseThrow(() -> new RuntimeException("Cached transaction not found: " + cachedTransactionId));
        }

        // Also check DB in case Redis was evicted
        Optional<Transaction> existing = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (existing.isPresent()) {
            log.info("Idempotency hit from DB for key {}", idempotencyKey);
            cacheTransaction(redisKey, existing.get().getId());
            return existing.get();
        }

        // New payment — create in INITIATED state
        Transaction transaction = new Transaction();
        transaction.setId(UUID.randomUUID().toString());
        transaction.setIdempotencyKey(idempotencyKey);
        transaction.setAmount(amount);
        transaction.setStatus(TransactionStatus.INITIATED);
        transaction.setRetryCount(0);

        transaction = transactionRepository.save(transaction);
        log.info("Transaction {} created in INITIATED state", transaction.getId());

        // Move to PROCESSING
        transaction = advanceState(transaction, TransactionStatus.PROCESSING);

        // Simulate payment processing (70% success for demo)
        boolean paymentSuccess = random.nextInt(10) < 7;

        if (paymentSuccess) {
            transaction = advanceState(transaction, TransactionStatus.SUCCESS);
            cacheTransaction(redisKey, transaction.getId());
            webhookService.notifyTerminalState(transaction);
        } else {
            log.warn("Payment processing failed for {}. RetryService will pick it up.", transaction.getId());
        }

        return transaction;
    }

    public Transaction getTransaction(String transactionId) {
        return transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found: " + transactionId));
    }

    @Transactional
    public Transaction advanceState(Transaction transaction, TransactionStatus nextStatus) {
        if (!transaction.getStatus().canTransitionTo(nextStatus)) {
            throw new IllegalStateException(
                String.format("Invalid transition: %s -> %s for transaction %s",
                    transaction.getStatus(), nextStatus, transaction.getId())
            );
        }
        transaction.setStatus(nextStatus);
        Transaction saved = transactionRepository.save(transaction);
        log.info("Transaction {} moved to {}", saved.getId(), saved.getStatus());
        return saved;
    }

    private void cacheTransaction(String redisKey, String transactionId) {
        redisTemplate.opsForValue().set(redisKey, transactionId, Duration.ofSeconds(idempotencyTtlSeconds));
    }
}
