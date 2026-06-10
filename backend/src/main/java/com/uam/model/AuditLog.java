package com.uam.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs", indexes = {
    @Index(name = "idx_audit_username",   columnList = "username"),
    @Index(name = "idx_audit_event_type", columnList = "eventType"),
    @Index(name = "idx_audit_timestamp",  columnList = "timestamp"),
    @Index(name = "idx_audit_status",     columnList = "status"),
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Event category — see EventType enum for valid values. */
    @Column(nullable = false, length = 50)
    private String eventType;

    /** Actor username (the authenticated user who performed the action). */
    @Column(length = 50)
    private String username;

    /** Remote IP address. */
    @Column(length = 50)
    private String ipAddress;

    /** Resource type affected (User, Role, Permission, System…). */
    @Column(length = 50)
    private String entityType;

    /** ID of the affected resource. */
    @Column(length = 50)
    private String entityId;

    /** Human-readable description of the action. */
    @Column(length = 1000)
    private String description;

    /** Serialised old state (JSON or plain string). */
    @Column(length = 2000)
    private String oldValue;

    /** Serialised new state. */
    @Column(length = 2000)
    private String newValue;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    @Builder.Default
    private EventStatus status = EventStatus.SUCCESS;

    /** Epoch timestamp — set explicitly for seeding, otherwise handled by @CreationTimestamp. */
    private LocalDateTime timestamp;

    /** HTTP session identifier (optional). */
    @Column(length = 100)
    private String sessionId;

    /** Browser / client user-agent (optional). */
    @Column(length = 300)
    private String userAgent;

    /** Severity: INFO | WARNING | ERROR | CRITICAL */
    @Column(length = 20)
    @Builder.Default
    private String severity = "INFO";

    // ───── Pre-persist: guarantee timestamp ─────────────────────────────────
    @PrePersist
    protected void prePersist() {
        if (timestamp == null) {
            timestamp = LocalDateTime.now();
        }
        if (severity == null) {
            severity = "INFO";
        }
    }

    // ───── Nested enums ─────────────────────────────────────────────────────

    public enum EventStatus {
        SUCCESS, FAILURE, WARNING
    }

    public enum EventType {
        // Auth
        LOGIN, LOGOUT, REGISTER, PASSWORD_CHANGED,
        FAILED_LOGIN, ACCOUNT_LOCKED,
        // User lifecycle
        USER_CREATED, USER_UPDATED, USER_DELETED, USER_SUSPENDED,
        // Role management
        ROLE_CREATED, ROLE_UPDATED, ROLE_DELETED,
        ROLE_ASSIGNED, ROLE_REMOVED,
        // Permissions
        PERMISSION_CHANGED,
        // Data
        DATA_EXPORTED,
        // Security
        ACCESS_DENIED, SUSPICIOUS_ACTIVITY
    }
}
