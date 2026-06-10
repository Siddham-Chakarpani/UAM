package com.uam.controller;

import com.uam.dto.DashboardStats;
import com.uam.model.AuditLog;
import com.uam.service.AuditLogService;
import com.uam.service.RoleService;
import com.uam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Dashboard", description = "Aggregate stats for the executive dashboard")
public class DashboardController {

    private final UserService     userService;
    private final RoleService     roleService;
    private final AuditLogService auditService;

    @GetMapping("/stats")
    @Operation(summary = "Retrieve all dashboard KPI metrics")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DashboardStats> getStats() {
        return ResponseEntity.ok(DashboardStats.builder()
            .totalUsers(userService.countTotal())
            .activeUsers(userService.countActive())
            .inactiveUsers(userService.countInactive())
            .suspendedUsers(userService.countSuspended())
            .lockedUsers(userService.countLocked())
            .totalRoles(roleService.countRoles())
            .totalPermissions(roleService.countPermissions())
            .failedLoginsLast24h(auditService.countFailedLoginsAfter(LocalDateTime.now().minusHours(24)))
            .securityEventsLast24h(auditService.countEventsAfter(LocalDateTime.now().minusHours(24)))
            .totalAuditLogs(auditService.countAll())
            .auditLogsToday(auditService.countToday())
            .criticalEventsLast24h(auditService.countCriticalEventsAfter(LocalDateTime.now().minusHours(24)))
            .build());
    }

    @GetMapping("/recent-activity")
    @Operation(summary = "Most recent audit events (default: 10)")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<AuditLog>> getRecentActivity(
            @RequestParam(defaultValue = "10") int limit) {
        return ResponseEntity.ok(auditService.getRecentActivity(Math.min(limit, 50)));
    }
}
