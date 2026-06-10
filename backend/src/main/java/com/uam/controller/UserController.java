package com.uam.controller;

import com.uam.dto.UserDto;
import com.uam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Users", description = "User CRUD and role assignment")
public class UserController {

    private final UserService userService;

    // ── GET /api/users ───────────────────────────────────────────────────────
    @GetMapping
    @Operation(summary = "List all users")
    public ResponseEntity<List<UserDto>> getAll() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // ── GET /api/users/{id} ──────────────────────────────────────────────────
    @GetMapping("/{id}")
    @Operation(summary = "Get a single user by ID")
    public ResponseEntity<UserDto> getById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // ── POST /api/users ──────────────────────────────────────────────────────
    @PostMapping
    @Operation(summary = "Create a new user")
    public ResponseEntity<UserDto> create(@Valid @RequestBody UserDto dto, Principal principal) {
        return ResponseEntity.status(201)
            .body(userService.createUser(dto, principal.getName()));
    }

    // ── PUT /api/users/{id} ──────────────────────────────────────────────────
    @PutMapping("/{id}")
    @Operation(summary = "Update an existing user")
    public ResponseEntity<UserDto> update(@PathVariable Long id,
                                          @RequestBody UserDto dto,
                                          Principal principal) {
        return ResponseEntity.ok(userService.updateUser(id, dto, principal.getName()));
    }

    // ── DELETE /api/users/{id} ───────────────────────────────────────────────
    @DeleteMapping("/{id}")
    @Operation(summary = "Delete a user")
    public ResponseEntity<?> delete(@PathVariable Long id, Principal principal) {
        userService.deleteUser(id, principal.getName());
        return ResponseEntity.ok(Map.of("message", "User deleted successfully", "id", id));
    }

    // ── POST /api/users/{id}/roles/{roleId} ──────────────────────────────────
    @PostMapping("/{userId}/roles/{roleId}")
    @Operation(summary = "Assign a role to a user")
    public ResponseEntity<UserDto> assignRole(@PathVariable Long userId,
                                              @PathVariable Long roleId,
                                              Principal principal) {
        return ResponseEntity.ok(userService.assignRole(userId, roleId, principal.getName()));
    }

    // ── DELETE /api/users/{id}/roles/{roleId} ────────────────────────────────
    @DeleteMapping("/{userId}/roles/{roleId}")
    @Operation(summary = "Remove a role from a user")
    public ResponseEntity<UserDto> removeRole(@PathVariable Long userId,
                                              @PathVariable Long roleId,
                                              Principal principal) {
        return ResponseEntity.ok(userService.removeRole(userId, roleId, principal.getName()));
    }
}
