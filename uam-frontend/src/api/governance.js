// Governance & Risk Management API client additions
import api from "./client";

export const governanceApi = {
  // ── Dashboard ──────────────────────────────────────────────────────────
  getDashboard:         () => api.get("/governance/dashboard"),
  getComplianceDashboard: () => api.get("/governance/compliance"),
  getRiskAlerts:        () => api.get("/governance/alerts"),

  // ── Risk Scores ────────────────────────────────────────────────────────
  getAllRiskScores:      () => api.get("/governance/risk-scores"),
  getHighRiskUsers:     () => api.get("/governance/risk-scores/high-risk"),
  recalculateRisk:      () => api.post("/governance/risk-scores/recalculate"),

  // ── SoD Violations ────────────────────────────────────────────────────
  getOpenSodViolations: () => api.get("/governance/sod-violations/open"),
  acceptViolation:      (id, data) => api.post(`/governance/sod-violations/${id}/accept`, data),

  // ── Dormant Accounts ──────────────────────────────────────────────────
  getDormantAccounts:   () => api.get("/governance/dormant-accounts"),

  // ── Privileged Users ──────────────────────────────────────────────────
  getPrivilegedUsers:   () => api.get("/governance/privileged-users"),

  // ── Access Reviews ────────────────────────────────────────────────────
  getAccessReviews:     (quarter) => api.get("/governance/access-reviews", { params: { quarter } }),
  getCampaigns:         () => api.get("/governance/access-reviews/campaigns"),
  launchCampaign:       (quarter) => api.post("/governance/access-reviews/launch", { quarter }),
  certifyReview:        (id, comments) => api.post(`/governance/access-reviews/${id}/certify`, { comments }),
  revokeReview:         (id, comments) => api.post(`/governance/access-reviews/${id}/revoke`, { comments }),
};
