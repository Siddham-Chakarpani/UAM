-- =============================================================================
--  UAM — Useful Query Reference
--  Handy views and queries for audit reporting and access reviews.
-- =============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- VIEW: User profile with role names
-- ---------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_user_roles AS
SELECT
    u.id,
    u.username,
    u.email,
    u.first_name || ' ' || u.last_name   AS full_name,
    u.department,
    u.status,
    GROUP_CONCAT(r.role_name, ', ')       AS roles,
    u.last_login_at,
    u.created_at
FROM users u
LEFT JOIN user_roles     ur ON ur.user_id = u.id
LEFT JOIN roles          r  ON r.id       = ur.role_id
GROUP BY u.id;

-- ---------------------------------------------------------------------------
-- VIEW: Role with permission list
-- ---------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_role_permissions AS
SELECT
    r.id,
    r.role_name,
    r.description,
    GROUP_CONCAT(p.permission_name, ', ') AS permissions
FROM roles r
LEFT JOIN role_permissions rp ON rp.role_id       = r.id
LEFT JOIN permissions      p  ON p.id             = rp.permission_id
GROUP BY r.id;

-- ---------------------------------------------------------------------------
-- VIEW: Audit trail (enriched)
-- ---------------------------------------------------------------------------
CREATE VIEW IF NOT EXISTS v_audit_trail AS
SELECT
    al.id,
    al.timestamp,
    al.username,
    al.action,
    al.module,
    al.ip_address,
    al.status,
    al.severity,
    al.description,
    al.entity_type
FROM audit_logs al
ORDER BY al.timestamp DESC;

-- ---------------------------------------------------------------------------
-- Query 1: All users with their roles
-- ---------------------------------------------------------------------------
-- SELECT * FROM v_user_roles ORDER BY username;

-- ---------------------------------------------------------------------------
-- Query 2: Failed login attempts in the last 24 hours
-- ---------------------------------------------------------------------------
-- SELECT username, ip_address, COUNT(*) AS attempts, MAX(timestamp) AS last_attempt
-- FROM audit_logs
-- WHERE action = 'FAILED_LOGIN'
--   AND timestamp >= datetime('now', '-24 hours')
-- GROUP BY username, ip_address
-- ORDER BY attempts DESC;

-- ---------------------------------------------------------------------------
-- Query 3: Users with no recent login (inactive risk)
-- ---------------------------------------------------------------------------
-- SELECT username, email, status, last_login_at
-- FROM users
-- WHERE last_login_at < datetime('now', '-90 days')
--    OR last_login_at IS NULL
-- ORDER BY last_login_at ASC;

-- ---------------------------------------------------------------------------
-- Query 4: Audit log summary by event type (last 7 days)
-- ---------------------------------------------------------------------------
-- SELECT action, status, COUNT(*) AS count
-- FROM audit_logs
-- WHERE timestamp >= datetime('now', '-7 days')
-- GROUP BY action, status
-- ORDER BY count DESC;

-- ---------------------------------------------------------------------------
-- Query 5: Privilege escalation / access-denied events
-- ---------------------------------------------------------------------------
-- SELECT id, timestamp, username, ip_address, description
-- FROM audit_logs
-- WHERE action IN ('ACCESS_DENIED','SUSPICIOUS_ACTIVITY','PRIVILEGE_ESCALATION')
-- ORDER BY timestamp DESC;

-- ---------------------------------------------------------------------------
-- Query 6: Open (unresolved) security events
-- ---------------------------------------------------------------------------
-- SELECT id, event_type, severity, source_ip, username, description, created_at
-- FROM security_events
-- WHERE resolved = 0
-- ORDER BY severity DESC, created_at ASC;

-- ---------------------------------------------------------------------------
-- Query 7: Dashboard KPI counts
-- ---------------------------------------------------------------------------
-- SELECT
--     (SELECT COUNT(*) FROM users)                          AS total_users,
--     (SELECT COUNT(*) FROM users WHERE status='ACTIVE')    AS active_users,
--     (SELECT COUNT(*) FROM users WHERE status='INACTIVE')  AS inactive_users,
--     (SELECT COUNT(*) FROM users WHERE status='SUSPENDED') AS suspended_users,
--     (SELECT COUNT(*) FROM users WHERE status='LOCKED')    AS locked_users,
--     (SELECT COUNT(*) FROM roles)                          AS total_roles,
--     (SELECT COUNT(*) FROM permissions)                    AS total_permissions,
--     (SELECT COUNT(*) FROM audit_logs
--      WHERE action='FAILED_LOGIN'
--        AND timestamp >= datetime('now','-24 hours'))       AS failed_logins_24h,
--     (SELECT COUNT(*) FROM security_events WHERE resolved=0) AS open_security_events;

-- ---------------------------------------------------------------------------
-- Query 8: Access review — permissions by user (for attestation)
-- ---------------------------------------------------------------------------
-- SELECT
--     u.username,
--     u.department,
--     r.role_name,
--     p.permission_name,
--     p.resource,
--     p.action
-- FROM users            u
-- JOIN user_roles        ur ON ur.user_id       = u.id
-- JOIN roles             r  ON r.id             = ur.role_id
-- JOIN role_permissions  rp ON rp.role_id       = r.id
-- JOIN permissions       p  ON p.id             = rp.permission_id
-- ORDER BY u.username, r.role_name, p.resource;
