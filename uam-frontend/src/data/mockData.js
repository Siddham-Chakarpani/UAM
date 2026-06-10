// Shared mock data used when backend is unavailable
export const MOCK_USERS = [
  { id: 1, username: "admin",         firstName: "System", lastName: "Administrator", email: "admin@uam.com",         department: "IT Security",   status: "ACTIVE",    roles: ["SUPER_ADMIN"],  lastLoginAt: new Date(Date.now()-3600000).toISOString(),  createdAt: "2024-01-15T08:00:00" },
  { id: 2, username: "john.doe",      firstName: "John",   lastName: "Doe",           email: "john.doe@uam.com",      department: "IT Operations", status: "ACTIVE",    roles: ["USER_MANAGER"], lastLoginAt: new Date(Date.now()-7200000).toISOString(),  createdAt: "2024-02-10T09:30:00" },
  { id: 3, username: "jane.smith",    firstName: "Jane",   lastName: "Smith",         email: "jane.smith@uam.com",    department: "Compliance",    status: "ACTIVE",    roles: ["AUDITOR"],      lastLoginAt: new Date(Date.now()-86400000).toISOString(), createdAt: "2024-02-18T10:00:00" },
  { id: 4, username: "bob.wilson",    firstName: "Bob",    lastName: "Wilson",        email: "bob.wilson@uam.com",    department: "Finance",       status: "ACTIVE",    roles: ["READ_ONLY"],    lastLoginAt: new Date(Date.now()-172800000).toISOString(),createdAt: "2024-03-05T14:00:00" },
  { id: 5, username: "charlie.brown", firstName: "Charlie",lastName: "Brown",         email: "charlie.brown@uam.com", department: "HR",            status: "INACTIVE",  roles: ["READ_ONLY"],    lastLoginAt: null, createdAt: "2024-03-20T11:00:00" },
  { id: 6, username: "diana.prince",  firstName: "Diana",  lastName: "Prince",        email: "diana.prince@uam.com",  department: "Legal",         status: "SUSPENDED", roles: ["READ_ONLY"],    lastLoginAt: null, createdAt: "2024-04-01T09:00:00" },
  { id: 7, username: "ethan.hunt",    firstName: "Ethan",  lastName: "Hunt",          email: "ethan.hunt@uam.com",    department: "Operations",    status: "ACTIVE",    roles: ["USER_MANAGER"], lastLoginAt: new Date(Date.now()-1800000).toISOString(),  createdAt: "2024-04-15T13:00:00" },
  { id: 8, username: "fiona.green",   firstName: "Fiona",  lastName: "Green",         email: "fiona.green@uam.com",   department: "Risk",          status: "ACTIVE",    roles: ["AUDITOR"],      lastLoginAt: new Date(Date.now()-43200000).toISOString(), createdAt: "2024-05-01T08:30:00" },
];

export const MOCK_ROLES = [
  { id: 1, name: "SUPER_ADMIN",  description: "Full system access — all permissions",   active: true, createdAt: "2024-01-15", permissions: [{ name: "USER_READ" },{ name: "USER_CREATE" },{ name: "USER_UPDATE" },{ name: "USER_DELETE" },{ name: "ROLE_READ" },{ name: "ROLE_CREATE" },{ name: "ROLE_UPDATE" },{ name: "ROLE_DELETE" },{ name: "AUDIT_READ" },{ name: "REPORT_VIEW" },{ name: "REPORT_EXPORT" },{ name: "PERMISSION_MANAGE" }] },
  { id: 2, name: "USER_MANAGER", description: "Create & manage users and role assignments", active: true, createdAt: "2024-01-15", permissions: [{ name: "USER_READ" },{ name: "USER_CREATE" },{ name: "USER_UPDATE" },{ name: "ROLE_READ" },{ name: "ROLE_CREATE" },{ name: "ROLE_UPDATE" },{ name: "AUDIT_READ" },{ name: "REPORT_VIEW" }] },
  { id: 3, name: "AUDITOR",      description: "Read audit logs and generate reports",       active: true, createdAt: "2024-01-20", permissions: [{ name: "AUDIT_READ" },{ name: "REPORT_VIEW" },{ name: "REPORT_EXPORT" }] },
  { id: 4, name: "READ_ONLY",    description: "View-only access across the platform",       active: true, createdAt: "2024-02-01", permissions: [{ name: "USER_READ" },{ name: "ROLE_READ" },{ name: "AUDIT_READ" }] },
];

export const MOCK_PERMISSIONS = [
  { id: 1,  name: "USER_READ",        resource: "users",       action: "read",   description: "View user accounts" },
  { id: 2,  name: "USER_CREATE",      resource: "users",       action: "create", description: "Create user accounts" },
  { id: 3,  name: "USER_UPDATE",      resource: "users",       action: "update", description: "Modify user accounts" },
  { id: 4,  name: "USER_DELETE",      resource: "users",       action: "delete", description: "Delete user accounts" },
  { id: 5,  name: "ROLE_READ",        resource: "roles",       action: "read",   description: "View roles" },
  { id: 6,  name: "ROLE_CREATE",      resource: "roles",       action: "create", description: "Create roles" },
  { id: 7,  name: "ROLE_UPDATE",      resource: "roles",       action: "update", description: "Modify roles" },
  { id: 8,  name: "ROLE_DELETE",      resource: "roles",       action: "delete", description: "Delete roles" },
  { id: 9,  name: "AUDIT_READ",       resource: "audit",       action: "read",   description: "View audit logs" },
  { id: 10, name: "REPORT_VIEW",      resource: "reports",     action: "read",   description: "View security reports" },
  { id: 11, name: "REPORT_EXPORT",    resource: "reports",     action: "export", description: "Export reports" },
  { id: 12, name: "PERMISSION_MANAGE",resource: "permissions", action: "manage", description: "Manage permissions" },
];

