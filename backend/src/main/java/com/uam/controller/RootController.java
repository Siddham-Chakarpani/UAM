package com.uam.controller;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.view.RedirectView;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Root controller — provides a friendly landing page at http://localhost:8080/
 * instead of a blank 403 Forbidden from Spring Security.
 */
@RestController
public class RootController {

    /**
     * Browser GET / → redirect to Swagger UI (works for humans opening the URL).
     * Detected by the absence of "application/json" in Accept header.
     */
    @GetMapping(value = "/", produces = MediaType.TEXT_HTML_VALUE)
    public RedirectView rootHtml() {
        return new RedirectView("/swagger-ui.html");
    }

    /**
     * API client GET / → JSON info card.
     */
    @GetMapping(value = "/", produces = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> rootJson() {
        Map<String, Object> info = new LinkedHashMap<>();
        info.put("application",  "UAM — User Access Management & Audit Logging System");
        info.put("version",      "1.0.0");
        info.put("status",       "UP");
        info.put("serverTime",   LocalDateTime.now().toString());
        info.put("frontendUrl",  "http://localhost:5173");
        info.put("swaggerUi",    "http://localhost:8080/swagger-ui.html");
        info.put("apiDocs",      "http://localhost:8080/v3/api-docs");
        info.put("health",       "http://localhost:8080/actuator/health");
        info.put("loginEndpoint","POST http://localhost:8080/api/auth/login");
        Map<String, String> creds = new LinkedHashMap<>();
        creds.put("admin",    "Admin@123 (ADMIN role)");
        creds.put("john.doe", "User@123  (MANAGER role)");
        creds.put("jane.smith","User@123  (AUDITOR role)");
        creds.put("bob.wilson","User@123  (EMPLOYEE role)");
        info.put("demoCredentials", creds);
        return info;
    }

    /** Health check shortcut at /health (no auth required). */
    @GetMapping("/health")
    public Map<String, Object> health() {
        Map<String, Object> h = new LinkedHashMap<>();
        h.put("status",    "UP");
        h.put("timestamp", LocalDateTime.now().toString());
        return h;
    }
}
