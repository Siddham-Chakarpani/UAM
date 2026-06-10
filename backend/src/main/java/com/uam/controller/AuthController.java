package com.uam.controller;

import com.uam.dto.LoginRequest;
import com.uam.dto.LoginResponse;
import com.uam.dto.UserDto;
import com.uam.model.AuditLog;
import com.uam.model.User;
import com.uam.service.AuditLogService;
import com.uam.service.JwtService;
import com.uam.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Login, logout and registration")
public class AuthController {

    private final AuthenticationManager authManager;
    private final JwtService            jwtService;
    private final UserService           userService;
    private final AuditLogService       auditLogService;

    // ── POST /api/auth/login ─────────────────────────────────────────────────
    @PostMapping("/login")
    @Operation(summary = "Authenticate and obtain JWT")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        try {
            Authentication auth = authManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.getUsername(), req.getPassword()));

            UserDetails ud    = (UserDetails) auth.getPrincipal();
            String      token = jwtService.generateToken(ud);

            userService.recordLogin(req.getUsername());
            User user = userService.findByUsername(req.getUsername());

            auditLogService.log("LOGIN", req.getUsername(),
                "User authenticated successfully", AuditLog.EventStatus.SUCCESS, "INFO");

            List<String> roles = ud.getAuthorities().stream()
                .filter(a -> a.getAuthority().startsWith("ROLE_"))
                .map(a -> a.getAuthority().replace("ROLE_", ""))
                .toList();

            List<String> perms = ud.getAuthorities().stream()
                .filter(a -> !a.getAuthority().startsWith("ROLE_"))
                .map(a -> a.getAuthority())
                .toList();

            LoginResponse resp = new LoginResponse(
                token, "Bearer",
                user.getUsername(), user.getFullName(), user.getEmail(),
                roles, perms,
                jwtService.getExpirationMs(), LocalDateTime.now());

            return ResponseEntity.ok(resp);

        } catch (BadCredentialsException ex) {
            userService.recordFailedLogin(req.getUsername());
            auditLogService.log("FAILED_LOGIN", req.getUsername(),
                "Bad credentials", AuditLog.EventStatus.FAILURE, "WARNING");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(err("Invalid username or password", "INVALID_CREDENTIALS"));

        } catch (LockedException ex) {
            auditLogService.log("FAILED_LOGIN", req.getUsername(),
                "Login attempt on locked account", AuditLog.EventStatus.FAILURE, "WARNING");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(err("Account is locked. Contact your administrator.", "ACCOUNT_LOCKED"));

        } catch (DisabledException ex) {
            auditLogService.log("FAILED_LOGIN", req.getUsername(),
                "Login attempt on inactive account", AuditLog.EventStatus.FAILURE, "WARNING");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(err("Account is disabled.", "ACCOUNT_INACTIVE"));
        }
    }

    // ── POST /api/auth/register ──────────────────────────────────────────────
    @PostMapping("/register")
    @Operation(summary = "Register a new user (Admin only)")
    public ResponseEntity<?> register(@Valid @RequestBody UserDto dto, Principal principal) {
        String actor = principal != null ? principal.getName() : "system";
        UserDto created = userService.createUser(dto, actor);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    // ── POST /api/auth/logout ────────────────────────────────────────────────
    @PostMapping("/logout")
    @Operation(summary = "Logout and record audit event")
    public ResponseEntity<?> logout(Principal principal) {
        if (principal != null) {
            auditLogService.log("LOGOUT", principal.getName(),
                "User logged out", AuditLog.EventStatus.SUCCESS);
        }
        Map<String, String> body = new HashMap<>();
        body.put("message", "Logged out successfully");
        return ResponseEntity.ok(body);
    }

    // ── GET /api/auth/me ─────────────────────────────────────────────────────
    @GetMapping("/me")
    @Operation(summary = "Current user profile")
    public ResponseEntity<?> me(Principal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(err("Not authenticated", "UNAUTHENTICATED"));
        }
        return ResponseEntity.ok(UserDto.fromUser(userService.findByUsername(principal.getName())));
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    private Map<String, String> err(String message, String code) {
        Map<String, String> m = new HashMap<>();
        m.put("error", message);
        m.put("code",  code);
        return m;
    }
}
