package com.uam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.List;

/** Returned by GET /api/security/events */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SecurityEventSummary {

    private long totalEvents;
    private long failedLogins;
    private long accessDenied;
    private long accountLockouts;
    private long suspiciousActivities;
    private long criticalEvents;

    /** Events grouped by type */
    private Map<String, Long> eventsByType;

    /** Events grouped by hour (0-23) for the last 24 h */
    private Map<Integer, Long> eventsByHour;

    /** Top attacking IPs */
    private List<IpCount> topFailedLoginIps;

    /** Most recent critical / failure events */
    private List<RecentEvent> recentCriticalEvents;

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class IpCount {
        private String ipAddress;
        private long count;
        private LocalDateTime lastSeen;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecentEvent {
        private Long id;
        private String eventType;
        private String username;
        private String ipAddress;
        private String description;
        private String status;
        private LocalDateTime timestamp;
    }
}
