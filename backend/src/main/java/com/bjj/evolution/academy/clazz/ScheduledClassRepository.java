package com.bjj.evolution.academy.clazz;

import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public interface ScheduledClassRepository extends JpaRepository<ScheduledClass, Long> {

    Page<ScheduledClass> findAllByAcademyIdAndStartTimeBetween(
            UUID academyId,
            Instant start,
            Instant end,
            Pageable pageable
    );

    Page<ScheduledClass> findAllByAcademyId(UUID academyId, Pageable pageable);

    List<ScheduledClass> findAllByStatusAndStartTimeBefore(ClassStatus status, Instant startTime);

    /** Upcoming classes not yet reminded, whose start falls within [from, to] — drives the reminder job. */
    List<ScheduledClass> findByStatusAndReminderSentAtIsNullAndStartTimeBetween(ClassStatus status, Instant from, Instant to);
}