export const MOCK_AUDIT_LOGS = [
  { id: 1,  eventType: "LOGIN",             username: "admin",         ipAddress: "127.0.0.1",    description: "User logged in successfully",                          status: "SUCCESS", timestamp: new Date(Date.now()-3600000).toISOString()  },
  { id: 2,  eventType: "USER_CREATED",      username: "admin",         ipAddress: "127.0.0.1",    description: "Created user: john.doe",                               status: "SUCCESS", timestamp: new Date(Date.now()-7200000).toISOString()  },
  { id: 3,  eventType: "USER_CREATED",      username: "admin",         ipAddress: "127.0.0.1",    description: "Created user: jane.smith",                             status: "SUCCESS", timestamp: new Date(Date.now()-7800000).toISOString()  },
  { id: 4,  eventType: "ROLE_ASSIGNED",     username: "admin",         ipAddress: "127.0.0.1",    description: "Assigned role USER_MANAGER to john.doe",               status: "SUCCESS", timestamp: new Date(Date.now()-10800000).toISOString() },
  { id: 5,  eventType: "FAILED_LOGIN",      username: "unknown",       ipAddress: "192.168.1.50", description: "Failed login attempt for username: admin",             status: "FAILURE", timestamp: new Date(Date.now()-14400000).toISOString() },
  { id: 6,  eventType: "FAILED_LOGIN",      username: "unknown",       ipAddress: "10.0.0.15",    description: "Failed login attempt for username: admin",             status: "FAILURE", timestamp: new Date(Date.now()-15000000).toISOString() },
  { id: 7,  eventType: "LOGIN",             username: "john.doe",      ipAddress: "192.168.1.10", description: "User logged in successfully",                          status: "SUCCESS", timestamp: new Date(Date.now()-18000000).toISOString() },
  { id: 8,  eventType: "USER_UPDATED",      username: "john.doe",      ipAddress: "192.168.1.10", description: "Updated user: bob.wilson status",                     status: "SUCCESS", timestamp: new Date(Date.now()-21600000).toISOString() },
  { id: 9,  eventType: "PERMISSION_CHANGED",username: "admin",         ipAddress: "127.0.0.1",    description: "Updated permissions for role: USER_MANAGER",          status: "SUCCESS", timestamp: new Date(Date.now()-25200000).toISOString() },
  { id: 10, eventType: "FAILED_LOGIN",      username: "unknown",       ipAddress: "172.16.0.5",   description: "Failed login attempt for username: bob.wilson",        status: "FAILURE", timestamp: new Date(Date.now()-28800000).toISOString() },
  { id: 11, eventType: "LOGOUT",            username: "john.doe",      ipAddress: "192.168.1.10", description: "User logged out",                                      status: "SUCCESS", timestamp: new Date(Date.now()-32400000).toISOString() },
  { id: 12, eventType: "ROLE_CREATED",      username: "admin",         ipAddress: "127.0.0.1",    description: "Created role: AUDITOR",                                status: "SUCCESS", timestamp: new Date(Date.now()-36000000).toISOString() },
  { id: 13, eventType: "USER_SUSPENDED",    username: "admin",         ipAddress: "127.0.0.1",    description: "Suspended user: diana.prince",                        status: "WARNING", timestamp: new Date(Date.now()-39600000).toISOString() },
  { id: 14, eventType: "DATA_EXPORTED",     username: "jane.smith",    ipAddress: "192.168.1.20", description: "Exported audit logs as CSV",                          status: "SUCCESS", timestamp: new Date(Date.now()-43200000).toISOString() },
  { id: 15, eventType: "ACCOUNT_LOCKED",    username: "admin",         ipAddress: "127.0.0.1",    description: "Account locked: charlie.brown — multiple failed attempts", status: "WARNING", timestamp: new Date(Date.now()-46800000).toISOString() },
  { id: 16, eventType: "PASSWORD_CHANGED",  username: "admin",         ipAddress: "127.0.0.1",    description: "Password changed for user: john.doe",                 status: "SUCCESS", timestamp: new Date(Date.now()-50400000).toISOString() },
  { id: 17, eventType: "ACCESS_DENIED",     username: "bob.wilson",    ipAddress: "10.0.0.25",    description: "Access denied to /api/users — insufficient privileges",status: "FAILURE", timestamp: new Date(Date.now()-54000000).toISOString() },
  { id: 18, eventType: "LOGIN",             username: "jane.smith",    ipAddress: "192.168.1.20", description: "User logged in successfully",                          status: "SUCCESS", timestamp: new Date(Date.now()-57600000).toISOString() },
  { id: 19, eventType: "ROLE_UPDATED",      username: "admin",         ipAddress: "127.0.0.1",    description: "Updated role: READ_ONLY — added AUDIT_READ permission",status: "SUCCESS", timestamp: new Date(Date.now()-61200000).toISOString() },
  { id: 20, eventType: "USER_DELETED",      username: "admin",         ipAddress: "127.0.0.1",    description: "Deleted user: temp.user",                             status: "SUCCESS", timestamp: new Date(Date.now()-64800000).toISOString() },
];

export const MOCK_STATS = {
  totalUsers: 8,
  activeUsers: 6,
  inactiveUsers: 2,
  totalRoles: 4,
  totalPermissions: 12,
  failedLoginsLast24h: 3,
  securityEventsLast24h: 14,
  totalAuditLogs: 20,
  auditLogsToday: 6,
};
