package com.bjj.evolution.academy.clazz.service;

import com.bjj.evolution.academy.clazz.ClassAttendanceRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.ClassAttendance;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.clazz.domain.dto.CheckInResponse;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.academy.member.domain.dto.AcademyMenberClassViewResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class ClassAttendanceService {

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
            throw new IllegalStateException("Só é possível fazer check-in em aulas publicadas");
        }

        attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId).ifPresent(a -> {
            throw new IllegalStateException("Aluno já registrado nesta aula");
        });

        UserProfile student = userProfileRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Aluno não encontrado"));

        ClassAttendance attendance = new ClassAttendance(scheduledClass, student, CheckInStatus.REGISTERED);
        return CheckInResponse.fromEntity(attendanceRepository.save(attendance));
    }

    @Transactional
    public CheckInResponse confirm(UUID academyId, Long classId, UUID studentId) {
        getScheduledClassAndValidateAcademy(academyId, classId);
        
        ClassAttendance attendance = attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Registro de presença não encontrado"));

        if (attendance.getStatus() == CheckInStatus.CANCELED) {
            throw new IllegalStateException("Não é possível confirmar um check-in cancelado");
        }

        attendance.setStatus(CheckInStatus.CONFIRMED);
        attendance.setCheckInTime(LocalDateTime.now());
        return CheckInResponse.fromEntity(attendanceRepository.save(attendance));
    }

    @Transactional
    public CheckInResponse cancel(UUID academyId, Long classId, UUID studentId) {
        getScheduledClassAndValidateAcademy(academyId, classId);
        
        ClassAttendance attendance = attendanceRepository.findByScheduledClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Registro de presença não encontrado"));

        if (attendance.getScheduledClass().getStatus() == ClassStatus.COMPLETED) {
            throw new IllegalStateException("Não é possível cancelar presença em uma aula já concluída");
        }

        attendance.setStatus(CheckInStatus.CANCELED);
        return CheckInResponse.fromEntity(attendanceRepository.save(attendance));
    }

    public Page<CheckInResponse> listByClass(UUID academyId, Long classId, Pageable pageable) {
        getScheduledClassAndValidateAcademy(academyId, classId);
        
        return attendanceRepository.findAllByScheduledClassId(classId, pageable)
                .map(CheckInResponse::fromEntity);
    }

    public Page<AcademyMenberClassViewResponse> findClassViewsByStudent(UUID studentId, CheckInStatus status, Pageable pageable) {
        if (status != null) {
            return attendanceRepository.findByStudentIdAndStatus(studentId, status, pageable)
                    .map(AcademyMenberClassViewResponse::fromEntity);
        }
        return attendanceRepository.findByStudentId(studentId, pageable)
                .map(AcademyMenberClassViewResponse::fromEntity);
    }

    public Page<AcademyMenberClassViewResponse> findClassViewsByStudentAndAcademy(UUID academyId, UUID studentId, CheckInStatus status, Pageable pageable) {
        if (status != null) {
            return attendanceRepository.findByStudentIdAndScheduledClassAcademyIdAndStatus(studentId, academyId, status, pageable)
                    .map(AcademyMenberClassViewResponse::fromEntity);
        }
        return attendanceRepository.findByStudentIdAndScheduledClassAcademyId(studentId, academyId, pageable)
                .map(AcademyMenberClassViewResponse::fromEntity);
    }
    
    private ScheduledClass getScheduledClassAndValidateAcademy(UUID academyId, Long classId) {
        ScheduledClass scheduledClass = scheduledClassRepository.findById(classId)
                .orElseThrow(() -> new EntityNotFoundException("Aula não encontrada"));
                
        if (!scheduledClass.getAcademy().getId().equals(academyId)) {
            throw new IllegalArgumentException("Aula não pertence a esta academia");
        }
        
        return scheduledClass;
    }
}
