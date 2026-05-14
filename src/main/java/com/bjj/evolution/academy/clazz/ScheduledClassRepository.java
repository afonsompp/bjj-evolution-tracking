package com.bjj.evolution.academy.clazz;

import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.UUID;

public interface ScheduledClassRepository extends JpaRepository<ScheduledClass, Long> {

    Page<ScheduledClass> findAllByAcademyIdAndStartTimeBetween(
            UUID academyId,
            LocalDateTime start,
            LocalDateTime end,
            Pageable pageable
    );

    Page<ScheduledClass> findAllByAcademyId(UUID academyId, Pageable pageable);
}
