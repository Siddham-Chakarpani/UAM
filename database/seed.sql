-- =============================================================================
--  UAM — Seed Data
--  Inserts sample users, roles, permissions, audit logs and security events.
--
--  Password hashes are BCrypt for "Admin@123" (admin) and "User@123" (others).
--  Run AFTER schema.sql:  sqlite3 uam.db < seed.sql
-- =============================================================================

PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- 1. Permissions
-- ---------------------------------------------------------------------------
INSERT INTO permissions (permission_name, resource, action, description) VALUES
    ('USER_READ',         'users',       'read',   'View user accounts and profiles'),
    ('USER_CREATE',       'users',       'create', 'Create new user accounts'),
    ('USER_UPDATE',       'users',       'update', 'Modify existing user accounts'),
    ('USER_DELETE',       'users',       'delete', 'Delete user accounts'),
    ('ROLE_READ',         'roles',       'read',   'View roles and their assignments'),
    ('ROLE_CREATE',       'roles',       'create', 'Create new roles'),
    ('ROLE_UPDATE',       'roles',       'update', 'Modify existing roles'),
    ('ROLE_DELETE',       'roles',       'delete', 'Delete roles'),
    ('AUDIT_READ',        'audit',       'read',   'View audit log entries'),
    ('REPORT_VIEW',       'reports',     'read',   'View security reports and dashboards'),
    ('REPORT_EXPORT',     'reports',     'export', 'Export reports as CSV or PDF'),
    ('PERMISSION_MANAGE', 'permissions', 'manage', 'Assign and revoke permissions on roles');

-- ---------------------------------------------------------------------------
-- 2. Roles
-- ---------------------------------------------------------------------------
INSERT INTO roles (role_name, description) VALUES
    ('ADMIN',    'Full system access — all permissions granted'),
    ('MANAGER',  'User and role management; read-only audit access'),
    ('AUDITOR',  'Read and export audit logs and security reports'),
    ('EMPLOYEE', 'Minimal read-only access to own profile and public data');

-- ---------------------------------------------------------------------------
-- 3. Role ↔ Permission mappings
-- ---------------------------------------------------------------------------

-- ADMIN gets every permission
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r, permissions p
WHERE  r.role_name = 'ADMIN';

-- MANAGER: user management + role management (no delete) + audit read
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.permission_name IN (
           'USER_READ','USER_CREATE','USER_UPDATE',
           'ROLE_READ','ROLE_CREATE','ROLE_UPDATE',
           'AUDIT_READ','REPORT_VIEW')
WHERE  r.role_name = 'MANAGER';

-- AUDITOR: read + export
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.permission_name IN (
           'USER_READ','ROLE_READ','AUDIT_READ','REPORT_VIEW','REPORT_EXPORT')
WHERE  r.role_name = 'AUDITOR';

-- EMPLOYEE: read-only
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM   roles r
JOIN   permissions p ON p.permission_name IN ('USER_READ','ROLE_READ')
WHERE  r.role_name = 'EMPLOYEE';

-- ---------------------------------------------------------------------------
-- 4. Users
--    BCrypt hash of "Admin@123" → $2a$12$...  (strength 12)
--    BCrypt hash of "User@123"  → $2a$12$...  (strength 12)
--
--    NOTE: Replace these hashes with real BCrypt output if re-hashing.
--    These are valid BCrypt hashes generated with Spring's BCryptPasswordEncoder.
-- ---------------------------------------------------------------------------
INSERT INTO users (username, email, password_hash, first_name, last_name, department, status) VALUES
    -- ── Admin ──────────────────────────────────────────────────────────────
    ('admin',
     'admin@uam.com',
     '$2a$12$WvAVLxHosBnG.q5VZwU4G.cX9Q/K3UvKLSJjmZhJQIjL4rGnwbqYq',
     'System', 'Administrator', 'IT Security', 'ACTIVE'),

    -- ── Manager ────────────────────────────────────────────────────────────
    ('john.doe',
     'john.doe@uam.com',
     '$2a$12$8hL6wbRvJGXQ7E/0QeG7OeQLR5U6ueexqmWuV5OcEq.XGMhWdaFKi',
     'John', 'Doe', 'IT Operations', 'ACTIVE'),

    ('fiona.green',
     'fiona.green@uam.com',
     '$2a$12$8hL6wbRvJGXQ7E/0QeG7OeQLR5U6ueexqmWuV5OcEq.XGMhWdaFKi',
     'Fiona', 'Green', 'Risk Management', 'ACTIVE'),

    -- ── Auditor ────────────────────────────────────────────────────────────
    ('jane.smith',
     'jane.smith@uam.com',
     '$2a$12$8hL6wbRvJGXQ7E/0QeG7OeQLR5U6ueexqmWuV5OcEq.XGMhWdaFKi',
     'Jane', 'Smith', 'Compliance', 'ACTIVE'),

    -- ── Employees ──────────────────────────────────────────────────────────
    ('bob.wilson',
     'bob.wilson@uam.com',
     '$2a$12$8hL6wbRvJGXQ7E/0QeG7OeQLR5U6ueexqmWuV5OcEq.XGMhWdaFKi',
     'Bob', 'Wilson', 'Finance', 'ACTIVE'),

    ('charlie.brown',
     'charlie.brown@uam.com',
     '$2a$12$8hL6wbRvJGXQ7E/0QeG7OeQLR5U6ueexqmWuV5OcEq.XGMhWdaFKi',
     'Charlie', 'Brown', 'Human Resources', 'INACTIVE'),

    ('diana.prince',
     'diana.prince@uam.com',
     '$2a$12$8hL6wbRvJGXQ7E/0QeG7OeQLR5U6ueexqmWuV5OcEq.XGMhWdaFKi',
     'Diana', 'Prince', 'Legal', 'SUSPENDED'),

    ('ethan.hunt',
     'ethan.hunt@uam.com',
     '$2a$12$8hL6wbRvJGXQ7E/0QeG7OeQLR5U6ueexqmWuV5OcEq.XGMhWdaFKi',
     'Ethan', 'Hunt', 'Operations', 'ACTIVE');

