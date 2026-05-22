package com.bjj.evolution.audit.domain;

import com.bjj.evolution.audit.event.AuditEvent;
import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "audit_log")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE)
    @Column(nullable = false)
    private Long id;

    @Column(nullable = false)
    private Instant occurredAt;

    private UUID actorId;
    private UUID academyId;

    @Column(nullable = false, length = 80)
    private String action;

    @Column(length = 40)
    private String resourceType;

    @Column(length = 80)
    private String resourceId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> payload;

    @Column(length = 45)
    private String ipAddress;

    @Column(columnDefinition = "text")
    private String userAgent;

    protected AuditLog() {}

    public static AuditLog from(AuditEvent event) {
        AuditLog log = new AuditLog();
        log.occurredAt   = event.occurredAt();
        log.actorId      = event.actorId();
        log.academyId    = event.academyId();
        log.action       = event.action();
        log.resourceType = event.resourceType().isBlank() ? null : event.resourceType();
        log.resourceId   = event.resourceId();
        log.payload      = (event.payload() == null || event.payload().isEmpty()) ? null : event.payload();
        log.ipAddress    = event.ipAddress();
        log.userAgent    = event.userAgent();
        return log;
    }

    public Long getId()             { return id; }
    public Instant getOccurredAt()  { return occurredAt; }
    public UUID getActorId()        { return actorId; }
    public UUID getAcademyId()      { return academyId; }
    public String getAction()       { return action; }
    public String getResourceType() { return resourceType; }
    public String getResourceId()   { return resourceId; }
    public Map<String, Object> getPayload() { return payload; }
    public String getIpAddress()    { return ipAddress; }
    public String getUserAgent()    { return userAgent; }
}
