package com.bjj.evolution.audit;

import com.bjj.evolution.audit.domain.AuditLog;
import com.bjj.evolution.audit.event.AuditEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AuditEventListener {

    private static final Logger log = LoggerFactory.getLogger(AuditEventListener.class);

    private final AuditLogRepository auditLogRepository;

    public AuditEventListener(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    @Async("auditTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handle(AuditEvent event) {
        try {
            auditLogRepository.save(AuditLog.from(event));
            log.debug("Audit saved: action={} actor={} resource={}/{}",
                    event.action(), event.actorId(), event.resourceType(), event.resourceId());
        } catch (Exception e) {
            log.error("Failed to persist audit log: action={} actor={}",
                    event.action(), event.actorId(), e);
        }
    }
}
