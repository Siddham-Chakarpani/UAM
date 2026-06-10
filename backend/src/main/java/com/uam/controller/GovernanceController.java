package com.uam.controller;

import com.uam.model.AccessReview;
import com.uam.model.RiskScore;
import com.uam.model.SodViolation;
import com.uam.repository.SodViolationRepository;
import com.uam.repository.RiskScoreRepository;
import com.uam.service.GovernanceService;
import com.uam.service.RiskScoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/governance")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Governance", description = "Risk management, access reviews, SoD, compliance")
public class GovernanceController {

    private final GovernanceService      governance;
    private final RiskScoringService     riskEngine;
    private final SodViolationRepository sodRepo;
    private final RiskScoreRepository    riskRepo;

    // ── Governance Overview Dashboard ─────────────────────────────────────────

    @GetMapping("/dashboard")
    @Operation(summary = "Governance overview — risk alerts, pending reviews, SoD counts")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> dashboard() {
        return ResponseEntity.ok(governance.getGovernanceDashboard());
    }

    // ── Risk Scores ───────────────────────────────────────────────────────────

    @GetMapping("/risk-scores")
    @Operation(summary = "Risk scores for all users, sorted highest first")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<List<RiskScore>> allRiskScores() {
        return ResponseEntity.ok(riskEngine.scoreAllUsers());
    }

    @GetMapping("/risk-scores/high-risk")
    @Operation(summary = "Users classified as HIGH or CRITICAL risk")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<List<RiskScore>> highRisk() {
        List<RiskScore> scores = riskEngine.scoreAllUsers();
        return ResponseEntity.ok(scores.stream()
            .filter(r -> r.getLevel() == RiskScore.RiskLevel.HIGH
                      || r.getLevel() == RiskScore.RiskLevel.CRITICAL)
            .sorted((a, b) -> Integer.compare(b.getScore(), a.getScore()))
            .toList());
    }

    @PostMapping("/risk-scores/recalculate")
    @Operation(summary = "Trigger a full risk-score + SoD recalculation")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<Map<String, Object>> recalculate() {
        List<RiskScore> scores = riskEngine.scoreAllUsers();
        int newSod = riskEngine.detectAllSodViolations();
        return ResponseEntity.ok(Map.of(
            "usersScored",      scores.size(),
            "newSodViolations", newSod,
            "message",          "Risk recalculation complete"
        ));
    }

    // ── SoD Violations ────────────────────────────────────────────────────────

    @GetMapping("/sod-violations")
    @Operation(summary = "All SoD violations (runs detection first)")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<List<SodViolation>> sodViolations() {
        riskEngine.detectAllSodViolations();
        return ResponseEntity.ok(sodRepo.findAllByOrderByDetectedAtDesc());
    }

    @GetMapping("/sod-violations/open")
    @Operation(summary = "Open (unresolved) SoD violations")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<List<SodViolation>> openSodViolations() {
        riskEngine.detectAllSodViolations();
        return ResponseEntity.ok(sodRepo.findOpenViolations());
    }

    @PostMapping("/sod-violations/{id}/accept")
    @Operation(summary = "Accept a SoD exception with business justification")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> acceptViolation(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            Principal principal) {
        SodViolation v = sodRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("SoD violation not found: " + id));
        v.setStatus(SodViolation.ViolationStatus.ACCEPTED);
        v.setApprovedBy(principal.getName());
        v.setJustification(body.getOrDefault("justification", ""));
        sodRepo.save(v);
        return ResponseEntity.ok(Map.of(
            "id",      id,
            "status",  "ACCEPTED",
            "message", "SoD exception accepted by " + principal.getName()
        ));
    }

    // ── Dormant Accounts ──────────────────────────────────────────────────────

    @GetMapping("/dormant-accounts")
    @Operation(summary = "Active accounts with no login in 90+ days")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','AUDITOR') or hasAuthority('USER_READ')")
    public ResponseEntity<List<Map<String, Object>>> dormantAccounts() {
        return ResponseEntity.ok(governance.getDormantAccounts());
    }

    // ── Privileged Users ──────────────────────────────────────────────────────

    @GetMapping("/privileged-users")
    @Operation(summary = "Users with ADMIN or MANAGER roles, with risk scores")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<List<Map<String, Object>>> privilegedUsers() {
        return ResponseEntity.ok(governance.getPrivilegedUsers());
    }

    // ── Access Reviews ────────────────────────────────────────────────────────

    @GetMapping("/access-reviews/campaigns")
    @Operation(summary = "All distinct campaign quarters")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<String>> campaigns() {
        return ResponseEntity.ok(governance.getAllCampaigns());
    }

    @GetMapping("/access-reviews")
    @Operation(summary = "Access reviews, filtered by campaign quarter")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','AUDITOR') or hasAuthority('AUDIT_READ')")
    public ResponseEntity<List<AccessReview>> accessReviews(
            @RequestParam(required = false) String quarter) {
        List<String> campaigns = governance.getAllCampaigns();
        String target = (quarter != null && !quarter.isBlank())
            ? quarter
            : (campaigns.isEmpty() ? null : campaigns.get(0));
        if (target == null) return ResponseEntity.ok(List.of());
        return ResponseEntity.ok(governance.getReviewsByCampaign(target));
    }

    @PostMapping("/access-reviews/launch")
    @Operation(summary = "Launch a new quarterly review campaign for all active users")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<Map<String, Object>> launchCampaign(
            @RequestBody Map<String, String> body, Principal principal) {
        String quarter = body.get("quarter");
        if (quarter == null || quarter.isBlank())
            return ResponseEntity.badRequest()
                .body(Map.of("error", "quarter is required (e.g. 2025-Q3)"));
        List<AccessReview> reviews = governance.launchQuarterlyReview(quarter);
        return ResponseEntity.status(201).body(Map.of(
            "quarter",        quarter,
            "reviewsCreated", reviews.size(),
            "message",        "Campaign " + quarter + " launched by " + principal.getName()
        ));
    }

    @PostMapping("/access-reviews/{id}/certify")
    @Operation(summary = "Certify (approve) a user's access")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AccessReview> certify(@PathVariable Long id,
                                                 @RequestBody(required = false) Map<String, String> body,
                                                 Principal principal) {
        String comments = body != null ? body.getOrDefault("comments", "") : "";
        return ResponseEntity.ok(governance.certifyReview(id, principal.getName(), comments));
    }

    @PostMapping("/access-reviews/{id}/revoke")
    @Operation(summary = "Revoke a user's access (suspends the account)")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<AccessReview> revoke(@PathVariable Long id,
                                                @RequestBody(required = false) Map<String, String> body,
                                                Principal principal) {
        String comments = body != null ? body.getOrDefault("comments", "Revoked during access review") : "Revoked";
        return ResponseEntity.ok(governance.revokeReview(id, principal.getName(), comments));
    }

    // ── Compliance Dashboard ──────────────────────────────────────────────────

    @GetMapping("/compliance")
    @Operation(summary = "Full compliance dashboard — findings, KPIs, audit score")
    @PreAuthorize("hasAnyRole('ADMIN','AUDITOR') or hasAuthority('REPORT_VIEW')")
    public ResponseEntity<Map<String, Object>> compliance() {
        return ResponseEntity.ok(governance.getComplianceDashboard());
    }

    // ── Risk Alerts ───────────────────────────────────────────────────────────

    @GetMapping("/alerts")
    @Operation(summary = "Active risk alerts — CRITICAL/HIGH risk users, open SoD, dormant privileged")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Map<String, Object>>> alerts() {
        return ResponseEntity.ok(governance.getRiskAlerts());
    }
}
