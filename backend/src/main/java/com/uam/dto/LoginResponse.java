package com.uam.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String tokenType;
    private String username;
    private String fullName;
    private String email;
    private List<String> roles;
    private List<String> permissions;
    private long expiresIn;
    private LocalDateTime issuedAt;
}
