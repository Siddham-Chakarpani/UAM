package com.uam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStats {
    private long totalUsers;
    private long activeUsers;
    private long inactiveUsers;
    private long suspendedUsers;
    private long lockedUsers;
    private long totalRoles;
    private long totalPermissions;
    private long failedLoginsLast24h;
    private long securityEventsLast24h;
    private long totalAuditLogs;
    private long auditLogsToday;
    private long criticalEventsLast24h;
}
