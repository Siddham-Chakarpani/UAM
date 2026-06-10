package com.uam.config;

import com.uam.model.AuditLog;
import com.uam.model.Permission;
import com.uam.model.Role;
import com.uam.model.User;
import com.uam.repository.AuditLogRepository;
import com.uam.repository.PermissionRepository;
import com.uam.repository.RoleRepository;
import com.uam.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashSet;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository       userRepo;
    private final RoleRepository       roleRepo;
    private final PermissionRepository permRepo;
    private final AuditLogRepository   auditRepo;
    private final PasswordEncoder      encoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepo.count() > 0) {
            log.info("Database already seeded — skipping DataInitializer.");
            return;
        }
        log.info("=== Seeding UAM database ===");

        // ── 1. Permissions — persist first, then reference them by ID ─────────
        Permission userRead   = save("USER_READ",         "users",       "read",   "View user accounts");
        Permission userCreate = save("USER_CREATE",       "users",       "create", "Create user accounts");
        Permission userUpdate = save("USER_UPDATE",       "users",       "update", "Modify user accounts");
        Permission userDelete = save("USER_DELETE",       "users",       "delete", "Delete user accounts");
        Permission roleRead   = save("ROLE_READ",         "roles",       "read",   "View roles");
        Permission roleCreate = save("ROLE_CREATE",       "roles",       "create", "Create roles");
        Permission roleUpdate = save("ROLE_UPDATE",       "roles",       "update", "Modify roles");
        Permission roleDelete = save("ROLE_DELETE",       "roles",       "delete", "Delete roles");
        Permission auditRead  = save("AUDIT_READ",        "audit",       "read",   "View audit logs");
        Permission reportView = save("REPORT_VIEW",       "reports",     "read",   "View security reports");
        Permission reportExp  = save("REPORT_EXPORT",     "reports",     "export", "Export reports as CSV/PDF");
        Permission permMgmt   = save("PERMISSION_MANAGE", "permissions", "manage", "Manage permission sets");

        // ── 2. Roles ──────────────────────────────────────────────────────────
        Role adminRole = saveRole("ADMIN", "Full system access — all permissions",
            userRead, userCreate, userUpdate, userDelete,
            roleRead, roleCreate, roleUpdate, roleDelete,
            auditRead, reportView, reportExp, permMgmt);

        Role managerRole = saveRole("MANAGER", "User and role management; audit read-only",
            userRead, userCreate, userUpdate,
            roleRead, roleCreate, roleUpdate,
            auditRead, reportView);

        Role auditorRole = saveRole("AUDITOR", "Read audit logs and export reports",
            auditRead, reportView, reportExp, userRead, roleRead);

        Role employeeRole = saveRole("EMPLOYEE", "Read-only access",
            userRead, roleRead);

        // ── 3. Users ──────────────────────────────────────────────────────────
        saveUser("admin",         "Admin@123", "System",  "Administrator",
                 "admin@uam.com",         "IT Security",   User.UserStatus.ACTIVE,    adminRole);
        saveUser("john.doe",      "User@123",  "John",    "Doe",
                 "john.doe@uam.com",      "IT Operations", User.UserStatus.ACTIVE,    managerRole);
        saveUser("jane.smith",    "User@123",  "Jane",    "Smith",
                 "jane.smith@uam.com",    "Compliance",    User.UserStatus.ACTIVE,    auditorRole);
        saveUser("bob.wilson",    "User@123",  "Bob",     "Wilson",
                 "bob.wilson@uam.com",    "Finance",       User.UserStatus.ACTIVE,    employeeRole);
        saveUser("charlie.brown", "User@123",  "Charlie", "Brown",
                 "charlie.brown@uam.com", "HR",            User.UserStatus.INACTIVE,  employeeRole);
        saveUser("diana.prince",  "User@123",  "Diana",   "Prince",
                 "diana.prince@uam.com",  "Legal",         User.UserStatus.SUSPENDED, employeeRole);
        saveUser("ethan.hunt",    "User@123",  "Ethan",   "Hunt",
                 "ethan.hunt@uam.com",    "Operations",    User.UserStatus.ACTIVE,    employeeRole);
        saveUser("fiona.green",   "User@123",  "Fiona",   "Green",
                 "fiona.green@uam.com",   "Risk",          User.UserStatus.ACTIVE,    auditorRole, managerRole);

        // ── 4. Audit Logs ─────────────────────────────────────────────────────
        seedAuditLogs();

        log.info("=== UAM seed complete — admin / Admin@123 ===");
    }

    // ─────────────────────────────────────────────────────────────────────────

    private Permission save(String name, String resource, String action, String desc) {
        Permission p = new Permission();
        p.setName(name);
        p.setResource(resource);
        p.setAction(action);
        p.setDescription(desc);
        return permRepo.saveAndFlush(p);
    }

    private Role saveRole(String name, String description, Permission... permissions) {
        Role r = new Role();
        r.setName(name);
        r.setDescription(description);
        r.setActive(true);
        r.setPermissions(new HashSet<>(Arrays.asList(permissions)));
        return roleRepo.saveAndFlush(r);
    }

    private void saveUser(String username, String rawPassword,
                          String firstName, String lastName,
                          String email, String department,
                          User.UserStatus status, Role... roles) {
        User u = new User();
        u.setUsername(username);
        u.setPassword(encoder.encode(rawPassword));
        u.setFirstName(firstName);
        u.setLastName(lastName);
        u.setEmail(email);
        u.setDepartment(department);
        u.setStatus(status);
        u.setRoles(new HashSet<>(Arrays.asList(roles)));
        u.setFailedLoginAttempts(0);
        if (status == User.UserStatus.ACTIVE) {
            u.setLastLoginAt(LocalDateTime.now()
                .minusMinutes((long) (Math.random() * 2880)));
        }
        userRepo.saveAndFlush(u);
    }

    private void seedAuditLogs() {
        AuditLog[] logs = {
            al("LOGIN",              "admin",       "127.0.0.1",    "Admin logged in successfully",                        AuditLog.EventStatus.SUCCESS, "INFO",    -1),
            al("USER_CREATED",       "admin",       "127.0.0.1",    "Created user: john.doe",                              AuditLog.EventStatus.SUCCESS, "INFO",    -2),
            al("USER_CREATED",       "admin",       "127.0.0.1",    "Created user: jane.smith",                            AuditLog.EventStatus.SUCCESS, "INFO",    -3),
            al("ROLE_ASSIGNED",      "admin",       "127.0.0.1",    "Assigned role MANAGER to john.doe",                   AuditLog.EventStatus.SUCCESS, "INFO",    -4),
            al("FAILED_LOGIN",       "unknown",     "192.168.1.50", "Failed login attempt for: admin",                     AuditLog.EventStatus.FAILURE, "WARNING", -5),
            al("FAILED_LOGIN",       "unknown",     "10.0.0.15",    "Failed login attempt for: admin",                     AuditLog.EventStatus.FAILURE, "WARNING", -6),
            al("LOGIN",              "john.doe",    "192.168.1.10", "Manager logged in successfully",                      AuditLog.EventStatus.SUCCESS, "INFO",    -7),
            al("USER_UPDATED",       "john.doe",    "192.168.1.10", "Updated user: bob.wilson — status changed to ACTIVE", AuditLog.EventStatus.SUCCESS, "INFO",    -8),
            al("LOGIN",              "jane.smith",  "192.168.1.20", "Auditor logged in successfully",                      AuditLog.EventStatus.SUCCESS, "INFO",    -9),
            al("ROLE_CREATED",       "admin",       "127.0.0.1",    "Created role: AUDITOR",                               AuditLog.EventStatus.SUCCESS, "INFO",   -10),
            al("PERMISSION_CHANGED", "admin",       "127.0.0.1",    "Updated permissions for role: MANAGER",               AuditLog.EventStatus.SUCCESS, "WARNING",-11),
            al("FAILED_LOGIN",       "unknown",     "172.16.0.5",   "Failed login attempt for: bob.wilson",                AuditLog.EventStatus.FAILURE, "WARNING",-12),
            al("LOGOUT",             "john.doe",    "192.168.1.10", "Manager logged out",                                  AuditLog.EventStatus.SUCCESS, "INFO",   -13),
            al("USER_CREATED",       "admin",       "127.0.0.1",    "Created user: charlie.brown",                         AuditLog.EventStatus.SUCCESS, "INFO",   -14),
            al("USER_SUSPENDED",     "admin",       "127.0.0.1",    "Suspended user: diana.prince",                        AuditLog.EventStatus.WARNING, "WARNING",-15),
            al("LOGIN",              "bob.wilson",  "10.0.0.25",    "Employee logged in",                                  AuditLog.EventStatus.SUCCESS, "INFO",   -20),
            al("DATA_EXPORTED",      "jane.smith",  "192.168.1.20", "Exported 148 audit log records as CSV",               AuditLog.EventStatus.SUCCESS, "INFO",   -25),
            al("PASSWORD_CHANGED",   "admin",       "127.0.0.1",    "Password changed for user: john.doe",                 AuditLog.EventStatus.SUCCESS, "INFO",   -30),
            al("ACCOUNT_LOCKED",     "admin",       "127.0.0.1",    "Account locked after 5 failed attempts",              AuditLog.EventStatus.WARNING, "WARNING",-35),
            al("ACCESS_DENIED",      "bob.wilson",  "10.0.0.25",    "Access denied: /api/roles — insufficient privileges",  AuditLog.EventStatus.FAILURE, "ERROR",  -40),
            al("ROLE_UPDATED",       "admin",       "127.0.0.1",    "Updated role MANAGER — added AUDIT_READ permission",  AuditLog.EventStatus.SUCCESS, "INFO",   -45),
            al("LOGIN",              "fiona.green", "192.168.1.55", "Dual-role user logged in",                            AuditLog.EventStatus.SUCCESS, "INFO",   -50),
            al("USER_DELETED",       "admin",       "127.0.0.1",    "Deleted temporary test account: test.user",           AuditLog.EventStatus.SUCCESS, "WARNING",-55),
            al("FAILED_LOGIN",       "unknown",     "203.0.113.42", "Repeated brute-force attempt detected",               AuditLog.EventStatus.FAILURE, "ERROR",  -60)
        };
        auditRepo.saveAll(Arrays.asList(logs));
    }

    private AuditLog al(String eventType, String username, String ip, String desc,
                        AuditLog.EventStatus status, String severity, int hoursOffset) {
        AuditLog a = new AuditLog();
        a.setEventType(eventType);
        a.setUsername(username);
        a.setIpAddress(ip);
        a.setDescription(desc);
        a.setStatus(status);
        a.setSeverity(severity);
        a.setEntityType("System");
        a.setTimestamp(LocalDateTime.now().plusHours(hoursOffset));
        return a;
    }
}
