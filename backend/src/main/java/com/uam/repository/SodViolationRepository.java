package com.uam.repository;

import com.uam.model.SodViolation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SodViolationRepository extends JpaRepository<SodViolation, Long> {
    List<SodViolation> findByUserId(Long userId);
    List<SodViolation> findByStatus(SodViolation.ViolationStatus status);
    List<SodViolation> findAllByOrderByDetectedAtDesc();

    @Query("SELECT s FROM SodViolation s WHERE s.status = 'OPEN' ORDER BY s.severity DESC, s.detectedAt DESC")
    List<SodViolation> findOpenViolations();

    boolean existsByUserIdAndRuleNameAndStatus(Long userId, String ruleName, SodViolation.ViolationStatus status);

    @Query("SELECT COUNT(s) FROM SodViolation s WHERE s.status = 'OPEN'")
    long countOpen();
}
