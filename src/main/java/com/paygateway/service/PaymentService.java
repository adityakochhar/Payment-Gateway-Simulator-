package com.paygateway.service;

import com.paygateway.exception.IdempotencyConflictException;
import com.paygateway.exception.TransactionNotFoundException;
import com.paygateway.model.Transaction;
import com.paygateway.model.TransactionStatus;
import com.paygateway.repository.TransactionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Random;

@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    // Demo only: the first attempt succeeds 70% of the time.
    // The other 30% stay in PROCESSING and RetryService picks them up.
    private static final int FIRST_ATTEMPT_SUCCESS_PERCENT = 70;

    private final TransactionRepository transactionRepository;
    private final IdempotencyCache idempotencyCache;
    private final WebhookService webhookService;
    private final Random random = new Random();

    public PaymentService(TransactionRepository transactionRepository,
                          IdempotencyCache idempotencyCache,
                          WebhookService webhookService) {
        this.transactionRepository = transactionRepository;
        this.idempotencyCache = idempotencyCache;
        this.webhookService = webhookService;
    }

    /**
     * Starts a payment. Safe to call many times with the same idempotency key:
     * the payment is created once, and every later call gets the same transaction back.
     *
     * Not @Transactional on purpose: every save() is its own small DB transaction,
     * so each state (INITIATED, PROCESSING, SUCCESS) is really stored, and we can
     * catch a duplicate-key error right here (see step 2).
     */
    public Transaction initiatePayment(String idempotencyKey, BigDecimal amount) {
        // Always keep 2 decimal places, same as the DB column (100 -> 100.00)
        BigDecimal cleanAmount = amount.setScale(2, RoundingMode.HALF_UP);

        // 1. Have we seen this key before? Then return that payment, don't charge again.
        Transaction existing = findByIdempotencyKey(idempotencyKey);
        if (existing != null) {
            checkSameAmount(existing, cleanAmount);
            return existing;
        }

        // 2. New key: save the payment as INITIATED.
        Transaction transaction = new Transaction(idempotencyKey, cleanAmount);
        try {
            transaction = transactionRepository.saveAndFlush(transaction);
        } catch (DataIntegrityViolationException e) {
            // Two requests with the same key arrived at the same moment and the
            // other one saved first (the key column is UNIQUE). Return its payment.
            log.info("Duplicate request for key {} - returning the payment that was saved first", idempotencyKey);
            Optional<Transaction> winner = transactionRepository.findByIdempotencyKey(idempotencyKey);
            if (winner.isEmpty()) {
                throw e;
            }
            checkSameAmount(winner.get(), cleanAmount);
            return winner.get();
        }
        idempotencyCache.save(idempotencyKey, transaction.getId());
        log.info("Transaction {} created in INITIATED state", transaction.getId());

        // 3. Process the payment.
        transaction = updateStatus(transaction, TransactionStatus.PROCESSING);

        boolean paymentSucceeded = random.nextInt(100) < FIRST_ATTEMPT_SUCCESS_PERCENT;
        if (paymentSucceeded) {
            transaction = updateStatus(transaction, TransactionStatus.SUCCESS);
            webhookService.notifyTerminalState(transaction);
        } else {
            log.warn("Payment {} failed on first attempt. RetryService will retry it.", transaction.getId());
        }

        return transaction;
    }

    public Transaction getTransaction(String transactionId) {
        Optional<Transaction> transaction = transactionRepository.findById(transactionId);
        if (transaction.isEmpty()) {
            throw new TransactionNotFoundException(transactionId);
        }
        return transaction.get();
    }

    public Map<String, Long> getStats() {
        Map<String, Long> stats = new LinkedHashMap<>();
        stats.put("total", transactionRepository.count());
        stats.put("initiated", transactionRepository.countByStatus(TransactionStatus.INITIATED));
        stats.put("processing", transactionRepository.countByStatus(TransactionStatus.PROCESSING));
        stats.put("success", transactionRepository.countByStatus(TransactionStatus.SUCCESS));
        stats.put("failed", transactionRepository.countByStatus(TransactionStatus.FAILED));
        return stats;
    }

    /**
     * Moves a payment to its next status and saves it.
     * Used by this class and by RetryService, so the state machine is checked everywhere.
     */
    public Transaction updateStatus(Transaction transaction, TransactionStatus nextStatus) {
        transaction.changeStatus(nextStatus);
        Transaction saved = transactionRepository.save(transaction);
        log.info("Transaction {} moved to {}", saved.getId(), saved.getStatus());
        return saved;
    }

    /** Looks in Redis first (fast), then MySQL (always correct). Returns null if not found. */
    private Transaction findByIdempotencyKey(String idempotencyKey) {
        String cachedId = idempotencyCache.findTransactionId(idempotencyKey);
        if (cachedId != null) {
            Optional<Transaction> cached = transactionRepository.findById(cachedId);
            if (cached.isPresent()) {
                log.info("Idempotency hit in Redis for key {}", idempotencyKey);
                return cached.get();
            }
        }

        Optional<Transaction> fromDatabase = transactionRepository.findByIdempotencyKey(idempotencyKey);
        if (fromDatabase.isPresent()) {
            log.info("Idempotency hit in MySQL for key {}", idempotencyKey);
            idempotencyCache.save(idempotencyKey, fromDatabase.get().getId());
            return fromDatabase.get();
        }

        return null;
    }

    /** Same key + different amount is almost always a client bug, so we reject it. */
    private void checkSameAmount(Transaction existing, BigDecimal requestedAmount) {
        if (existing.getAmount().compareTo(requestedAmount) != 0) {
            throw new IdempotencyConflictException(existing.getIdempotencyKey());
        }
    }
}
