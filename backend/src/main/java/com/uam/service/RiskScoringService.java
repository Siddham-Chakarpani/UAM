package com.uam.service;

import com.uam.model.*;
import com.uam.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * Computes a composite risk score (0-100) for every user based on:
 * <ul>
 *   <li>Privilege level and role count            (0–30 pts)</li>
 *   <li>Account dormancy                          (0–25 pts)</li>
 *   <li>Failed login / lockout history            (0–20 pts)</li>
 *   <li>Existing SoD violations                   (0–15 pts)</li>
 *   <li>Audit violations / access-denied events   (0–10 pts)</li>
 * </ul>
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class RiskScoringService {

    private final UserRepository       userRepo;
    private final RiskScoreRepository  riskRepo;
    private final SodViolationRepository sodRepo;
    private final AuditLogRepository   auditRepo;

    private static final int DORMANT_DAYS      = 90;
    private static final int SEMI_DORMANT_DAYS = 45;

    // ── SoD conflict rule definitions ────────────────────────────────────────
    private record SodRule(
        String name, String entityA, String entityB,
        SodViolation.SodSeverity severity, String description) {}

    private static final List<SodRule> SOD_RULES = List.of(
        new SodRule("ADMIN_AUDITOR",
            "ADMIN", "AUDITOR",
            SodViolation.SodSeverity.CRITICAL,
            "Admin + Auditor: self-auditing risk — the admin can manipulate data and certify their own actions"),
        new SodRule("ADMIN_MANAGER",
            "ADMIN", "MANAGER",
            SodViolation.SodSeverity.HIGH,
            "Admin + Manager: excessive privilege accumulation — full system + user management"),
        new SodRule("MANAGER_AUDITOR",
            "MANAGER", "AUDITOR",
            SodViolation.SodSeverity.MEDIUM,
            "Manager + Auditor: can approve access and self-certify — approval conflict"),
        new SodRule("CREATE_DELETE_USER",
            "USER_CREATE", "USER_DELETE",
            SodViolation.SodSeverity.HIGH,
            "USER_CREATE + USER_DELETE: full user lifecycle control without any oversight separation"),
        new SodRule("EXPORT_DELETE_USER",
            "REPORT_EXPORT", "USER_DELETE",
            SodViolation.SodSeverity.HIGH,
            "REPORT_EXPORT + USER_DELETE: can delete a user and cover tracks by exporting/altering logs")
    );

    // ── Public API ────────────────────────────────────────────────────────────

    /** Recalculate and persist risk score for a single user. */
    public RiskScore scoreUser(User user) {
        int privScore   = computePrivilegeScore(user);
        int dormScore   = computeDormancyScore(user);
        int failScore   = computeFailedLoginScore(user);
        int sodScore    = computeSodScore(user);
        int violScore   = computeViolationScore(user);

        int total = Math.min(100, privScore + dormScore + failScore + sodScore + violScore);
        RiskScore.RiskLevel level = classify(total);
        List<String> factors = buildFactors(privScore, dormScore, failScore, sodScore, violScore);

        RiskScore rs = riskRepo.findByUser(user).orElse(new RiskScore());
        rs.setUser(user);
        rs.setScore(total);
        rs.setLevel(level);
        rs.setPrivilegedRoleScore(privScore);
        rs.setDormancyScore(dormScore);
        rs.setFailedLoginScore(failScore);
        rs.setSodConflictScore(sodScore);
        rs.setViolationScore(violScore);
        rs.setRiskFactors(String.join("; ", factors));
        return riskRepo.save(rs);
    }

    /** Recalculate risk scores for all users. */
    public List<RiskScore> scoreAllUsers() {
        List<RiskScore> results = new ArrayList<>();
        for (User u : userRepo.findAll()) {
            try { results.add(scoreUser(u)); }
            catch (Exception ex) { log.error("Risk scoring failed for user {}", u.getUsername(), ex); }
        }
        log.info("Risk scoring complete — {} users scored", results.size());
        return results;
    }

    /** Detect SoD violations for a specific user and persist new findings. */
    public List<SodViolation> detectSodViolations(User user) {
        Set<String> roles = new HashSet<>();
        Set<String> perms = new HashSet<>();
        for (Role r : user.getRoles()) {
            roles.add(r.getName());
            r.getPermissions().forEach(p -> perms.add(p.getName()));
        }

        List<SodViolation> found = new ArrayList<>();
        for (SodRule rule : SOD_RULES) {
            boolean matches = (roles.contains(rule.entityA()) && roles.contains(rule.entityB()))
                           || (perms.contains(rule.entityA()) && perms.contains(rule.entityB()));
            if (matches) {
                boolean alreadyOpen = sodRepo.existsByUserIdAndRuleNameAndStatus(
                    user.getId(), rule.name(), SodViolation.ViolationStatus.OPEN);
                if (!alreadyOpen) {
                    SodViolation v = new SodViolation();
                    v.setUser(user);
                    v.setRuleName(rule.name());
                    v.setConflictA(rule.entityA());
                    v.setConflictB(rule.entityB());
                    v.setSeverity(rule.severity());
                    v.setDescription(rule.description());
                    v.setStatus(SodViolation.ViolationStatus.OPEN);
                    found.add(sodRepo.save(v));
                }
            }
        }
        return found;
    }

    /** Run SoD detection across all users. */
    public int detectAllSodViolations() {
        int total = 0;
        for (User u : userRepo.findAll()) {
            total += detectSodViolations(u).size();
        }
        log.info("SoD scan complete — {} new violations detected", total);
        return total;
    }

    // ── Scoring components ───────────────────────────────────────────────────

    private int computePrivilegeScore(User user) {
        boolean isAdmin   = user.getRoles().stream().anyMatch(r -> "ADMIN".equals(r.getName()));
        boolean isManager = user.getRoles().stream().anyMatch(r -> "MANAGER".equals(r.getName()));
        int roleCount = user.getRoles().size();
        int score = 0;
        if (isAdmin)        score += 30;
        else if (isManager) score += 15;
        if (roleCount > 1)  score += Math.min(5 * (roleCount - 1), 10);
        return Math.min(score, 30);
    }

    private int computeDormancyScore(User user) {
        if (user.getLastLoginAt() == null) return 25;
        long daysSince = ChronoUnit.DAYS.between(user.getLastLoginAt(), LocalDateTime.now());
        if (daysSince >= DORMANT_DAYS)      return 25;
        if (daysSince >= SEMI_DORMANT_DAYS) return 15;
        if (daysSince >= 30)                return 8;
        return 0;
    }

    private int computeFailedLoginScore(User user) {
        int attempts = user.getFailedLoginAttempts();
        if (attempts >= 5) return 20;
        if (attempts >= 3) return 12;
        if (attempts >= 1) return 5;
        return 0;
    }

    private int computeSodScore(User user) {
        List<SodViolation> violations = sodRepo.findByUserId(user.getId());
        int score = 0;
        for (SodViolation v : violations) {
            if (v.getStatus() == SodViolation.ViolationStatus.OPEN) {
                score += switch (v.getSeverity()) {
                    case CRITICAL -> 15;
                    case HIGH     -> 10;
                    case MEDIUM   -> 6;
                    case LOW      -> 3;
                };
            }
        }
        return Math.min(score, 15);
    }

    private int computeViolationScore(User user) {
        LocalDateTime since = LocalDateTime.now().minusDays(30);
        List<AuditLog> recent = auditRepo.findByEventTypeInOrderByTimestampDesc(
            List.of("ACCESS_DENIED", "SUSPICIOUS_ACTIVITY"), Pageable.ofSize(200));
        long count = recent.stream()
            .filter(a -> user.getUsername().equals(a.getUsername()))
            .filter(a -> a.getTimestamp() != null && a.getTimestamp().isAfter(since))
            .count();
        if (count >= 5) return 10;
        if (count >= 2) return 5;
        if (count >= 1) return 2;
        return 0;
    }

    private RiskScore.RiskLevel classify(int score) {
        if (score >= 70) return RiskScore.RiskLevel.CRITICAL;
        if (score >= 45) return RiskScore.RiskLevel.HIGH;
        if (score >= 20) return RiskScore.RiskLevel.MEDIUM;
        return RiskScore.RiskLevel.LOW;
    }

    private List<String> buildFactors(int priv, int dorm, int fail, int sod, int viol) {
        List<String> f = new ArrayList<>();
        if (priv > 0) f.add("Privileged role (" + priv + " pts)");
        if (dorm > 0) f.add("Dormant account (" + dorm + " pts)");
        if (fail > 0) f.add("Failed logins (" + fail + " pts)");
        if (sod  > 0) f.add("SoD conflict (" + sod + " pts)");
        if (viol > 0) f.add("Access violations (" + viol + " pts)");
        return f;
    }
}
