package com.bjj.evolution.academy.clazz.service;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.clazz.ClassTemplateRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.ClassRecurrenceRule;
import com.bjj.evolution.academy.clazz.domain.ClassTemplate;
import com.bjj.evolution.academy.clazz.domain.dto.ClassRecurrenceRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateResponse;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.TechniqueRepository;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ClassTemplateServiceTest {

    @Mock
    private ClassTemplateRepository repository;

    @Mock
    private ScheduledClassRepository scheduledClassRepository;

    @Mock
    private AcademyRepository academyRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private TechniqueRepository techniqueRepository;

    @InjectMocks
    private ClassTemplateService service;

    @Captor
    private ArgumentCaptor<ClassTemplate> templateCaptor;

    private UUID academyId;
    private UUID templateId;
    private UUID instructorId;
    private Academy academy;
    private UserProfile instructor;
    private Technique existingTechnique;
    private ClassTemplate existingTemplate;

    @BeforeEach
    void setUp() {
        academyId = UUID.randomUUID();
        templateId = UUID.randomUUID();
        instructorId = UUID.randomUUID();

        academy = new Academy("Gracie Barra", "123 Main St");
        academy.setId(academyId);

        instructor = new UserProfile(instructorId, "John", "Danaher", "johnny",
                null, null, LocalDate.of(2020, 1, 1), UserRole.CUSTOMER);

        existingTechnique = new Technique(1L, "Armbar", "Juji Gatame",
                TechniqueType.SUBMISSION, TechniqueTarget.ARM);

        // Simulate a managed entity loaded from the DB with mutable collections.
        existingTemplate = new ClassTemplate();
        existingTemplate.setId(templateId);
        existingTemplate.setAcademy(academy);
        existingTemplate.setInstructor(instructor);
        existingTemplate.setName("Morning Class");
        existingTemplate.setDurationMinutes(90);
        existingTemplate.setClassType(ClassType.REGULAR);
        existingTemplate.setTrainingType(TrainingType.GI);
        existingTemplate.setDefaultTechniques(new ArrayList<>(List.of(existingTechnique)));

        ClassRecurrenceRule existingRule = new ClassRecurrenceRule(
                existingTemplate, DayOfWeek.MONDAY, LocalTime.of(7, 0));
        existingTemplate.getRecurrenceRules().add(existingRule);
    }

    @Test
    @DisplayName("update with only instructor change should preserve techniques and recurrence rules")
    void update_partialPut_shouldPreserveExistingCollections() {
        when(repository.findById(templateId)).thenReturn(Optional.of(existingTemplate));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.of(instructor));
        when(repository.save(any(ClassTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        // PUT body "só com o professor" — no techniqueIds, no recurrenceRules.
        ClassTemplateRequest partial = new ClassTemplateRequest(
                "Morning Class", instructorId, 90,
                ClassType.REGULAR, TrainingType.GI,
                null, null);

        ClassTemplateResponse result = service.update(templateId, partial);

        assertNotNull(result);
        verify(repository).save(templateCaptor.capture());
        ClassTemplate saved = templateCaptor.getValue();

        // Techniques must NOT be wiped when techniqueIds is absent.
        assertEquals(1, saved.getDefaultTechniques().size());
        assertEquals("Armbar", saved.getDefaultTechniques().get(0).getName());

        // Recurrence rules must NOT be cleared when recurrenceRules is absent.
        assertEquals(1, saved.getRecurrenceRules().size());
        assertEquals(DayOfWeek.MONDAY, saved.getRecurrenceRules().get(0).getDayOfWeek());

        // No technique lookup should happen for an absent field.
        verify(techniqueRepository, never()).findAllById(any());
    }

    @Test
    @DisplayName("update with techniqueIds should assign a mutable collection (no UnsupportedOperationException on merge)")
    void update_withTechniqueIds_shouldUseMutableList() {
        when(repository.findById(templateId)).thenReturn(Optional.of(existingTemplate));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.of(instructor));
        when(techniqueRepository.findAllById(List.of(1L))).thenReturn(List.of(existingTechnique));
        when(repository.save(any(ClassTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassTemplateRequest request = new ClassTemplateRequest(
                "Morning Class", instructorId, 90,
                ClassType.REGULAR, TrainingType.GI,
                List.of(1L), null);

        service.update(templateId, request);

        verify(repository).save(templateCaptor.capture());
        List<Technique> techniques = templateCaptor.getValue().getDefaultTechniques();

        // Hibernate's merge calls clear() on the collection — it must be mutable.
        assertDoesNotThrow(techniques::clear);
    }

    @Test
    @DisplayName("update with recurrenceRules should replace existing rules")
    void update_withRecurrenceRules_shouldReplaceRules() {
        when(repository.findById(templateId)).thenReturn(Optional.of(existingTemplate));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.of(instructor));
        when(repository.save(any(ClassTemplate.class))).thenAnswer(inv -> inv.getArgument(0));

        ClassTemplateRequest request = new ClassTemplateRequest(
                "Morning Class", instructorId, 90,
                ClassType.REGULAR, TrainingType.GI,
                null,
                List.of(new ClassRecurrenceRequest(DayOfWeek.WEDNESDAY, LocalTime.of(18, 30))));

        service.update(templateId, request);

        verify(repository).save(templateCaptor.capture());
        List<ClassRecurrenceRule> rules = templateCaptor.getValue().getRecurrenceRules();

        assertEquals(1, rules.size());
        assertEquals(DayOfWeek.WEDNESDAY, rules.get(0).getDayOfWeek());
        assertEquals(LocalTime.of(18, 30), rules.get(0).getStartTime());
    }
}
