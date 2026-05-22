package com.bjj.evolution.audit.event;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

public record AuditEvent(
        String action,
        UUID actorId,
        UUID academyId,
        String resourceType,
        String resourceId,
        Map<String, Object> payload,
        String ipAddress,
        String userAgent,
        Instant occurredAt
) {}
