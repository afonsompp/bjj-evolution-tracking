package com.bjj.evolution.audit;

import com.bjj.evolution.audit.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByAcademyIdOrderByOccurredAtDesc(UUID academyId, Pageable pageable);

    Page<AuditLog> findByActorIdOrderByOccurredAtDesc(UUID actorId, Pageable pageable);
}
