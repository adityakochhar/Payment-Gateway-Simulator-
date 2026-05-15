package com.paygateway.repository;

import com.paygateway.model.Transaction;
import com.paygateway.model.TransactionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, String> {

    Optional<Transaction> findByIdempotencyKey(String idempotencyKey);

    List<Transaction> findByStatusAndRetryCountLessThan(TransactionStatus status, int maxRetries);

    long countByStatus(TransactionStatus status);
}
