package com.uam.controller;

import com.uam.dto.SecurityEventSummary;
import com.uam.repository.AuditLogRepository;
import com.uam.service.AuditLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/security")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Security", description = "Security event analytics")
public class SecurityController {

    private final AuditLogService    auditService;
    private final AuditLogRepository auditRepo;

    // ── GET /api/security/events ─────────────────────────────────────────────
    @GetMapping("/events")
    @Operation(summary = "Security event summary for the last 24 hours")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<SecurityEventSummary> getSecurityEvents() {

        LocalDateTime since24h = LocalDateTime.now().minusHours(24);

        // ── Counts ───────────────────────────────────────────────────────────
        long failedLogins     = auditService.countFailedLoginsAfter(since24h);
        long totalEvents      = auditService.countEventsAfter(since24h);
        long criticalEvents   = auditService.countCriticalEventsAfter(since24h);

        // Access-denied + account-locked counts
        List<Object[]> byType = auditRepo.countByEventTypeAfter(since24h);

        Map<String, Long> eventsByType = byType.stream()
            .collect(Collectors.toMap(
                r -> (String) r[0],
                r -> (Long) r[1],
                Long::sum
            ));

        long accessDenied   = eventsByType.getOrDefault("ACCESS_DENIED", 0L);
        long accountLockout = eventsByType.getOrDefault("ACCOUNT_LOCKED", 0L);
        long suspicious     = eventsByType.getOrDefault("SUSPICIOUS_ACTIVITY", 0L);

        // ── Events by hour (24h) ─────────────────────────────────────────────
        Map<Integer, Long> byHour = new HashMap<>();
        for (int h = 0; h < 24; h++) byHour.put(h, 0L);

        auditService.getRecentActivity(1000).stream()
            .filter(l -> l.getTimestamp() != null && l.getTimestamp().isAfter(since24h))
            .forEach(l -> {
                int hr = l.getTimestamp().getHour();
                byHour.merge(hr, 1L, Long::sum);
            });

        // ── Top failed-login IPs ─────────────────────────────────────────────
        List<Object[]> rawIps = auditRepo.findTopFailedLoginIps(since24h, PageRequest.of(0, 10));
        List<SecurityEventSummary.IpCount> topIps = rawIps.stream()
            .map(r -> SecurityEventSummary.IpCount.builder()
                .ipAddress((String) r[0])
                .count((Long) r[1])
                .lastSeen((LocalDateTime) r[2])
                .build())
            .toList();

        // ── Recent critical / failure events ─────────────────────────────────
        List<SecurityEventSummary.RecentEvent> recentCritical =
            auditService.getSecurityFailures(20).stream()
                .map(l -> SecurityEventSummary.RecentEvent.builder()
                    .id(l.getId())
                    .eventType(l.getEventType())
                    .username(l.getUsername())
                    .ipAddress(l.getIpAddress())
                    .description(l.getDescription())
                    .status(l.getStatus() != null ? l.getStatus().name() : null)
                    .timestamp(l.getTimestamp())
                    .build())
                .toList();

        SecurityEventSummary summary = SecurityEventSummary.builder()
            .totalEvents(totalEvents)
            .failedLogins(failedLogins)
            .accessDenied(accessDenied)
            .accountLockouts(accountLockout)
            .suspiciousActivities(suspicious)
            .criticalEvents(criticalEvents)
            .eventsByType(eventsByType)
            .eventsByHour(byHour)
            .topFailedLoginIps(topIps)
            .recentCriticalEvents(recentCritical)
            .build();

        return ResponseEntity.ok(summary);
    }
}
