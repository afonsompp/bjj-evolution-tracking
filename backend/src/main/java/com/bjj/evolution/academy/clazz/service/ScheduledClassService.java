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
import com.bjj.evolution.notification.event.ClassCanceledEvent;
import com.bjj.evolution.notification.event.ClassUpdatedEvent;
import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ScheduledClassService {

    private static final Logger log = LoggerFactory.getLogger(ScheduledClassService.class);

    private static final int AUTO_COMPLETE_GRACE_MINUTES = 30;

    private final ScheduledClassRepository repository;
    private final AcademyRepository academyRepository;
    private final UserProfileRepository userProfileRepository;
    private final TechniqueRepository techniqueRepository;
    private final ApplicationEventPublisher eventPublisher;

    public ScheduledClassService(ScheduledClassRepository repository,
                                 AcademyRepository academyRepository,
                                 UserProfileRepository userProfileRepository,
                                 TechniqueRepository techniqueRepository,
                                 ApplicationEventPublisher eventPublisher) {
        this.repository = repository;
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
        this.techniqueRepository = techniqueRepository;
        this.eventPublisher = eventPublisher;
    }

    @Transactional
    public ScheduledClassResponse createManualClass(ScheduledClassRequest request) {
        Academy academy = academyRepository.findById(request.academyId())
                .orElseThrow(() -> {
                    log.error("Manual class creation failed: academy not found id={}", request.academyId());
                    return new ResourceNotFoundException("Academy", request.academyId());
                });

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> {
                    log.error("Manual class creation failed: instructor not found id={}", request.instructorId());
                    return new ResourceNotFoundException("Instructor", request.instructorId());
                });

        List<Technique> techniques = request.techniqueIds() != null ?
                techniqueRepository.findAllById(request.techniqueIds()) : List.of();

        ScheduledClass scheduledClass = ScheduledClass.builder()
                .academy(academy)
                .instructor(instructor)
                .startTime(request.startTime())
                .durationMinutes(request.durationMinutes())
                .classType(request.classType())
                .trainingType(request.trainingType())
                .scheduledTechniques(techniques)
                .status(request.status() != null ? request.status() : ClassStatus.PUBLISHED)
                .build();
        ScheduledClass saved = repository.save(scheduledClass);
        log.info("Scheduled class created: id={} academy={} instructor={} start={} type={} training={} techniques={}",
                saved.getId(), request.academyId(), request.instructorId(),
                request.startTime(), request.classType(), request.trainingType(), techniques.size());
        return ScheduledClassResponse.fromEntity(saved);
    }

    @Transactional
    public ScheduledClassResponse update(Long id, ScheduledClassRequest request) {
        ScheduledClass scheduledClass = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Class update failed: class not found id={}", id);
                    return new ResourceNotFoundException("Class", id);
                });

        if (scheduledClass.getStatus() == ClassStatus.COMPLETED || scheduledClass.getStatus() == ClassStatus.CANCELED) {
            log.warn("Class update denied: class id={} status={}", id, scheduledClass.getStatus());
            throw new BusinessRuleException("Cannot edit a class that is already completed or canceled.");
        }

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> {
                    log.error("Class update failed: instructor not found id={}", request.instructorId());
                    return new ResourceNotFoundException("Instructor", request.instructorId());
                });

        List<Technique> techniques = request.techniqueIds() != null
                ? techniqueRepository.findAllById(request.techniqueIds())
                : List.of();

        // Capture what students care about before mutating, to decide whether to notify.
        Instant previousStart = scheduledClass.getStartTime();
        UUID previousInstructorId = scheduledClass.getInstructor().getId();

        log.info("Updating scheduled class: id={} start={} instructor={} techniques={}",
                id, request.startTime(), request.instructorId(), techniques.size());

        scheduledClass.setInstructor(instructor);
        scheduledClass.setStartTime(request.startTime());
        scheduledClass.setDurationMinutes(request.durationMinutes());
        scheduledClass.setClassType(request.classType());
        scheduledClass.setTrainingType(request.trainingType());
        scheduledClass.setScheduledTechniques(techniques);
        if (request.status() == ClassStatus.DRAFT || request.status() == ClassStatus.PUBLISHED) {
            scheduledClass.setStatus(request.status());
        }

        ScheduledClass saved = repository.save(scheduledClass);
        log.info("Scheduled class updated: id={} start={} instructor={}", saved.getId(), saved.getStartTime(), request.instructorId());

        boolean scheduleChanged = !saved.getStartTime().equals(previousStart)
                || !instructor.getId().equals(previousInstructorId);
        if (scheduleChanged && saved.getStatus() == ClassStatus.PUBLISHED) {
            eventPublisher.publishEvent(new ClassUpdatedEvent(saved.getId()));
        }
        return ScheduledClassResponse.fromEntity(saved);
    }

    @Transactional
    public void cancel(Long id) {
        ScheduledClass scheduledClass = repository.findById(id)
                .orElseThrow(() -> {
                    log.warn("Class cancellation failed: class not found id={}", id);
                    return new ResourceNotFoundException("Class", id);
                });

        if (scheduledClass.getStatus() == ClassStatus.COMPLETED) {
            log.warn("Class cancellation denied: class id={} already completed", id);
            throw new BusinessRuleException("Cannot cancel a class that is already completed.");
        }

        ClassStatus oldStatus = scheduledClass.getStatus();
        scheduledClass.setStatus(ClassStatus.CANCELED);
        repository.save(scheduledClass);
        log.info("Scheduled class canceled: id={} academy={} wasStatus={}", id, scheduledClass.getAcademy().getId(), oldStatus);

        // Only worth notifying students if the class had been published to them.
        if (oldStatus == ClassStatus.PUBLISHED) {
            eventPublisher.publishEvent(new ClassCanceledEvent(id));
        }
    }

    @Transactional
    public void close(UUID academyId, Long classId) {
        ScheduledClass scheduledClass = repository.findById(classId)
                .orElseThrow(() -> {
                    log.warn("Class close failed: class not found id={}", classId);
                    return new ResourceNotFoundException("Class", classId);
                });

        if (!scheduledClass.getAcademy().getId().equals(academyId)) {
            log.warn("Class close denied: academy mismatch classId={} belongs={} requested={}",
                    classId, scheduledClass.getAcademy().getId(), academyId);
            throw new BusinessRuleException("Class does not belong to the given academy.");
        }

        if (scheduledClass.getStatus() != ClassStatus.PUBLISHED) {
            log.warn("Class close denied: classId={} status={}", classId, scheduledClass.getStatus());
            throw new BusinessRuleException("Only published classes can be closed.");
        }

        scheduledClass.setStatus(ClassStatus.COMPLETED);
        repository.save(scheduledClass);
        log.info("Scheduled class closed (COMPLETED): id={} academy={}", classId, academyId);
    }

    @Scheduled(fixedDelayString = "${app.class.auto-complete.fixed-delay-ms:60000}")
    @Transactional
    public void autoCompletePastClasses() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(AUTO_COMPLETE_GRACE_MINUTES));
        List<ScheduledClass> candidates =
                repository.findAllByStatusAndStartTimeBefore(ClassStatus.PUBLISHED, cutoff);

        int updated = 0;
        for (ScheduledClass c : candidates) {
            Instant endTime = c.getStartTime().plus(Duration.ofMinutes(c.getDurationMinutes()));
            if (endTime.isBefore(cutoff)) {
                c.setStatus(ClassStatus.COMPLETED);
                updated++;
            }
        }
        if (updated > 0) {
            log.info("Auto-completed scheduled classes: count={} cutoff={}", updated, cutoff);
        }
    }

    @Transactional
    public Page<ScheduledClassResponse> findAll(
            UUID academyId,
            Instant startDate,
            Instant endDate,
            Pageable pageable) {

        Page<ScheduledClass> classes;

        if (startDate != null && endDate != null) {
            log.debug("Listing scheduled classes academy={} range=[{} to {}] page={} size={}",
                    academyId, startDate, endDate, pageable.getPageNumber(), pageable.getPageSize());
            classes = repository.findAllByAcademyIdAndStartTimeBetween(academyId, startDate, endDate, pageable);
        } else {
            log.debug("Listing scheduled classes academy={} page={} size={}", academyId, pageable.getPageNumber(), pageable.getPageSize());
            classes = repository.findAllByAcademyId(academyId, pageable);
        }

        return classes.map(ScheduledClassResponse::fromEntity);
    }

    @Transactional
    public ScheduledClassResponse findById(UUID academyId, Long classId) {
        ScheduledClass scheduledClass = repository.findById(classId)
                .orElseThrow(() -> {
                    log.warn("Class lookup failed: class not found id={}", classId);
                    return new ResourceNotFoundException("Class", classId);
                });

        if (!scheduledClass.getAcademy().getId().equals(academyId)) {
            log.warn("Class academy mismatch: classId={} belongs to academy={}, requested academy={}",
                    classId, scheduledClass.getAcademy().getId(), academyId);
            throw new BusinessRuleException("Class does not belong to the given academy.");
        }

        return ScheduledClassResponse.fromEntity(scheduledClass);
    }
}
