package com.uam.aspect;

import java.lang.annotation.*;

/**
 * Mark any service method with this annotation to have an audit log
 * entry written automatically by {@link AuditAspect}.
 *
 * <pre>
 *   &#64;Auditable(eventType = "USER_CREATED", entityType = "User", severity = "INFO")
 *   public UserDto createUser(UserDto dto, String actor) { ... }
 * </pre>
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface Auditable {

    /** Event type key stored in audit_logs.event_type */
    String eventType();

    /** Optional entity type label (User / Role / Permission …) */
    String entityType() default "";

    /** Optional static description — if blank, the aspect auto-generates one. */
    String description() default "";

    /** Severity: INFO | WARNING | ERROR | CRITICAL */
    String severity() default "INFO";
}
