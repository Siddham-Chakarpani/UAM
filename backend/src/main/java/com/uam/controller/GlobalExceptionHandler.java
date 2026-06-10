package com.uam.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // ── Validation (@Valid) ──────────────────────────────────────────────────
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
            .collect(Collectors.toMap(
                FieldError::getField,
                fe -> fe.getDefaultMessage() != null ? fe.getDefaultMessage() : "invalid",
                (a, b) -> a));
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError(400, "Validation failed", fieldErrors.toString()));
    }

    // ── Business rule violations ─────────────────────────────────────────────
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegal(IllegalArgumentException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError(400, ex.getMessage(), null));
    }

    // ── Entity not found / other RuntimeExceptions ────────────────────────────
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntime(RuntimeException ex) {
        String msg = ex.getMessage();
        if (msg != null && msg.contains("not found")) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(buildError(404, msg, null));
        }
        log.error("Unexpected RuntimeException", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(500, "Internal server error", null));
    }

    // ── Access denied ────────────────────────────────────────────────────────
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildError(403, "Access denied — insufficient privileges", null));
    }

    // ── Fallback ─────────────────────────────────────────────────────────────
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Unhandled exception", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(500, "An unexpected error occurred", null));
    }

    // ── Helper ───────────────────────────────────────────────────────────────
    private Map<String, Object> buildError(int status, String message, String detail) {
        Map<String, Object> body = new HashMap<>();
        body.put("status",    status);
        body.put("error",     message);
        body.put("timestamp", LocalDateTime.now().toString());
        if (detail != null) body.put("detail", detail);
        return body;
    }
}
