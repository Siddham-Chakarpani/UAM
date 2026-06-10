package com.uam.service;

import com.uam.model.*;
import com.uam.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Handles the full governance lifecycle:
 * access reviews, dormant account detection, privileged-user monitoring,
 * user lifecycle management, and compliance reporting.
 */
@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class GovernanceService {

    private final UserRepository       userRepo;
    private final RoleRepository       roleRepo;
    private final AccessReviewRepository reviewRepo;
    private final SodViolationRepository sodRepo;
    private final RiskScoreRepository  riskRepo;
    private final AuditLogRepository   auditRepo;
    private final RiskScoringService   riskEngine;
    private final AuditLogService      auditService;

    private static final int DORMANT_THRESHOLD_DAYS = 90;
    private static final int ORPHAN_THRESHOLD_DAYS  = 180;

    // ── Quarterly Access Reviews ─────────────────────────────────────────────

    /** Initiate a new quarterly access-review campaign for all active users. */
    @PreAuthorize("hasRole('ADMIN') or hasRole('MANAGER')")
    public List<AccessReview> launchQuarterlyReview(String quarter) {
        List<AccessReview> created = new ArrayList<>();
        User defaultReviewer = userRepo.findByUsername("admin")
            .orElse(null);  // fallback — real workflow would look up managers

        for (User u : userRepo.findAll()) {
            if (reviewRepo.existsByUserIdAndCampaignQuarter(u.getId(), quarter)) continue;

            AccessReview review = new AccessReview();
            review.setUser(u);
            review.setReviewer(defaultReviewer);
            review.setCampaignQuarter(quarter);
            review.setStatus(AccessReview.ReviewStatus.PENDING);
            review.setDueDate(LocalDate.now().plusDays(30));
            review.setRolesSnapshot(
                u.getRoles().stream().map(Role::getName).collect(Collectors.joining(", ")));
            created.add(reviewRepo.save(review));
        }
        log.info("Launched access review campaign {} — {} reviews created", quarter, created.size());
        return created;
    }

    /** Certify (approve) a user's access in a review. */
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('ROLE_UPDATE')")
    public AccessReview certifyReview(Long reviewId, String reviewerUsername, String comments) {
        AccessReview review = reviewRepo.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Access review not found: " + reviewId));
        review.setStatus(AccessReview.ReviewStatus.CERTIFIED);
        review.setComments(comments);
        review.setReviewedAt(LocalDateTime.now());

        auditService.log("ACCESS_CERTIFIED", reviewerUsername,
            "Access certified for user: " + review.getUser().getUsername()
            + " in campaign " + review.getCampaignQuarter(),
            AuditLog.EventStatus.SUCCESS, "INFO");

        return reviewRepo.save(review);
    }

    /** Revoke a user's access during a review. */
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('USER_UPDATE')")
    public AccessReview revokeReview(Long reviewId, String reviewerUsername, String comments) {
        AccessReview review = reviewRepo.findById(reviewId)
            .orElseThrow(() -> new RuntimeException("Access review not found: " + reviewId));
        review.setStatus(AccessReview.ReviewStatus.REVOKED);
        review.setComments(comments);
        review.setReviewedAt(LocalDateTime.now());

        // Automatically suspend the user's account
        User user = review.getUser();
        user.setStatus(User.UserStatus.SUSPENDED);
        userRepo.save(user);

        auditService.log("ACCESS_REVOKED", reviewerUsername,
            "Access revoked for user: " + user.getUsername()
            + " in campaign " + review.getCampaignQuarter()
            + " — account suspended. Reason: " + comments,
            AuditLog.EventStatus.WARNING, "WARNING");

        return reviewRepo.save(review);
    }

    public List<AccessReview> getReviewsByCampaign(String quarter) {
        return reviewRepo.findByCampaignQuarterOrderByStatusAsc(quarter);
    }

    public List<String> getAllCampaigns() {
        return reviewRepo.findDistinctQuarters();
    }

    // ── Dormant Account Detection ─────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDormantAccounts() {
        LocalDateTime dormantSince = LocalDateTime.now().minusDays(DORMANT_THRESHOLD_DAYS);
        return userRepo.findAll().stream()
            .filter(u -> u.getStatus() == User.UserStatus.ACTIVE)
            .filter(u -> u.getLastLoginAt() == null || u.getLastLoginAt().isBefore(dormantSince))
            .map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",           u.getId());
                m.put("username",     u.getUsername());
                m.put("fullName",     u.getFullName());
                m.put("email",        u.getEmail());
                m.put("department",   u.getDepartment());
                m.put("lastLoginAt",  u.getLastLoginAt());
                m.put("daysDormant",  u.getLastLoginAt() == null ? -1
                    : ChronoUnit.DAYS.between(u.getLastLoginAt(), LocalDateTime.now()));
                m.put("roles", u.getRoles().stream().map(Role::getName).toList());
                m.put("riskLevel",
                    riskRepo.findByUserId(u.getId()).map(r -> r.getLevel().name()).orElse("UNKNOWN"));
                return m;
            })
            .sorted(Comparator.comparingLong(m -> {
                Object dl = m.get("daysDormant");
                return dl instanceof Long ? -(Long) dl : Long.MIN_VALUE;
            }))
            .toList();
    }

    // ── Privileged User Monitoring ────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPrivilegedUsers() {
        Set<String> privilegedRoles = Set.of("ADMIN", "MANAGER");
        return userRepo.findAll().stream()
            .filter(u -> u.getRoles().stream().anyMatch(r -> privilegedRoles.contains(r.getName())))
            .map(u -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("id",          u.getId());
                m.put("username",    u.getUsername());
                m.put("fullName",    u.getFullName());
                m.put("email",       u.getEmail());
                m.put("department",  u.getDepartment());
                m.put("status",      u.getStatus());
                m.put("roles",       u.getRoles().stream().map(Role::getName).toList());
                m.put("lastLoginAt", u.getLastLoginAt());
                m.put("isAdmin",     u.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName())));
                m.put("roleCount",   u.getRoles().size());
                m.put("riskScore",
                    riskRepo.findByUserId(u.getId()).map(r -> Map.of(
                        "score", r.getScore(), "level", r.getLevel().name()
                    )).orElse(Map.of("score", 0, "level", "UNKNOWN")));
                m.put("sodViolations",
                    sodRepo.findByUserId(u.getId()).stream()
                        .filter(v -> v.getStatus() == SodViolation.ViolationStatus.OPEN)
                        .count());
                return m;
            })
            .sorted(Comparator.comparingInt(m -> -((int)((Map<?, ?>)m.get("riskScore")).get("score"))))
            .toList();
    }

    // ── Compliance Dashboard ──────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Map<String, Object> getComplianceDashboard() {
        long totalUsers    = userRepo.count();
        long activeUsers   = userRepo.countByStatus(User.UserStatus.ACTIVE);
        long dormantCount  = getDormantAccounts().size();
        long privilegedCount = getPrivilegedUsers().size();
        long openSodCount  = sodRepo.countOpen();
        long openViolations = auditRepo.countByEventTypeInAndTimestampAfter(
            List.of("ACCESS_DENIED", "SUSPICIOUS_ACTIVITY"),
            LocalDateTime.now().minusDays(30));

        long criticalRisk = riskRepo.countByLevel(RiskScore.RiskLevel.CRITICAL);
        long highRisk     = riskRepo.countByLevel(RiskScore.RiskLevel.HIGH);
        long mediumRisk   = riskRepo.countByLevel(RiskScore.RiskLevel.MEDIUM);
        long lowRisk      = riskRepo.countByLevel(RiskScore.RiskLevel.LOW);

        // Certification completion rate for latest quarter
        List<String> quarters = reviewRepo.findDistinctQuarters();
        double certRate = 0;
        String latestQuarter = null;
        if (!quarters.isEmpty()) {
            latestQuarter = quarters.get(0);
            long total    = reviewRepo.findByCampaignQuarterOrderByStatusAsc(latestQuarter).size();
            long certified = reviewRepo.countByQuarterAndStatus(latestQuarter, AccessReview.ReviewStatus.CERTIFIED);
            certRate = total > 0 ? Math.round((certified * 100.0 / total) * 10) / 10.0 : 0;
        }

        // Overall compliance score (synthetic — industry-standard formula)
        double complianceScore = computeOverallComplianceScore(
            totalUsers, dormantCount, openSodCount, criticalRisk + highRisk,
            openViolations, certRate);

        Map<String, Object> dashboard = new LinkedHashMap<>();
        dashboard.put("overallComplianceScore", complianceScore);
        dashboard.put("complianceStatus",        complianceStatus(complianceScore));
        dashboard.put("totalUsers",              totalUsers);
        dashboard.put("activeUsers",             activeUsers);
        dashboard.put("dormantAccounts",         dormantCount);
        dashboard.put("privilegedUsers",         privilegedCount);
        dashboard.put("openSodViolations",       openSodCount);
        dashboard.put("recentAccessViolations",  openViolations);
        dashboard.put("riskDistribution", Map.of(
            "CRITICAL", criticalRisk, "HIGH", highRisk,
            "MEDIUM", mediumRisk, "LOW", lowRisk
        ));
        dashboard.put("certificationRate",       certRate);
        dashboard.put("latestCampaign",          latestQuarter);
        dashboard.put("auditFindings",           buildAuditFindings());
        return dashboard;
    }

    // ── Governance Dashboard (summary for the main governance page) ───────────

    @Transactional(readOnly = true)
    public Map<String, Object> getGovernanceDashboard() {
        Map<String, Object> dash = new LinkedHashMap<>();
        dash.put("highRiskUsers",     riskRepo.findHighRisk());
        dash.put("dormantAccounts",   getDormantAccounts().subList(0, Math.min(5, getDormantAccounts().size())));
        dash.put("openSodViolations", sodRepo.findOpenViolations());
        dash.put("pendingReviews",    reviewRepo.findByStatus(AccessReview.ReviewStatus.PENDING).size());
        dash.put("complianceSummary", getComplianceDashboard());
        return dash;
    }

    // ── Risk alert generation ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getRiskAlerts() {
        List<Map<String, Object>> alerts = new ArrayList<>();

        // CRITICAL risk users
        riskRepo.findHighRisk().stream()
            .filter(r -> r.getLevel() == RiskScore.RiskLevel.CRITICAL)
            .forEach(r -> alerts.add(alert("CRITICAL", "HIGH_RISK_USER",
                "User '" + r.getUser().getUsername() + "' has a critical risk score of " + r.getScore(),
                r.getRiskFactors())));

        // Open SoD violations
        sodRepo.findOpenViolations().stream()
            .filter(v -> v.getSeverity() == SodViolation.SodSeverity.CRITICAL
                      || v.getSeverity() == SodViolation.SodSeverity.HIGH)
            .forEach(v -> alerts.add(alert(v.getSeverity().name(), "SOD_VIOLATION",
                "SoD conflict '" + v.getRuleName() + "' detected for user: " + v.getUser().getUsername(),
                v.getDescription())));

        // Dormant accounts with high privilege
        getDormantAccounts().stream()
            .filter(d -> {
                Object daysDormant = d.get("daysDormant");
                return daysDormant instanceof Long l && l > DORMANT_THRESHOLD_DAYS;
            })
            .forEach(d -> alerts.add(alert("HIGH", "DORMANT_PRIVILEGED",
                "Dormant account detected: " + d.get("username") + " (" + d.get("daysDormant") + " days inactive)",
                "Active but long-dormant account with existing roles")));

        return alerts;
    }

    // ── Helper methods ────────────────────────────────────────────────────────

    private double computeOverallComplianceScore(long total, long dormant, long sodOpen,
                                                  long highRisk, long violations, double certRate) {
        double score = 100.0;
        if (total > 0) score -= (dormant   / (double) total) * 20;
        if (total > 0) score -= (highRisk  / (double) total) * 20;
        score -= Math.min(sodOpen    * 3, 20);
        score -= Math.min(violations * 2, 15);
        score += (certRate / 100.0) * 15;
        return Math.max(0, Math.min(100, Math.round(score * 10) / 10.0));
    }

    private String complianceStatus(double score) {
        if (score >= 85) return "COMPLIANT";
        if (score >= 65) return "PARTIAL";
        return "NON_COMPLIANT";
    }

    private List<Map<String, Object>> buildAuditFindings() {
        List<Map<String, Object>> findings = new ArrayList<>();
        findings.add(finding("DORMANT_ACCOUNTS", "Dormant Accounts Detected",
            getDormantAccounts().size() + " active accounts have not logged in for 90+ days",
            getDormantAccounts().isEmpty() ? "PASS" : "FAIL"));
        findings.add(finding("SOD_VIOLATIONS", "Segregation of Duties",
            sodRepo.countOpen() + " open SoD violations require remediation",
            sodRepo.countOpen() == 0 ? "PASS" : "FAIL"));
        findings.add(finding("HIGH_RISK_USERS", "High Risk User Accounts",
            (riskRepo.countByLevel(RiskScore.RiskLevel.CRITICAL) + riskRepo.countByLevel(RiskScore.RiskLevel.HIGH))
            + " users classified as HIGH or CRITICAL risk",
            riskRepo.countByLevel(RiskScore.RiskLevel.CRITICAL) == 0 ? "WARN" : "FAIL"));
        findings.add(finding("ACCESS_VIOLATIONS", "Recent Access Violations",
            auditRepo.countByEventTypeInAndTimestampAfter(
                List.of("ACCESS_DENIED"), LocalDateTime.now().minusDays(30))
            + " access-denied events in the last 30 days",
            "WARN"));
        return findings;
    }

    private Map<String, Object> finding(String id, String title, String detail, String result) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", id); m.put("title", title); m.put("detail", detail); m.put("result", result);
        return m;
    }

    private Map<String, Object> alert(String severity, String type, String message, String detail) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("severity", severity); m.put("type", type);
        m.put("message",  message);  m.put("detail", detail);
        m.put("timestamp", LocalDateTime.now().toString());
        return m;
    }
}
