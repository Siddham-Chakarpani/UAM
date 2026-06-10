package com.uam.service;

import com.uam.aspect.Auditable;
import com.uam.dto.UserDto;
import com.uam.model.AuditLog;
import com.uam.model.Role;
import com.uam.model.User;
import com.uam.repository.RoleRepository;
import com.uam.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class UserService implements UserDetailsService {

    private final UserRepository  userRepo;
    private final RoleRepository  roleRepo;
    private final PasswordEncoder passwordEncoder;
    private final AuditLogService auditLogService;

    // ── Spring Security ──────────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        for (Role r : user.getRoles()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + r.getName()));
            for (var p : r.getPermissions()) {
                authorities.add(new SimpleGrantedAuthority(p.getName()));
            }
        }

        return org.springframework.security.core.userdetails.User.builder()
            .username(user.getUsername())
            .password(user.getPassword())
            .authorities(authorities)
            .disabled(user.getStatus() == User.UserStatus.INACTIVE)
            .accountLocked(user.getStatus() == User.UserStatus.LOCKED)
            .build();
    }

    // ── Read ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('USER_READ')")
    public List<UserDto> getAllUsers() {
        return userRepo.findAll().stream().map(UserDto::fromUser).toList();
    }

    @Transactional(readOnly = true)
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('USER_READ')")
    public UserDto getUserById(Long id) {
        return UserDto.fromUser(findOrThrow(id));
    }

    // ── Create ───────────────────────────────────────────────────────────────

    @Auditable(eventType = "USER_CREATED", entityType = "User", severity = "INFO")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('USER_CREATE')")
    public UserDto createUser(UserDto dto, String actorUsername) {
        if (userRepo.existsByUsername(dto.getUsername()))
            throw new IllegalArgumentException("Username already taken: " + dto.getUsername());
        if (userRepo.existsByEmail(dto.getEmail()))
            throw new IllegalArgumentException("Email already registered: " + dto.getEmail());

        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        user.setFirstName(dto.getFirstName());
        user.setLastName(dto.getLastName());
        user.setDepartment(dto.getDepartment() != null ? dto.getDepartment() : "General");
        user.setPhone(dto.getPhone());
        user.setNotes(dto.getNotes());
        user.setStatus(User.UserStatus.ACTIVE);
        user.setRoles(new HashSet<>());
        assignRoles(user, dto.getRoleIds());

        User saved = userRepo.save(user);
        log.info("User created: {} by {}", saved.getUsername(), actorUsername);
        return UserDto.fromUser(saved);
    }

    // ── Update ───────────────────────────────────────────────────────────────

    @Auditable(eventType = "USER_UPDATED", entityType = "User", severity = "INFO")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('USER_UPDATE')")
    public UserDto updateUser(Long id, UserDto dto, String actorUsername) {
        User user = findOrThrow(id);

        if (dto.getEmail()      != null) user.setEmail(dto.getEmail());
        if (dto.getFirstName()  != null) user.setFirstName(dto.getFirstName());
        if (dto.getLastName()   != null) user.setLastName(dto.getLastName());
        if (dto.getDepartment() != null) user.setDepartment(dto.getDepartment());
        if (dto.getPhone()      != null) user.setPhone(dto.getPhone());
        if (dto.getNotes()      != null) user.setNotes(dto.getNotes());
        if (dto.getStatus()     != null) user.setStatus(User.UserStatus.valueOf(dto.getStatus()));
        if (dto.getPassword()   != null && !dto.getPassword().isBlank())
            user.setPassword(passwordEncoder.encode(dto.getPassword()));
        if (dto.getRoleIds()    != null) assignRoles(user, dto.getRoleIds());

        return UserDto.fromUser(userRepo.save(user));
    }

    // ── Delete ───────────────────────────────────────────────────────────────

    @Auditable(eventType = "USER_DELETED", entityType = "User", severity = "WARNING")
    @PreAuthorize("hasRole('ADMIN') or hasAuthority('USER_DELETE')")
    public void deleteUser(Long id, String actorUsername) {
        User user = findOrThrow(id);
        userRepo.deleteById(id);
        log.info("User deleted: {} by {}", user.getUsername(), actorUsername);
    }

    // ── Role assignment ───────────────────────────────────────────────────────

    @Auditable(eventType = "ROLE_ASSIGNED", entityType = "User", severity = "INFO")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('ROLE_UPDATE')")
    public UserDto assignRole(Long userId, Long roleId, String actor) {
        User user = findOrThrow(userId);
        Role role = roleRepo.findById(roleId)
            .orElseThrow(() -> new RuntimeException("Role not found: " + roleId));
        user.getRoles().add(role);
        return UserDto.fromUser(userRepo.save(user));
    }

    @Auditable(eventType = "ROLE_REMOVED", entityType = "User", severity = "INFO")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER') or hasAuthority('ROLE_UPDATE')")
    public UserDto removeRole(Long userId, Long roleId, String actor) {
        User user = findOrThrow(userId);
        user.getRoles().removeIf(r -> r.getId().equals(roleId));
        return UserDto.fromUser(userRepo.save(user));
    }

    // ── Auth helpers (no @PreAuthorize — called by AuthController) ────────────

    public void recordLogin(String username) {
        userRepo.findByUsername(username).ifPresent(u -> {
            u.setLastLoginAt(LocalDateTime.now());
            u.setFailedLoginAttempts(0);
            userRepo.save(u);
        });
    }

    public void recordFailedLogin(String username) {
        userRepo.findByUsername(username).ifPresent(u -> {
            u.setFailedLoginAttempts(u.getFailedLoginAttempts() + 1);
            if (u.getFailedLoginAttempts() >= 5) {
                u.setStatus(User.UserStatus.LOCKED);
                log.warn("Account auto-locked after 5 failed attempts: {}", username);
            }
            userRepo.save(u);
        });
    }

    // ── Stats ────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public long countTotal()     { return userRepo.count(); }

    @Transactional(readOnly = true)
    public long countActive()    { return userRepo.countByStatus(User.UserStatus.ACTIVE); }

    @Transactional(readOnly = true)
    public long countInactive()  { return userRepo.countByStatus(User.UserStatus.INACTIVE); }

    @Transactional(readOnly = true)
    public long countSuspended() { return userRepo.countByStatus(User.UserStatus.SUSPENDED); }

    @Transactional(readOnly = true)
    public long countLocked()    { return userRepo.countByStatus(User.UserStatus.LOCKED); }

    // ── Internal ─────────────────────────────────────────────────────────────

    public User findByUsername(String username) {
        return userRepo.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
    }

    private User findOrThrow(Long id) {
        return userRepo.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found: " + id));
    }

    private void assignRoles(User user, List<Long> roleIds) {
        if (roleIds == null || roleIds.isEmpty()) return;
        Set<Role> roles = new HashSet<>(roleRepo.findAllById(roleIds));
        user.setRoles(roles);
    }
}
