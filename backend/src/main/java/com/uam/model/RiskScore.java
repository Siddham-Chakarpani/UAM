package com.uam.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Stores the latest computed risk score for every user.
 * Recalculated on-demand by RiskScoringService.
 */
@Entity
@Table(name = "risk_scores")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RiskScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    /** 0 – 100 composite score */
    @Column(nullable = false)
    private int score;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RiskLevel level;

    // ── Contributing factors ────────────────────────────────────────────────
    private int privilegedRoleScore;     // admin / multiple roles
    private int dormancyScore;           // no login recently
    private int failedLoginScore;        // brute-force risk
    private int violationScore;          // past access violations
    private int sodConflictScore;        // segregation of duties

    @Column(length = 1000)
    private String riskFactors;          // JSON array of factor labels

    private LocalDateTime calculatedAt;

    @PrePersist
    @PreUpdate
    void stamp() {
        calculatedAt = LocalDateTime.now();
    }

    public enum RiskLevel {
        LOW, MEDIUM, HIGH, CRITICAL
    }
}
