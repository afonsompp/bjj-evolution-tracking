package com.bjj.evolution.academy.clazz;

import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ClassAttendanceRepository extends JpaRepository<ClassAttendance, Long> {

    Optional<ClassAttendance> findByScheduledClassIdAndStudentId(Long scheduledClassId, UUID studentId);

    /** Attendances for a class restricted to the given statuses — the recipients of class notifications. */
    List<ClassAttendance> findByScheduledClassIdAndStatusIn(Long scheduledClassId, Collection<CheckInStatus> statuses);

    Page<ClassAttendance> findAllByScheduledClassId(Long scheduledClassId, Pageable pageable);

    Page<ClassAttendance> findByStudentIdAndScheduledClassAcademyId(UUID studentId, UUID academyId, Pageable pageable);

    Page<ClassAttendance> findByStudentIdAndScheduledClassAcademyIdAndStatus(UUID studentId, UUID academyId, CheckInStatus status, Pageable pageable);

    Page<ClassAttendance> findByStudentId(UUID studentId, Pageable pageable);
    
    Page<ClassAttendance> findByStudentIdAndStatus(UUID studentId, CheckInStatus status, Pageable pageable);
}