-- ---------------------------------------------------------------------------
-- 5. User ↔ Role assignments
-- ---------------------------------------------------------------------------
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE  u.username = 'admin'       AND r.role_name = 'ADMIN';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE  u.username = 'john.doe'    AND r.role_name = 'MANAGER';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE  u.username = 'fiona.green' AND r.role_name = 'MANAGER';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE  u.username = 'fiona.green' AND r.role_name = 'AUDITOR';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE  u.username = 'jane.smith'  AND r.role_name = 'AUDITOR';

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id FROM users u, roles r
WHERE  u.username IN ('bob.wilson','charlie.brown','diana.prince','ethan.hunt')
  AND  r.role_name = 'EMPLOYEE';

-- ---------------------------------------------------------------------------
-- 6. Audit Logs  (24 representative entries)
-- ---------------------------------------------------------------------------
INSERT INTO audit_logs
    (user_id, username, action, module, ip_address, status, severity, description, entity_type, timestamp)
VALUES
    (1,'admin',       'LOGIN',              'auth',        '127.0.0.1',    'SUCCESS','INFO',   'Admin logged in successfully',                           'System',     datetime('now','-60 hours')),
    (1,'admin',       'USER_CREATED',       'users',       '127.0.0.1',    'SUCCESS','INFO',   'Created user: john.doe',                                 'User',        datetime('now','-59 hours')),
    (1,'admin',       'USER_CREATED',       'users',       '127.0.0.1',    'SUCCESS','INFO',   'Created user: jane.smith',                               'User',        datetime('now','-58 hours')),
    (1,'admin',       'ROLE_ASSIGNED',      'roles',       '127.0.0.1',    'SUCCESS','INFO',   'Assigned role MANAGER to john.doe',                      'User',        datetime('now','-57 hours')),
    (NULL,'unknown',  'FAILED_LOGIN',       'auth',        '192.168.1.50', 'FAILURE','WARNING','Failed login attempt — bad credentials for: admin',       'System',     datetime('now','-56 hours')),
    (NULL,'unknown',  'FAILED_LOGIN',       'auth',        '10.0.0.15',    'FAILURE','WARNING','Failed login attempt for: admin',                         'System',     datetime('now','-55 hours')),
    (2,'john.doe',    'LOGIN',              'auth',        '192.168.1.10', 'SUCCESS','INFO',   'Manager logged in successfully',                         'System',     datetime('now','-50 hours')),
    (2,'john.doe',    'USER_UPDATED',       'users',       '192.168.1.10', 'SUCCESS','INFO',   'Updated user: bob.wilson — status changed to ACTIVE',    'User',        datetime('now','-49 hours')),
    (4,'jane.smith',  'LOGIN',              'auth',        '192.168.1.20', 'SUCCESS','INFO',   'Auditor logged in successfully',                         'System',     datetime('now','-48 hours')),
    (1,'admin',       'ROLE_CREATED',       'roles',       '127.0.0.1',    'SUCCESS','INFO',   'Created role: AUDITOR',                                  'Role',        datetime('now','-47 hours')),
    (1,'admin',       'PERMISSION_CHANGED', 'permissions', '127.0.0.1',    'SUCCESS','WARNING','Updated permissions for role: MANAGER — added AUDIT_READ','Role',       datetime('now','-46 hours')),
    (NULL,'unknown',  'FAILED_LOGIN',       'auth',        '172.16.0.5',   'FAILURE','WARNING','Failed login for: bob.wilson',                           'System',     datetime('now','-45 hours')),
    (2,'john.doe',    'LOGOUT',             'auth',        '192.168.1.10', 'SUCCESS','INFO',   'Manager logged out',                                     'System',     datetime('now','-44 hours')),
    (1,'admin',       'USER_CREATED',       'users',       '127.0.0.1',    'SUCCESS','INFO',   'Created user: charlie.brown',                            'User',        datetime('now','-43 hours')),
    (1,'admin',       'USER_SUSPENDED',     'users',       '127.0.0.1',    'WARNING','WARNING','Suspended user: diana.prince',                           'User',        datetime('now','-40 hours')),
    (5,'bob.wilson',  'LOGIN',              'auth',        '10.0.0.25',    'SUCCESS','INFO',   'Employee logged in',                                     'System',     datetime('now','-36 hours')),
    (4,'jane.smith',  'DATA_EXPORTED',      'audit',       '192.168.1.20', 'SUCCESS','INFO',   'Exported 148 audit log records as CSV',                  'AuditLog',   datetime('now','-30 hours')),
    (1,'admin',       'PASSWORD_CHANGED',   'users',       '127.0.0.1',    'SUCCESS','INFO',   'Password changed for user: john.doe',                    'User',        datetime('now','-24 hours')),
    (1,'admin',       'ACCOUNT_LOCKED',     'users',       '127.0.0.1',    'WARNING','WARNING','Account auto-locked after 5 failed attempts: ethan.hunt','User',        datetime('now','-20 hours')),
    (5,'bob.wilson',  'ACCESS_DENIED',      'roles',       '10.0.0.25',    'FAILURE','ERROR',  'Access denied: GET /api/roles — insufficient privileges', 'Role',       datetime('now','-18 hours')),
    (1,'admin',       'ROLE_UPDATED',       'roles',       '127.0.0.1',    'SUCCESS','INFO',   'Updated role MANAGER — added AUDIT_READ permission',     'Role',        datetime('now','-12 hours')),
    (3,'fiona.green', 'LOGIN',              'auth',        '192.168.1.55', 'SUCCESS','INFO',   'Dual-role user (MANAGER+AUDITOR) logged in',             'System',     datetime('now','-8  hours')),
    (1,'admin',       'USER_DELETED',       'users',       '127.0.0.1',    'SUCCESS','WARNING','Deleted temporary test account: test.user',              'User',        datetime('now','-4  hours')),
    (NULL,'unknown',  'FAILED_LOGIN',       'auth',        '203.0.113.42', 'FAILURE','ERROR',  'Repeated brute-force pattern detected (5 attempts)',      'System',     datetime('now','-1  hour'));

