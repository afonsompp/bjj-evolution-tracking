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
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
        return register(academyId, classId, studentId, false);
    }

    /**
     * Registers a student's attendance.
     *
     * @param allowCompleted when {@code true} (a manual add by staff), attendance may also be
     *                       registered for a {@code COMPLETED} class to correct it retroactively;
     *                       self check-in keeps it {@code PUBLISHED}-only.
     */
    @Transactional
    public CheckInResponse register(UUID academyId, Long classId, UUID studentId, boolean allowCompleted) {
        ScheduledClass scheduledClass = getScheduledClassAndValidateAcademy(academyId, classId);

        boolean registrable = scheduledClass.getStatus() == ClassStatus.PUBLISHED
                || (allowCompleted && scheduledClass.getStatus() == ClassStatus.COMPLETED);
        if (!registrable) {
            log.warn("Check-in registration denied: classId={} student={} classStatus={} allowCompleted={}",
                    classId, studentId, scheduledClass.getStatus(), allowCompleted);
            throw new BusinessRuleException(allowCompleted
                    ? "Check-in is only allowed for published or completed classes."
                    : "Check-in is only allowed for published classes.");
        }

        if (scheduledClass.getInstructor().getId().equals(studentId)) {
            log.warn("Check-in registration denied: instructor is already confirmed in the class classId={} instructorId={}", classId, studentId);
            throw new BusinessRuleException("The instructor is already confirmed as the teacher of this class.");
        }

        Optional<ClassAttendance> existing = attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId);
        if (existing.isPresent()) {
            ClassAttendance attendance = existing.get();
            // A canceled check-in can be re-registered (one record per student/class
            // is enforced by a unique constraint, so we reuse it rather than insert).
            if (attendance.getStatus() != CheckInStatus.CANCELED) {
                log.warn("Check-in registration denied: duplicate classId={} student={} existingStatus={}", classId, studentId, attendance.getStatus());
                throw new BusinessRuleException("Student is already registered for this class.");
            }
            attendance.setStatus(CheckInStatus.REGISTERED);
            attendance.setCheckInTime(null);
            ClassAttendance saved = attendanceRepository.save(attendance);
            log.info("Check-in re-registered: classId={} student={} academy={}", classId, studentId, academyId);
            return CheckInResponse.fromEntity(saved);
        }

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
        ScheduledClass scheduledClass = getScheduledClassAndValidateAcademy(academyId, classId);

        if (scheduledClass.getStatus() == ClassStatus.CANCELED) {
            log.warn("Check-in confirmation denied: class is canceled classId={} student={}", classId, studentId);
            throw new BusinessRuleException("Cannot confirm attendance for a canceled class.");
        }

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

    public Page<AcademyMenberClassViewResponse> findClassViewsByStudent(
            UUID studentId, CheckInStatus status, Instant start, Instant end, Pageable pageable) {
        log.debug("Finding class views for student={} status={} start={} end={} page={} size={}",
                studentId, status, start, end, pageable.getPageNumber(), pageable.getPageSize());
        return attendanceRepository.findAll(historySpec(studentId, null, status, start, end), pageable)
                .map(AcademyMenberClassViewResponse::fromEntity);
    }

    public Page<AcademyMenberClassViewResponse> findClassViewsByStudentAndAcademy(
            UUID academyId, UUID studentId, CheckInStatus status, Instant start, Instant end, Pageable pageable) {
        log.debug("Finding class views for student={} academy={} status={} start={} end={} page={} size={}",
                studentId, academyId, status, start, end, pageable.getPageNumber(), pageable.getPageSize());
        return attendanceRepository.findAll(historySpec(studentId, academyId, status, start, end), pageable)
                .map(AcademyMenberClassViewResponse::fromEntity);
    }

    /**
     * Builds a student attendance-history query, adding only the predicates whose
     * argument is non-null. Done with the Criteria API rather than a JPQL
     * "(:p IS NULL OR …)" so PostgreSQL can always infer each bind's type.
     */
    private Specification<ClassAttendance> historySpec(
            UUID studentId, UUID academyId, CheckInStatus status, Instant start, Instant end) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("student").get("id"), studentId));
            Path<Object> scheduledClass = root.get("scheduledClass");
            if (academyId != null) {
                predicates.add(cb.equal(scheduledClass.get("academy").get("id"), academyId));
            }
            if (status != null) {
                predicates.add(cb.equal(root.get("status"), status));
            }
            if (start != null) {
                predicates.add(cb.greaterThanOrEqualTo(scheduledClass.<Instant>get("startTime"), start));
            }
            if (end != null) {
                predicates.add(cb.lessThanOrEqualTo(scheduledClass.<Instant>get("startTime"), end));
            }
            return cb.and(predicates.toArray(new Predicate[0]));
        };
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
