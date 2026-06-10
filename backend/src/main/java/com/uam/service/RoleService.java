package com.uam.service;

import com.uam.aspect.Auditable;
import com.uam.model.Permission;
import com.uam.model.Role;
import com.uam.repository.PermissionRepository;
import com.uam.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class RoleService {

    private final RoleRepository       roleRepo;
    private final PermissionRepository permRepo;

    // ── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','AUDITOR') or hasAuthority('ROLE_READ')")
    public List<Role> getAllRoles() {
        return roleRepo.findAll();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','AUDITOR') or hasAuthority('ROLE_READ')")
    public Role getRoleById(Long id) {
        return roleRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Role not found: " + id));
    }

    // ── Create ───────────────────────────────────────────────────────────────

    @Auditable(eventType = "ROLE_CREATED", entityType = "Role", severity = "INFO")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_CREATE')")
    public Role createRole(String name, String description, List<Long> permissionIds, String actor) {
        if (name == null || name.isBlank())
            throw new IllegalArgumentException("Role name is required");
        String roleName = name.toUpperCase().replace(" ", "_");
        if (roleRepo.existsByName(roleName))
            throw new IllegalArgumentException("Role already exists: " + roleName);

        Role role = new Role();
        role.setName(roleName);
        role.setDescription(description);
        role.setActive(true);
        assignPermissions(role, permissionIds);

        Role saved = roleRepo.save(role);
        log.info("Role created: {} by {}", saved.getName(), actor);
        return saved;
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Auditable(eventType = "ROLE_UPDATED", entityType = "Role", severity = "INFO")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_UPDATE')")
    public Role updateRole(Long id, String name, String description,
                           List<Long> permissionIds, String actor) {
        Role role = roleRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Role not found: " + id));

        if (name        != null && !name.isBlank())
            role.setName(name.toUpperCase().replace(" ", "_"));
        if (description != null)
            role.setDescription(description);
        if (permissionIds != null)
            assignPermissions(role, permissionIds);

        return roleRepo.save(role);
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @Auditable(eventType = "ROLE_DELETED", entityType = "Role", severity = "WARNING")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('ROLE_DELETE')")
    public void deleteRole(Long id, String actor) {
        Role role = roleRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("Role not found: " + id));
        roleRepo.deleteById(id);
        log.info("Role deleted: {} by {}", role.getName(), actor);
    }

    // ── Permission management ─────────────────────────────────────────────────

    @Auditable(eventType = "PERMISSION_CHANGED", entityType = "Role", severity = "WARNING")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('PERMISSION_MANAGE')")
    public Role updatePermissions(Long roleId, List<Long> permissionIds, String actor) {
        Role role = roleRepo.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Role not found: " + roleId));
        assignPermissions(role, permissionIds);
        return roleRepo.save(role);
    }

    // ── Permissions (read) ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("isAuthenticated()")
    public List<Permission> getAllPermissions() {
        return permRepo.findAll();
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public long countRoles()       { return roleRepo.count(); }

    @Transactional(readOnly = true)
    public long countPermissions() { return permRepo.count(); }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private void assignPermissions(Role role, List<Long> permissionIds) {
        if (permissionIds == null) return;
        Set<Permission> perms = new HashSet<>(permRepo.findAllById(permissionIds));
        role.setPermissions(perms);
    }
}
