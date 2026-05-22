package com.bjj.evolution.audit;

import com.bjj.evolution.audit.annotation.Auditable;
import com.bjj.evolution.audit.event.AuditEvent;
import com.bjj.evolution.shared.utils.SecurityUtils;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Aspect
@Component
public class AuditAspect {

    private static final Logger log = LoggerFactory.getLogger(AuditAspect.class);

    private final ApplicationEventPublisher eventPublisher;
    private final UserProfileRepository userProfileRepository;

    public AuditAspect(ApplicationEventPublisher eventPublisher,
                       UserProfileRepository userProfileRepository) {
        this.eventPublisher = eventPublisher;
        this.userProfileRepository = userProfileRepository;
    }

    @Around("@annotation(auditable)")
    public Object audit(ProceedingJoinPoint pjp, Auditable auditable) throws Throwable {
        Object result = pjp.proceed();

        try {
            UUID actorId     = SecurityUtils.getCurrentUserId();
            Object[] args    = pjp.getArgs();
            UUID academyId   = extractUuid(args, auditable.academyIdArg());
            String resourceId = extractResourceId(args, auditable.resourceIdArg());
            String ip        = extractIpAddress();
            String ua        = extractUserAgent();
            Instant now      = Instant.now();

            eventPublisher.publishEvent(new AuditEvent(
                    auditable.action(),
                    actorId,
                    academyId,
                    auditable.resourceType(),
                    resourceId,
                    Map.of(),
                    ip, ua, now
            ));

            UserProfile actor = userProfileRepository.findById(actorId).orElse(null);
            if (SecurityUtils.isAdmin(actor)) {
                eventPublisher.publishEvent(new AuditEvent(
                        AuditAction.ADMIN_BYPASS,
                        actorId,
                        academyId,
                        auditable.resourceType(),
                        resourceId,
                        Map.of("wrappedAction", auditable.action()),
                        ip, ua, now
                ));
            }
        } catch (Exception e) {
            log.warn("Failed to publish audit event action={}: {}", auditable.action(), e.getMessage());
        }

        return result;
    }

    private UUID extractUuid(Object[] args, int index) {
        if (index < 0 || index >= args.length) return null;
        return args[index] instanceof UUID u ? u : null;
    }

    private String extractResourceId(Object[] args, int index) {
        if (index < 0 || index >= args.length || args[index] == null) return null;
        return args[index].toString();
    }

    private String extractIpAddress() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            String xForwardedFor = attrs.getRequest().getHeader("X-Forwarded-For");
            return xForwardedFor != null
                    ? xForwardedFor.split(",")[0].trim()
                    : attrs.getRequest().getRemoteAddr();
        } catch (Exception e) {
            return null;
        }
    }

    private String extractUserAgent() {
        try {
            var attrs = (ServletRequestAttributes) RequestContextHolder.currentRequestAttributes();
            return attrs.getRequest().getHeader("User-Agent");
        } catch (Exception e) {
            return null;
        }
    }
}
