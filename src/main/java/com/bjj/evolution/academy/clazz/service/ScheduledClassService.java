package com.bjj.evolution.academy.clazz.service;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassResponse;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.TechniqueRepository;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
public class ScheduledClassService {

    private final ScheduledClassRepository repository;
    private final AcademyRepository academyRepository;
    private final UserProfileRepository userProfileRepository;
    private final TechniqueRepository techniqueRepository;

    public ScheduledClassService(ScheduledClassRepository repository,
                                 AcademyRepository academyRepository,
                                 UserProfileRepository userProfileRepository,
                                 TechniqueRepository techniqueRepository) {
        this.repository = repository;
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
        this.techniqueRepository = techniqueRepository;
    }

    @Transactional
    public ScheduledClassResponse createManualClass(ScheduledClassRequest request) {
        Academy academy = academyRepository.findById(request.academyId())
                .orElseThrow(() -> new ResourceNotFoundException("Academy", request.academyId()));

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> new ResourceNotFoundException("Instructor", request.instructorId()));

        List<Technique> techniques = request.techniqueIds() != null ?
                techniqueRepository.findAllById(request.techniqueIds()) : List.of();

        ScheduledClass scheduledClass = ScheduledClass.builder()
                .academy(academy)
                .instructor(instructor)
                .startTime(request.startTime())
                .duration(Duration.ofMinutes(request.durationMinutes()))
                .classType(request.classType())
                .trainingType(request.trainingType())
                .scheduledTechniques(techniques)
                .status(ClassStatus.PUBLISHED)
                .build();
        return ScheduledClassResponse.fromEntity(repository.save(scheduledClass));
    }

    @Transactional
    public ScheduledClassResponse update(Long id, ScheduledClassRequest request) {
        ScheduledClass scheduledClass = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", id));

        if (scheduledClass.getStatus() == ClassStatus.COMPLETED || scheduledClass.getStatus() == ClassStatus.CANCELED) {
            throw new BusinessRuleException("Cannot edit a class that is already completed or canceled.");
        }

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> new ResourceNotFoundException("Instructor", request.instructorId()));

        List<Technique> techniques = techniqueRepository.findAllById(request.techniqueIds());

        scheduledClass.setInstructor(instructor);
        scheduledClass.setStartTime(request.startTime());
        scheduledClass.setDuration(Duration.ofMinutes(request.durationMinutes()));
        scheduledClass.setClassType(request.classType());
        scheduledClass.setTrainingType(request.trainingType());
        scheduledClass.setScheduledTechniques(techniques);

        return ScheduledClassResponse.fromEntity(repository.save(scheduledClass));
    }

    @Transactional
    public void cancel(Long id) {
        ScheduledClass scheduledClass = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", id));

        if (scheduledClass.getStatus() == ClassStatus.COMPLETED) {
            throw new BusinessRuleException("Cannot cancel a class that is already completed.");
        }

        scheduledClass.setStatus(ClassStatus.CANCELED);
        repository.save(scheduledClass);
    }

    @Transactional
    public Page<ScheduledClassResponse> findAll(
            UUID academyId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable) {

        Page<ScheduledClass> classes;

        if (startDate != null && endDate != null) {
            classes = repository.findAllByAcademyIdAndStartTimeBetween(academyId, startDate, endDate, pageable);
        } else {
            classes = repository.findAllByAcademyId(academyId, pageable);
        }

        return classes.map(ScheduledClassResponse::fromEntity);
    }

    @Transactional
    public ScheduledClassResponse findById(UUID academyId, Long classId) {
        ScheduledClass scheduledClass = repository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", classId));

        if (!scheduledClass.getAcademy().getId().equals(academyId)) {
            throw new BusinessRuleException("Class does not belong to the given academy.");
        }

        return ScheduledClassResponse.fromEntity(scheduledClass);
    }
}
