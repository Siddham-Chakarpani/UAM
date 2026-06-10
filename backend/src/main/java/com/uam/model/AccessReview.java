package com.uam.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a quarterly access certification campaign.
 * Each record is one user's certification status within a campaign.
 */
@Entity
@Table(name = "access_reviews",
    indexes = {
        @Index(name = "idx_ar_user",     columnList = "user_id"),
        @Index(name = "idx_ar_reviewer", columnList = "reviewer_id"),
        @Index(name = "idx_ar_status",   columnList = "status"),
        @Index(name = "idx_ar_quarter",  columnList = "campaignQuarter"),
    })
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccessReview {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The user whose access is being reviewed */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** Manager / reviewer assigned to certify this access */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id")
    private User reviewer;

    /** e.g. "2025-Q1", "2025-Q2" */
    @Column(nullable = false, length = 10)
    private String campaignQuarter;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ReviewStatus status;

    /** Snapshot of roles at the time of review */
    @Column(length = 500)
    private String rolesSnapshot;

    /** Certifier's comment */
    @Column(length = 500)
    private String comments;

    private LocalDateTime reviewedAt;
    private LocalDate     dueDate;
    private LocalDateTime createdAt;

    @PrePersist
    void prePersist() {
        createdAt = LocalDateTime.now();
        if (status == null) status = ReviewStatus.PENDING;
    }

    public enum ReviewStatus {
        PENDING, CERTIFIED, REVOKED, ESCALATED, EXPIRED
    }
}
