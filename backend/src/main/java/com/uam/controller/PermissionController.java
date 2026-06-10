package com.uam.controller;

import com.uam.model.Permission;
import com.uam.service.RoleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/permissions")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Permissions", description = "Permission listing endpoint")
public class PermissionController {

    private final RoleService roleService;

    @GetMapping
    @Operation(summary = "List all system permissions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<List<Permission>> getAll() {
        return ResponseEntity.ok(roleService.getAllPermissions());
    }
}
