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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@Service
public class ClassTemplateService {

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
                .orElseThrow(() -> new ResourceNotFoundException("Academy", academyId));

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> new ResourceNotFoundException("Instructor", request.instructorId()));

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

        return ClassTemplateResponse.fromEntity(repository.save(template));
    }

    @Transactional
    public ClassTemplateResponse update(UUID templateId, ClassTemplateRequest request) {
        ClassTemplate template = repository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Class template", templateId));

        UserProfile instructor = userProfileRepository.findById(request.instructorId())
                .orElseThrow(() -> new ResourceNotFoundException("Instructor", request.instructorId()));

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

        return ClassTemplateResponse.fromEntity(repository.save(template));
    }

    @Transactional
    public Page<ClassTemplateResponse> findAll(UUID academyId, Pageable pageable) {
        return repository.findAllByAcademyId(academyId, pageable)
                .map(ClassTemplateResponse::fromEntity);
    }

    @Transactional
    public void delete(UUID templateId) {
        if (!repository.existsById(templateId)) {
            throw new ResourceNotFoundException("Class template", templateId);
        }
        repository.deleteById(templateId);
    }
}
