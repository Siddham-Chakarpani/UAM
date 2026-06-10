package com.uam.controller;

import com.uam.model.Permission;
import com.uam.model.Role;
import com.uam.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Roles", description = "Role and permission management")
public class RoleController {

    private final RoleService roleService;

    // ── GET /api/roles ───────────────────────────────────────────────────────
    @GetMapping
    @Operation(summary = "List all roles")
    public ResponseEntity<List<Role>> getAll() {
        return ResponseEntity.ok(roleService.getAllRoles());
    }

    // ── GET /api/roles/{id} ──────────────────────────────────────────────────
    @GetMapping("/{id}")
    @Operation(summary = "Get a role by ID")
    public ResponseEntity<Role> getById(@PathVariable Long id) {
        return ResponseEntity.ok(roleService.getRoleById(id));
    }

    // ── POST /api/roles ──────────────────────────────────────────────────────
    @PostMapping
    @Operation(summary = "Create a new role")
    public ResponseEntity<Role> create(@RequestBody Map<String, Object> body, Principal principal) {
        String      name          = (String) body.get("name");
        String      description   = (String) body.getOrDefault("description", "");
        List<Long>  permissionIds = extractLongList(body, "permissionIds");
        Role saved = roleService.createRole(name, description, permissionIds, principal.getName());
        return ResponseEntity.status(201).body(saved);
    }

    // ── PUT /api/roles/{id} ──────────────────────────────────────────────────
    @PutMapping("/{id}")
    @Operation(summary = "Update an existing role")
    public ResponseEntity<Role> update(@PathVariable Long id,
                                       @RequestBody Map<String, Object> body,
                                       Principal principal) {
        String     name          = (String) body.get("name");
        String     description   = (String) body.get("description");
        List<Long> permissionIds = extractLongList(body, "permissionIds");
        return ResponseEntity.ok(roleService.updateRole(id, name, description, permissionIds, principal.getName()));
    }

    // ── DELETE /api/roles/{id} ───────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a role")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        roleService.deleteRole(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "Role deleted successfully", "id", id));
    }

    // ── PUT /api/roles/{id}/permissions ──────────────────────────────────────
    @PutMapping("/{id}/permissions")
    @Operation(summary = "Replace the full permission set of a role")
    public ResponseEntity<Role> updatePermissions(@PathVariable Long id,
                                                   @RequestBody Map<String, Object> body,
                                                   Principal principal) {
        List<Long> permissionIds = extractLongList(body, "permissionIds");
        return ResponseEntity.ok(roleService.updatePermissions(id, permissionIds, principal.getName()));
    }

    // ── GET /api/permissions ─────────────────────────────────────────────────
    @GetMapping("/permissions")
    @Operation(summary = "List all available permissions")
    public ResponseEntity<List<Permission>> getAllPermissions() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private List<Long> extractLongList(Map<String, Object> body, String key) {
        if (!body.containsKey(key)) return List.of();
        List<Integer> raw = (List<Integer>) body.get(key);
        return raw.stream().map(Long::valueOf).toList();
    }
}