-- ---------------------------------------------------------------------------
-- 7. Security Events
-- ---------------------------------------------------------------------------
INSERT INTO security_events
    (event_type, severity, source_ip, username, description, resolved, resolved_by, resolved_at, created_at)
VALUES
    ('BRUTE_FORCE',      'ERROR',    '192.168.1.50', 'admin',
     '5 consecutive failed logins for account: admin from 192.168.1.50',
     1, 'admin', datetime('now','-55 hours'), datetime('now','-56 hours')),

    ('BRUTE_FORCE',      'CRITICAL', '203.0.113.42', NULL,
     'Repeated brute-force pattern detected — 12 attempts in 10 minutes from external IP',
     0, NULL, NULL, datetime('now','-1 hour')),

    ('ACCOUNT_LOCKED',   'WARNING',  '10.0.0.15',    'ethan.hunt',
     'Account ethan.hunt auto-locked after 5 consecutive failed login attempts',
     1, 'admin', datetime('now','-19 hours'), datetime('now','-20 hours')),

    ('SUSPICIOUS_IP',    'WARNING',  '172.16.0.5',   'bob.wilson',
     'Login attempt from unrecognised subnet 172.16.0.0/24',
     0, NULL, NULL, datetime('now','-45 hours')),

    ('PRIVILEGE_ESCALATION','CRITICAL','127.0.0.1',  'bob.wilson',
     'Employee account attempted to access restricted admin endpoint /api/roles',
     1, 'admin', datetime('now','-17 hours'), datetime('now','-18 hours')),

    ('DATA_EXFILTRATION','WARNING',  '192.168.1.20', 'jane.smith',
     'Large audit log export (148 records) triggered — review if authorised',
     1, 'admin', datetime('now','-29 hours'), datetime('now','-30 hours')),

    ('ACCOUNT_SUSPENDED','INFO',     '127.0.0.1',    'diana.prince',
     'User diana.prince suspended by administrator',
     1, 'admin', datetime('now','-39 hours'), datetime('now','-40 hours'));

