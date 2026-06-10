package com.uam.dto;

import com.uam.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDto {

    // Response fields
    private Long id;
    private String username;
    private String email;
    private String firstName;
    private String lastName;
    private String department;
    private String phone;
    private String notes;
    private String status;
    private List<String> roles;
    private List<String> permissions;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime lastLoginAt;
    private int failedLoginAttempts;

    // Request-only fields (ignored on response)
    private String password;
    private List<Long> roleIds;

    // ── Static factory ──────────────────────────────────────────────────────
    public static UserDto fromUser(User user) {
        return UserDto.builder()
            .id(user.getId())
            .username(user.getUsername())
            .email(user.getEmail())
            .firstName(user.getFirstName())
            .lastName(user.getLastName())
            .department(user.getDepartment())
            .phone(user.getPhone())
            .notes(user.getNotes())
            .status(user.getStatus().name())
            .roles(user.getRoles().stream().map(r -> r.getName()).sorted().toList())
            .permissions(user.getRoles().stream()
                .flatMap(r -> r.getPermissions().stream())
                .map(p -> p.getName())
                .distinct().sorted().toList())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .lastLoginAt(user.getLastLoginAt())
            .failedLoginAttempts(user.getFailedLoginAttempts())
            .build();
    }
}
