package com.uam.service;

import com.uam.model.AuditLog;
import com.uam.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AuditLogService {

    private final AuditLogRepository repo;

    // ── Convenience overloads ────────────────────────────────────────────────

    public AuditLog log(String eventType, String username, String description,
                        AuditLog.EventStatus status) {
        return persist(eventType, username, description, null, null, null, null,
                       status, "INFO", resolveIp());
    }

    public AuditLog log(String eventType, String username, String description,
                        AuditLog.EventStatus status, String severity) {
        return persist(eventType, username, description, null, null, null, null,
                       status, severity, resolveIp());
    }

    public AuditLog log(String eventType, String username, String description,
                        String entityType, String entityId,
                        String oldValue, String newValue,
                        AuditLog.EventStatus status) {
        return persist(eventType, username, description, entityType, entityId,
                       oldValue, newValue, status, "INFO", resolveIp());
    }

    /** Full-parameter core method — also called from AuditAspect. */
    public AuditLog log(String eventType, String username, String description,
                        String entityType, String entityId,
                        String oldValue, String newValue,
                        AuditLog.EventStatus status, String severity, String ipAddress) {
        return persist(eventType, username, description, entityType, entityId,
                       oldValue, newValue, status, severity, ipAddress);
    }

    // ── Internal persister ───────────────────────────────────────────────────

    private AuditLog persist(String eventType, String username, String description,
                             String entityType, String entityId,
                             String oldValue, String newValue,
                             AuditLog.EventStatus status, String severity, String ipAddress) {
        AuditLog entry = new AuditLog();
        entry.setEventType(eventType);
        entry.setUsername(username);
        entry.setDescription(description);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setOldValue(oldValue);
        entry.setNewValue(newValue);
        entry.setStatus(status);
        entry.setSeverity(severity != null ? severity : "INFO");
        entry.setIpAddress(ipAddress);
        entry.setTimestamp(LocalDateTime.now());

        AuditLog saved = repo.save(entry);
        log.debug("[AUDIT] {} | {} | {} | {}", eventType, username, status, description);
        return saved;
    }

    // ── Queries ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<AuditLog> findWithFilters(String username, String eventType, String status,
                                          LocalDateTime startDate, LocalDateTime endDate,
                                          Pageable pageable) {
        return repo.findWithFilters(username, eventType, status, startDate, endDate, pageable);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> findAllWithFilters(String username, String eventType, String status,
                                             LocalDateTime startDate, LocalDateTime endDate) {
        return repo.findAllWithFilters(username, eventType, status, startDate, endDate);
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentActivity(int limit) {
        return repo.findTopByOrderByTimestampDesc(Pageable.ofSize(limit));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getSecurityFailures(int limit) {
        return repo.findByStatusOrderByTimestampDesc(
            AuditLog.EventStatus.FAILURE, Pageable.ofSize(limit));
    }

    @Transactional(readOnly = true)
    public List<AuditLog> getRecentByEventTypes(List<String> eventTypes, int limit) {
        return repo.findByEventTypeInOrderByTimestampDesc(eventTypes, Pageable.ofSize(limit));
    }

    @Transactional(readOnly = true)
    public long countFailedLoginsAfter(LocalDateTime since) {
        return repo.countFailedLoginsAfter(since);
    }

    @Transactional(readOnly = true)
    public long countEventsAfter(LocalDateTime since) {
        return repo.countSecurityEventsAfter(since);
    }

    @Transactional(readOnly = true)
    public long countToday() {
        return repo.countSecurityEventsAfter(
            LocalDateTime.now().toLocalDate().atStartOfDay());
    }

    @Transactional(readOnly = true)
    public long countCriticalEventsAfter(LocalDateTime since) {
        return repo.countByEventTypeInAndTimestampAfter(
            List.of("FAILED_LOGIN", "ACCESS_DENIED", "ACCOUNT_LOCKED", "SUSPICIOUS_ACTIVITY"),
            since);
    }

    @Transactional(readOnly = true)
    public long countAll() {
        return repo.count();
    }

    // ── IP extraction ─────────────────────────────────────────────────────────

    private String resolveIp() {
        try {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String fwd = req.getHeader("X-Forwarded-For");
                if (fwd != null && !fwd.isBlank()) return fwd.split(",")[0].trim();
                return req.getRemoteAddr();
            }
        } catch (Exception ignored) {
        }
        return "unknown";
    }
}
