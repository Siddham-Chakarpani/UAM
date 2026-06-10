package com.uam.repository;

import com.uam.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    // ── Paginated filter ─────────────────────────────────────────────────────
    @Query("""
        SELECT a FROM AuditLog a WHERE
        (:username  IS NULL OR a.username  LIKE %:username%) AND
        (:eventType IS NULL OR a.eventType = :eventType) AND
        (:status    IS NULL OR CAST(a.status AS string) = :status) AND
        (:startDate IS NULL OR a.timestamp >= :startDate) AND
        (:endDate   IS NULL OR a.timestamp <= :endDate)
        ORDER BY a.timestamp DESC
        """)
    Page<AuditLog> findWithFilters(
        @Param("username")  String username,
        @Param("eventType") String eventType,
        @Param("status")    String status,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate")   LocalDateTime endDate,
        Pageable pageable);

    // ── Full list (for export) ───────────────────────────────────────────────
    @Query("""
        SELECT a FROM AuditLog a WHERE
        (:username  IS NULL OR a.username  LIKE %:username%) AND
        (:eventType IS NULL OR a.eventType = :eventType) AND
        (:status    IS NULL OR CAST(a.status AS string) = :status) AND
        (:startDate IS NULL OR a.timestamp >= :startDate) AND
        (:endDate   IS NULL OR a.timestamp <= :endDate)
        ORDER BY a.timestamp DESC
        """)
    List<AuditLog> findAllWithFilters(
        @Param("username")  String username,
        @Param("eventType") String eventType,
        @Param("status")    String status,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate")   LocalDateTime endDate);

    // ── Recent ───────────────────────────────────────────────────────────────
    List<AuditLog> findTopByOrderByTimestampDesc(Pageable pageable);

    List<AuditLog> findByStatusOrderByTimestampDesc(AuditLog.EventStatus status, Pageable pageable);

    List<AuditLog> findByEventTypeInOrderByTimestampDesc(List<String> eventTypes, Pageable pageable);

    // ── Counts ───────────────────────────────────────────────────────────────
    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.eventType = 'FAILED_LOGIN' AND a.timestamp >= :since")
    long countFailedLoginsAfter(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.timestamp >= :since")
    long countSecurityEventsAfter(@Param("since") LocalDateTime since);

    @Query("SELECT COUNT(a) FROM AuditLog a WHERE a.eventType IN :types AND a.timestamp >= :since")
    long countByEventTypeInAndTimestampAfter(@Param("types") List<String> types,
                                             @Param("since") LocalDateTime since);

    // ── IP aggregation ────────────────────────────────────────────────────────
    @Query("""
        SELECT a.ipAddress, COUNT(a), MAX(a.timestamp)
        FROM AuditLog a
        WHERE a.eventType = 'FAILED_LOGIN' AND a.timestamp >= :since
        GROUP BY a.ipAddress
        ORDER BY COUNT(a) DESC
        """)
    List<Object[]> findTopFailedLoginIps(@Param("since") LocalDateTime since, Pageable pageable);

    // ── Events by type ────────────────────────────────────────────────────────
    @Query("SELECT a.eventType, COUNT(a) FROM AuditLog a WHERE a.timestamp >= :since GROUP BY a.eventType")
    List<Object[]> countByEventTypeAfter(@Param("since") LocalDateTime since);
}
