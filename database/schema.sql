-- =============================================================================
--  UAM — User Access Management & Audit Logging System
--  Database Schema (SQLite)
--  Run: sqlite3 uam.db < schema.sql
-- =============================================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Drop tables (safe re-run order — children first)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS security_events;
DROP TABLE IF EXISTS audit_logs;
DROP TABLE IF EXISTS role_permissions;
DROP TABLE IF EXISTS user_roles;
DROP TABLE IF EXISTS permissions;
DROP TABLE IF EXISTS roles;
DROP TABLE IF EXISTS users;

-- ---------------------------------------------------------------------------
-- users
-- ---------------------------------------------------------------------------
CREATE TABLE users (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    username       TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    email          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    password_hash  TEXT    NOT NULL,
    first_name     TEXT,
    last_name      TEXT,
    department     TEXT    DEFAULT 'General',
    phone          TEXT,
    status         TEXT    NOT NULL DEFAULT 'ACTIVE'
                           CHECK (status IN ('ACTIVE','INACTIVE','SUSPENDED','LOCKED')),
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    last_login_at  TEXT,   -- ISO-8601
    notes          TEXT,
    created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX idx_users_status   ON users(status);
CREATE INDEX idx_users_email    ON users(email);

-- Trigger: keep updated_at current
CREATE TRIGGER trg_users_updated_at
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    UPDATE users SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ','now')
    WHERE id = OLD.id;
END;

-- ---------------------------------------------------------------------------
-- roles
-- ---------------------------------------------------------------------------
CREATE TABLE roles (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    role_name   TEXT    NOT NULL UNIQUE COLLATE NOCASE,
    description TEXT,
    active      INTEGER NOT NULL DEFAULT 1,  -- 1 = true
    created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    updated_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

-- ---------------------------------------------------------------------------
-- permissions
-- ---------------------------------------------------------------------------
CREATE TABLE permissions (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    permission_name TEXT NOT NULL UNIQUE COLLATE NOCASE,
    resource        TEXT,   -- e.g. users | roles | audit | reports
    action          TEXT,   -- read | create | update | delete | manage | export
    description     TEXT
);

-- ---------------------------------------------------------------------------
-- user_roles  (join table)
-- ---------------------------------------------------------------------------
CREATE TABLE user_roles (
    user_id INTEGER NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
    role_id INTEGER NOT NULL REFERENCES roles(id)      ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE INDEX idx_user_roles_role ON user_roles(role_id);

-- ---------------------------------------------------------------------------
-- role_permissions  (join table)
-- ---------------------------------------------------------------------------
CREATE TABLE role_permissions (
    role_id       INTEGER NOT NULL REFERENCES roles(id)       ON DELETE CASCADE,
    permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE INDEX idx_role_permissions_perm ON role_permissions(permission_id);

-- ---------------------------------------------------------------------------
-- audit_logs
-- ---------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username    TEXT,                   -- denormalised for retention after user delete
    action      TEXT    NOT NULL,       -- LOGIN | USER_CREATED | …
    module      TEXT,                   -- users | roles | auth | system
    ip_address  TEXT,
    status      TEXT    NOT NULL DEFAULT 'SUCCESS'
                        CHECK (status IN ('SUCCESS','FAILURE','WARNING')),
    severity    TEXT    NOT NULL DEFAULT 'INFO'
                        CHECK (severity IN ('INFO','WARNING','ERROR','CRITICAL')),
    description TEXT,
    old_value   TEXT,
    new_value   TEXT,
    entity_type TEXT,
    entity_id   TEXT,
    session_id  TEXT,
    user_agent  TEXT,
    timestamp   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX idx_audit_username   ON audit_logs(username);
CREATE INDEX idx_audit_action     ON audit_logs(action);
CREATE INDEX idx_audit_timestamp  ON audit_logs(timestamp);
CREATE INDEX idx_audit_status     ON audit_logs(status);
CREATE INDEX idx_audit_user_id    ON audit_logs(user_id);

-- ---------------------------------------------------------------------------
-- security_events
-- ---------------------------------------------------------------------------
CREATE TABLE security_events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    event_type  TEXT NOT NULL,          -- BRUTE_FORCE | SUSPICIOUS_IP | …
    severity    TEXT NOT NULL DEFAULT 'INFO'
                     CHECK (severity IN ('INFO','WARNING','ERROR','CRITICAL')),
    source_ip   TEXT,
    username    TEXT,
    description TEXT,
    resolved    INTEGER NOT NULL DEFAULT 0,   -- 0 = open, 1 = resolved
    resolved_by TEXT,
    resolved_at TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX idx_sec_events_severity ON security_events(severity);
CREATE INDEX idx_sec_events_type     ON security_events(event_type);
CREATE INDEX idx_sec_events_created  ON security_events(created_at);

-- ===========================================================================
-- GOVERNANCE & RISK MANAGEMENT TABLES
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- risk_scores  (one row per user — updated on each scoring run)
-- ---------------------------------------------------------------------------
CREATE TABLE risk_scores (
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id               INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    score                 INTEGER NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 100),
    level                 TEXT    NOT NULL DEFAULT 'LOW'
                                  CHECK (level IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    privileged_role_score INTEGER NOT NULL DEFAULT 0,
    dormancy_score        INTEGER NOT NULL DEFAULT 0,
    failed_login_score    INTEGER NOT NULL DEFAULT 0,
    violation_score       INTEGER NOT NULL DEFAULT 0,
    sod_conflict_score    INTEGER NOT NULL DEFAULT 0,
    risk_factors          TEXT,   -- semicolon-separated factor descriptions
    calculated_at         TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now'))
);

CREATE INDEX idx_risk_level      ON risk_scores(level);
CREATE INDEX idx_risk_score_val  ON risk_scores(score DESC);

-- ---------------------------------------------------------------------------
-- access_reviews  (one row per user per campaign quarter)
-- ---------------------------------------------------------------------------
CREATE TABLE access_reviews (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reviewer_id      INTEGER          REFERENCES users(id) ON DELETE SET NULL,
    campaign_quarter TEXT    NOT NULL,       -- e.g. "2025-Q2"
    status           TEXT    NOT NULL DEFAULT 'PENDING'
                             CHECK (status IN ('PENDING','CERTIFIED','REVOKED','ESCALATED','EXPIRED')),
    roles_snapshot   TEXT,                   -- snapshot of roles at review time
    comments         TEXT,
    due_date         TEXT,                   -- ISO-8601 date
    reviewed_at      TEXT,
    created_at       TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    UNIQUE (user_id, campaign_quarter)
);

CREATE INDEX idx_ar_quarter  ON access_reviews(campaign_quarter);
CREATE INDEX idx_ar_status   ON access_reviews(status);
CREATE INDEX idx_ar_user     ON access_reviews(user_id);

-- ---------------------------------------------------------------------------
-- sod_violations  (one row per detected conflict per user)
-- ---------------------------------------------------------------------------
CREATE TABLE sod_violations (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rule_name     TEXT    NOT NULL,    -- e.g. "ADMIN_AUDITOR"
    conflict_a    TEXT    NOT NULL,    -- first role/permission
    conflict_b    TEXT    NOT NULL,    -- second role/permission
    severity      TEXT    NOT NULL DEFAULT 'MEDIUM'
                          CHECK (severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
    description   TEXT,
    status        TEXT    NOT NULL DEFAULT 'OPEN'
                          CHECK (status IN ('OPEN','ACCEPTED','MITIGATED','RESOLVED')),
    approved_by   TEXT,
    justification TEXT,
    detected_at   TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ','now')),
    resolved_at   TEXT
);

CREATE INDEX idx_sod_user   ON sod_violations(user_id);
CREATE INDEX idx_sod_status ON sod_violations(status);
CREATE INDEX idx_sod_sev    ON sod_violations(severity);
