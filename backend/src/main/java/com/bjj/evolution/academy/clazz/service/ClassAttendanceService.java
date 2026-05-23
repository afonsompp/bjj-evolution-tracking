package com.bjj.evolution.academy.clazz.service;

import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.clazz.domain.dto.CheckInResponse;
import com.bjj.evolution.academy.member.domain.dto.AcademyMenberClassViewResponse;
import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

@Service
public class ClassAttendanceService {

    private static final Logger log = LoggerFactory.getLogger(ClassAttendanceService.class);

    private final ClassAttendanceRepository attendanceRepository;
    private final ScheduledClassRepository scheduledClassRepository;
    private final UserProfileRepository userProfileRepository;

    public ClassAttendanceService(ClassAttendanceRepository attendanceRepository,
                                   ScheduledClassRepository scheduledClassRepository,
                                   UserProfileRepository userProfileRepository) {
        this.attendanceRepository = attendanceRepository;
        this.scheduledClassRepository = scheduledClassRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional
    public CheckInResponse register(UUID academyId, Long classId, UUID studentId) {
        ScheduledClass scheduledClass = getScheduledClassAndValidateAcademy(academyId, classId);

        if (scheduledClass.getStatus() != ClassStatus.PUBLISHED) {
            log.warn("Check-in registration denied: classId={} student={} classStatus={}", classId, studentId, scheduledClass.getStatus());
            throw new BusinessRuleException("Check-in is only allowed for published classes.");
        }

        attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId).ifPresent(a -> {
            log.warn("Check-in registration denied: duplicate classId={} student={} existingStatus={}", classId, studentId, a.getStatus());
            throw new BusinessRuleException("Student is already registered for this class.");
        });

        UserProfile student = userProfileRepository.findById(studentId)
                .orElseThrow(() -> {
                    log.error("Check-in registration failed: student not found id={}", studentId);
                    return new ResourceNotFoundException("Student", studentId);
                });

        ClassAttendance attendance = new ClassAttendance(scheduledClass, student, CheckInStatus.REGISTERED);
        ClassAttendance saved = attendanceRepository.save(attendance);
        log.info("Check-in registered: classId={} student={} academy={}", classId, studentId, academyId);
        return CheckInResponse.fromEntity(saved);
    }

    @Transactional
    public CheckInResponse confirm(UUID academyId, Long classId, UUID studentId) {
        getScheduledClassAndValidateAcademy(academyId, classId);

        ClassAttendance attendance = attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> {
                    log.warn("Check-in confirmation failed: attendance not found classId={} student={}", classId, studentId);
                    return new ResourceNotFoundException("Attendance record not found for student");
                });

        if (attendance.getStatus() == CheckInStatus.CANCELED) {
            log.warn("Check-in confirmation denied: attendance already canceled classId={} student={}", classId, studentId);
            throw new BusinessRuleException("Cannot confirm a canceled check-in.");
        }

        CheckInStatus oldStatus = attendance.getStatus();
        attendance.setStatus(CheckInStatus.CONFIRMED);
        attendance.setCheckInTime(Instant.now());
        ClassAttendance saved = attendanceRepository.save(attendance);
        log.info("Check-in confirmed: classId={} student={} academy={} wasStatus={} confirmedAt={}",
                classId, studentId, academyId, oldStatus, saved.getCheckInTime());
        return CheckInResponse.fromEntity(saved);
    }

    @Transactional
    public CheckInResponse cancel(UUID academyId, Long classId, UUID studentId) {
        getScheduledClassAndValidateAcademy(academyId, classId);

        ClassAttendance attendance = attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> {
                    log.warn("Check-in cancellation failed: attendance not found classId={} student={}", classId, studentId);
                    return new ResourceNotFoundException("Attendance record not found for student");
                });

        if (attendance.getScheduledClass().getStatus() == ClassStatus.COMPLETED) {
            log.warn("Check-in cancellation denied: class already completed classId={} student={}", classId, studentId);
            throw new BusinessRuleException("Cannot cancel attendance for a class that is already completed.");
        }

        attendance.setStatus(CheckInStatus.CANCELED);
        ClassAttendance saved = attendanceRepository.save(attendance);
        log.info("Check-in canceled: classId={} student={} academy={}", classId, studentId, academyId);
        return CheckInResponse.fromEntity(saved);
    }

    public Page<CheckInResponse> listByClass(UUID academyId, Long classId, Pageable pageable) {
        getScheduledClassAndValidateAcademy(academyId, classId);
        log.debug("Listing check-ins classId={} academy={} page={} size={}", classId, academyId, pageable.getPageNumber(), pageable.getPageSize());
        return attendanceRepository.findAllByScheduledClassId(classId, pageable)
                .map(CheckInResponse::fromEntity);
    }

    public Optional<CheckInResponse> getMyAttendance(UUID academyId, Long classId, UUID studentId) {
        getScheduledClassAndValidateAcademy(academyId, classId);
        return attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId)
                .map(CheckInResponse::fromEntity);
    }

    @Transactional
    public void deleteAttendance(UUID academyId, Long classId, UUID studentId) {
        getScheduledClassAndValidateAcademy(academyId, classId);
        ClassAttendance attendance = attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> {
                    log.warn("Attendance delete failed: record not found classId={} student={}", classId, studentId);
                    return new ResourceNotFoundException("Attendance record not found for student");
                });
        attendanceRepository.delete(attendance);
        log.info("Attendance deleted: classId={} student={} academy={}", classId, studentId, academyId);
    }

    public Page<AcademyMenberClassViewResponse> findClassViewsByStudent(UUID studentId, CheckInStatus status, Pageable pageable) {
        log.debug("Finding class views for student={} status={} page={} size={}", studentId, status, pageable.getPageNumber(), pageable.getPageSize());
        if (status != null) {
            return attendanceRepository.findByStudentIdAndStatus(studentId, status, pageable)
                    .map(AcademyMenberClassViewResponse::fromEntity);
        }
        return attendanceRepository.findByStudentId(studentId, pageable)
                .map(AcademyMenberClassViewResponse::fromEntity);
    }

    public Page<AcademyMenberClassViewResponse> findClassViewsByStudentAndAcademy(UUID academyId, UUID studentId, CheckInStatus status, Pageable pageable) {
        log.debug("Finding class views for student={} academy={} status={} page={} size={}", studentId, academyId, status, pageable.getPageNumber(), pageable.getPageSize());
        if (status != null) {
            return attendanceRepository.findByStudentIdAndScheduledClassAcademyIdAndStatus(studentId, academyId, status, pageable)
                    .map(AcademyMenberClassViewResponse::fromEntity);
        }
        return attendanceRepository.findByStudentIdAndScheduledClassAcademyId(studentId, academyId, pageable)
                .map(AcademyMenberClassViewResponse::fromEntity);
    }

    private ScheduledClass getScheduledClassAndValidateAcademy(UUID academyId, Long classId) {
        ScheduledClass scheduledClass = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> {
                    log.warn("Attendance operation failed: class not found id={}", classId);
                    return new ResourceNotFoundException("Class", classId);
                });

        if (!scheduledClass.getAcademy().getId().equals(academyId)) {
            log.warn("Attendance operation denied: academy mismatch classId={} belongsTo={} requested={}",
                    classId, scheduledClass.getAcademy().getId(), academyId);
            throw new BusinessRuleException("Class does not belong to the given academy.");
        }

        return scheduledClass;
    }
}
