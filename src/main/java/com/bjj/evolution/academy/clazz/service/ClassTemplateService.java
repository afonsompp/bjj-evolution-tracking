package com.bjj.evolution.academy.clazz.service;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.clazz.ClassTemplateRepository;
import com.bjj.evolution.academy.clazz.domain.ClassRecurrenceRule;
import com.bjj.evolution.academy.clazz.domain.ClassTemplate;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateResponse;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.TechniqueRepository;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
public class ClassTemplateService {

    private static final Logger log = LoggerFactory.getLogger(ClassTemplateService.class);

    private final ClassTemplateRepository repository;
    private final AcademyRepository academyRepository;
    private final UserProfileRepository userProfileRepository;
    private final TechniqueRepository techniqueRepository;

    public ClassTemplateService(ClassTemplateRepository repository,
                                AcademyRepository academyRepository,
                                UserProfileRepository userProfileRepository,
                                TechniqueRepository techniqueRepository) {
        this.repository = repository;
        this.academyRepository = academyRepository;
        this.userProfileRepository = userProfileRepository;
        this.techniqueRepository = techniqueRepository;
    }

    @Transactional
    public ClassTemplateResponse create(UUID academyId, ClassTemplateRequest request) {
        Academy academy = academyRepository.findById(academyId)
                .orElseThrow(() -> {
                    log.error("Template creation failed: academy not found id={}", academyId);
                    return new ResourceNotFoundException("Academy", academyId);
                });

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> {
                    log.error("Template creation failed: instructor not found id={}", request.instructorId());
                    return new ResourceNotFoundException("Instructor", request.instructorId());
                });

        List<Technique> techniques = techniqueRepository.findAllById(request.techniqueIds());

        ClassTemplate template = new ClassTemplate();
        template.setAcademy(academy);
        template.setName(request.name());
        template.setInstructor(instructor);
        template.setDuration(Duration.ofMinutes(request.durationMinutes()));
        template.setClassType(request.classType());
        template.setTrainingType(request.trainingType());
        template.setDefaultTechniques(techniques);

        if (request.recurrenceRules() != null) {
            request.recurrenceRules().forEach(ruleReq -> {
                ClassRecurrenceRule rule = new ClassRecurrenceRule();
                rule.setTemplate(template);
                rule.setDayOfWeek(ruleReq.dayOfWeek());
                rule.setStartTime(ruleReq.startTime());
                template.getRecurrenceRules().add(rule);
            });
        }

        ClassTemplate saved = repository.save(template);
        log.info("Class template created: id={} name='{}' academy={} instructor={} type={} training={} recurrenceRules={}",
                saved.getId(), saved.getName(), academyId, request.instructorId(),
                request.classType(), request.trainingType(),
                request.recurrenceRules() != null ? request.recurrenceRules().size() : 0);
        return ClassTemplateResponse.fromEntity(saved);
    }

    @Transactional
    public ClassTemplateResponse update(UUID templateId, ClassTemplateRequest request) {
        ClassTemplate template = repository.findById(templateId)
                .orElseThrow(() -> {
                    log.warn("Template update failed: template not found id={}", templateId);
                    return new ResourceNotFoundException("Class template", templateId);
                });

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> {
                    log.error("Template update failed: instructor not found id={}", request.instructorId());
                    return new ResourceNotFoundException("Instructor", request.instructorId());
                });

        log.info("Updating class template: id={} name='{}' -> '{}' academy={} instructor={}",
                templateId, template.getName(), request.name(),
                template.getAcademy().getId(), request.instructorId());

        template.setName(request.name());
        template.setInstructor(instructor);
        template.setDuration(Duration.ofMinutes(request.durationMinutes()));
        template.setClassType(request.classType());
        template.setTrainingType(request.trainingType());
        template.setDefaultTechniques(techniqueRepository.findAllById(request.techniqueIds()));

        template.getRecurrenceRules().clear();
        request.recurrenceRules().forEach(ruleReq -> {
            ClassRecurrenceRule rule = new ClassRecurrenceRule();
            rule.setTemplate(template);
            rule.setDayOfWeek(ruleReq.dayOfWeek());
            rule.setStartTime(ruleReq.startTime());
            template.getRecurrenceRules().add(rule);
        });

        ClassTemplate saved = repository.save(template);
        log.info("Class template updated: id={} name='{}'", saved.getId(), saved.getName());
        return ClassTemplateResponse.fromEntity(saved);
    }

    @Transactional
    public Page<ClassTemplateResponse> findAll(UUID academyId, Pageable pageable) {
        log.debug("Listing class templates academy={} page={} size={}", academyId, pageable.getPageNumber(), pageable.getPageSize());
        return repository.findAllByAcademyId(academyId, pageable)
                .map(ClassTemplateResponse::fromEntity);
    }

    @Transactional
    public void delete(UUID templateId) {
        if (!repository.existsById(templateId)) {
            log.warn("Template deletion failed: template not found id={}", templateId);
            throw new ResourceNotFoundException("Class template", templateId);
        }
        repository.deleteById(templateId);
        log.info("Class template deleted: id={}", templateId);
    }
}
