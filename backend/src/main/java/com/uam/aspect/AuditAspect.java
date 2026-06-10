package com.uam.aspect;

import com.uam.model.AuditLog;
import com.uam.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * AOP aspect that automatically records an audit log entry for every
 * service method annotated with {@link Auditable}.
 */
@Aspect
@Component
@RequiredArgsConstructor
@Slf4j
public class AuditAspect {

    private final AuditLogService auditLogService;

    @Pointcut("@annotation(auditable)")
    public void auditableMethod(Auditable auditable) {}

    @Around("auditableMethod(auditable)")
    public Object around(ProceedingJoinPoint pjp, Auditable auditable) throws Throwable {
        String actor = resolveActor();
        String ip    = resolveIp();
        Object result;

        try {
            result = pjp.proceed();
            auditLogService.log(
                auditable.eventType(), actor,
                buildDescription(auditable, pjp, null),
                auditable.entityType().isEmpty() ? null : auditable.entityType(),
                null, null, null,
                AuditLog.EventStatus.SUCCESS,
                auditable.severity(),
                ip);
        } catch (Exception ex) {
            auditLogService.log(
                auditable.eventType(), actor,
                buildDescription(auditable, pjp, ex),
                auditable.entityType().isEmpty() ? null : auditable.entityType(),
                null, null, null,
                AuditLog.EventStatus.FAILURE,
                "ERROR",
                ip);
            throw ex;
        }
        return result;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private String resolveActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()
                && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }
        return "anonymous";
    }

    private String resolveIp() {
        try {
            ServletRequestAttributes attrs =
                (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest req = attrs.getRequest();
                String fwd = req.getHeader("X-Forwarded-For");
                return (fwd != null && !fwd.isBlank())
                    ? fwd.split(",")[0].trim()
                    : req.getRemoteAddr();
            }
        } catch (Exception ignored) {}
        return "unknown";
    }

    private String buildDescription(Auditable a, ProceedingJoinPoint pjp, Exception ex) {
        if (!a.description().isEmpty()) return a.description();
        String method = pjp.getSignature().toShortString();
        return ex != null
            ? method + " failed: " + ex.getMessage()
            : method + " executed successfully";
    }
}