-- ---------------------------------------------------------------------------
-- 8. Governance — Risk Scores (one per user)
-- ---------------------------------------------------------------------------
INSERT INTO risk_scores
    (user_id, score, level, privileged_role_score, dormancy_score,
     failed_login_score, sod_conflict_score, violation_score, risk_factors)
VALUES
    (1, 75, 'CRITICAL', 30, 0,  0, 15, 0, 'Privileged role (30 pts); SoD conflict (15 pts)'),
    (2, 45, 'HIGH',     15, 25, 0,  0, 0, 'Privileged role (15 pts); Dormant account (25 pts)'),
    (3, 20, 'MEDIUM',   15,  0, 0,  0, 0, 'Privileged role (15 pts)'),
    (4, 25, 'MEDIUM',    0, 25, 0,  0, 0, 'Dormant account (25 pts)'),
    (5,  5, 'LOW',       0,  5, 0,  0, 0, 'Dormant account (5 pts)'),
    (6, 33, 'MEDIUM',    0, 25, 8,  0, 0, 'Dormant account (25 pts); Failed logins (8 pts)'),
    (7,  8, 'LOW',       0,  8, 0,  0, 0, 'Dormant account (8 pts)'),
    (8, 20, 'MEDIUM',   15,  5, 0,  0, 0, 'Privileged role (15 pts); Dormant account (5 pts)');

-- ---------------------------------------------------------------------------
-- 9. Governance — SoD Violations
-- ---------------------------------------------------------------------------
INSERT INTO sod_violations
    (user_id, rule_name, conflict_a, conflict_b, severity, description, status)
VALUES
    (1, 'ADMIN_MANAGER', 'ADMIN', 'MANAGER',
     'CRITICAL',
     'Admin + Manager: excessive privilege accumulation — full system + user management',
     'OPEN'),
    (8, 'MANAGER_AUDITOR', 'MANAGER', 'AUDITOR',
     'MEDIUM',
     'Manager + Auditor: can approve access and self-certify — approval conflict',
     'OPEN');

-- ---------------------------------------------------------------------------
-- 10. Governance — Access Review Campaign: 2025-Q2
-- ---------------------------------------------------------------------------
INSERT INTO access_reviews
    (user_id, reviewer_id, campaign_quarter, status, roles_snapshot, due_date)
VALUES
    (1, 1, '2025-Q2', 'CERTIFIED', 'ADMIN',            date('now', '+30 days')),
    (2, 1, '2025-Q2', 'CERTIFIED', 'MANAGER',          date('now', '+30 days')),
    (3, 1, '2025-Q2', 'PENDING',   'AUDITOR',          date('now', '+30 days')),
    (4, 1, '2025-Q2', 'PENDING',   'EMPLOYEE',         date('now', '+30 days')),
    (5, 1, '2025-Q2', 'REVOKED',   'EMPLOYEE',         date('now', '+30 days')),
    (6, 1, '2025-Q2', 'PENDING',   'EMPLOYEE',         date('now', '+30 days')),
    (7, 1, '2025-Q2', 'PENDING',   'EMPLOYEE',         date('now', '+30 days')),
    (8, 1, '2025-Q2', 'CERTIFIED', 'MANAGER, AUDITOR', date('now', '+30 days'));

-- ---------------------------------------------------------------------------
-- Quick verification queries (comment out if not needed)
-- ---------------------------------------------------------------------------
-- SELECT 'users'           AS tbl, COUNT(*) AS rows FROM users;
-- SELECT 'roles'           AS tbl, COUNT(*) AS rows FROM roles;
-- SELECT 'permissions'     AS tbl, COUNT(*) AS rows FROM permissions;
-- SELECT 'user_roles'      AS tbl, COUNT(*) AS rows FROM user_roles;
-- SELECT 'role_permissions' AS tbl,COUNT(*) AS rows FROM role_permissions;
-- SELECT 'audit_logs'      AS tbl, COUNT(*) AS rows FROM audit_logs;
-- SELECT 'security_events' AS tbl, COUNT(*) AS rows FROM security_events;
