package com.bjj.evolution.academy.clazz.service;

import com.bjj.evolution.academy.AcademyRepository;
import com.bjj.evolution.academy.clazz.ScheduledClassRepository;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.ScheduledClass;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassResponse;
import com.bjj.evolution.academy.domain.Academy;
import com.bjj.evolution.catalog.TechniqueRepository;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
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
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScheduledClassServiceTest {

    @Mock
    private ScheduledClassRepository repository;

    @Mock
    private AcademyRepository academyRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @Mock
    private TechniqueRepository techniqueRepository;

    @InjectMocks
    private ScheduledClassService service;

    @Captor
    private ArgumentCaptor<ScheduledClass> classCaptor;

    private UUID academyId;
    private UUID instructorId;
    private Long classId;
    private Academy academy;
    private UserProfile instructor;
    private Technique technique;
    private ScheduledClassRequest request;
    private Instant startTime;

    @BeforeEach
    void setUp() {
        academyId = UUID.randomUUID();
        instructorId = UUID.randomUUID();
        classId = 1L;
        startTime = Instant.parse("2026-06-01T10:00:00Z");

        academy = new Academy("Gracie Barra", "123 Main St");
        academy.setId(academyId);

        instructor = new UserProfile(instructorId, "John", "Danaher", "johnny",
                null, null, LocalDate.of(2020, 1, 1), UserRole.CUSTOMER);

        technique = new Technique(1L, "Armbar", "Juji Gatame", TechniqueType.SUBMISSION, TechniqueTarget.ARM);

        request = new ScheduledClassRequest(
                academyId, instructorId, startTime, 90,
                ClassType.REGULAR, TrainingType.GI,
                List.of(1L), null
        );
    }

    // -------------------------------------------------------
    // createManualClass
    // -------------------------------------------------------

    @Test
    @DisplayName("createManualClass should create and return a ScheduledClassResponse")
    void createManualClass_shouldCreateAndReturnResponse() {
        when(academyRepository.findById(academyId)).thenReturn(Optional.of(academy));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.of(instructor));
        when(techniqueRepository.findAllById(List.of(1L))).thenReturn(List.of(technique));

        ScheduledClass savedClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        savedClass.setId(classId);
        when(repository.save(any(ScheduledClass.class))).thenReturn(savedClass);

        ScheduledClassResponse result = service.createManualClass(request);

        assertNotNull(result);
        assertEquals(classId, result.id());
        assertEquals(academyId, result.academyId());
        assertEquals("Gracie Barra", result.academyName());
        assertEquals(ClassType.REGULAR, result.classType());
        assertEquals(TrainingType.GI, result.trainingType());
        assertEquals(ClassStatus.PUBLISHED, result.status());
        assertEquals(1, result.techniques().size());
        assertEquals("Armbar", result.techniques().get(0).name());

        verify(repository).save(classCaptor.capture());
        ScheduledClass captured = classCaptor.getValue();
        assertEquals(academy, captured.getAcademy());
        assertEquals(instructor, captured.getInstructor());
        assertEquals(startTime, captured.getStartTime());
        assertEquals(ClassStatus.PUBLISHED, captured.getStatus());
    }

    @Test
    @DisplayName("createManualClass should throw ResourceNotFoundException when academy not found")
    void createManualClass_whenAcademyNotFound_shouldThrow() {
        when(academyRepository.findById(academyId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.createManualClass(request));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("createManualClass should throw ResourceNotFoundException when instructor not found")
    void createManualClass_whenInstructorNotFound_shouldThrow() {
        when(academyRepository.findById(academyId)).thenReturn(Optional.of(academy));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.createManualClass(request));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("createManualClass should allow null techniqueIds")
    void createManualClass_withNullTechniqueIds_shouldCreate() {
        ScheduledClassRequest requestNoTechs = new ScheduledClassRequest(
                academyId, instructorId, startTime, 90,
                ClassType.REGULAR, TrainingType.GI,
                null, null
        );

        when(academyRepository.findById(academyId)).thenReturn(Optional.of(academy));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.of(instructor));

        ScheduledClass savedClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of());
        savedClass.setId(classId);
        when(repository.save(any(ScheduledClass.class))).thenReturn(savedClass);

        ScheduledClassResponse result = service.createManualClass(requestNoTechs);

        assertNotNull(result);
        assertTrue(result.techniques().isEmpty());
        verify(techniqueRepository, never()).findAllById(any());
    }

    // -------------------------------------------------------
    // update
    // -------------------------------------------------------

    @Test
    @DisplayName("update should update and return the updated ScheduledClassResponse")
    void update_shouldUpdateAndReturnResponse() {
        ScheduledClass existingClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        existingClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(existingClass));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.of(instructor));
        when(techniqueRepository.findAllById(List.of(1L))).thenReturn(List.of(technique));

        ScheduledClass updatedClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        updatedClass.setId(classId);
        when(repository.save(any(ScheduledClass.class))).thenReturn(updatedClass);

        ScheduledClassResponse result = service.update(classId, request);

        assertNotNull(result);
        assertEquals(classId, result.id());
        assertEquals(ClassType.REGULAR, result.classType());
        assertEquals(TrainingType.GI, result.trainingType());

        verify(repository).save(classCaptor.capture());
        ScheduledClass captured = classCaptor.getValue();
        assertEquals(instructor, captured.getInstructor());
        assertEquals(startTime, captured.getStartTime());
        assertEquals(Duration.ofMinutes(90), captured.getDuration());
    }

    @Test
    @DisplayName("update should throw ResourceNotFoundException when class not found")
    void update_whenClassNotFound_shouldThrow() {
        when(repository.findById(classId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(classId, request));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update should throw BusinessRuleException when class is completed")
    void update_whenClassCompleted_shouldThrow() {
        ScheduledClass completedClass = buildScheduledClass(ClassStatus.COMPLETED, List.of(technique));
        completedClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(completedClass));

        assertThrows(BusinessRuleException.class, () -> service.update(classId, request));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update should throw BusinessRuleException when class is canceled")
    void update_whenClassCanceled_shouldThrow() {
        ScheduledClass canceledClass = buildScheduledClass(ClassStatus.CANCELED, List.of(technique));
        canceledClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(canceledClass));

        assertThrows(BusinessRuleException.class, () -> service.update(classId, request));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("update should throw ResourceNotFoundException when instructor not found")
    void update_whenInstructorNotFound_shouldThrow() {
        ScheduledClass existingClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        existingClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(existingClass));
        when(userProfileRepository.findById(instructorId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(classId, request));
        verify(repository, never()).save(any());
    }

    // -------------------------------------------------------
    // cancel
    // -------------------------------------------------------

    @Test
    @DisplayName("cancel should set status to CANCELED")
    void cancel_shouldSetStatusToCanceled() {
        ScheduledClass existingClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        existingClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(existingClass));
        when(repository.save(any(ScheduledClass.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancel(classId);

        verify(repository).save(classCaptor.capture());
        assertEquals(ClassStatus.CANCELED, classCaptor.getValue().getStatus());
    }

    @Test
    @DisplayName("cancel should throw ResourceNotFoundException when class not found")
    void cancel_whenClassNotFound_shouldThrow() {
        when(repository.findById(classId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.cancel(classId));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("cancel should throw BusinessRuleException when class is already completed")
    void cancel_whenAlreadyCompleted_shouldThrow() {
        ScheduledClass completedClass = buildScheduledClass(ClassStatus.COMPLETED, List.of(technique));
        completedClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(completedClass));

        assertThrows(BusinessRuleException.class, () -> service.cancel(classId));
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("cancel should allow canceling a DRAFT class")
    void cancel_whenDraft_shouldAllow() {
        ScheduledClass draftClass = buildScheduledClass(ClassStatus.DRAFT, List.of(technique));
        draftClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(draftClass));
        when(repository.save(any(ScheduledClass.class))).thenAnswer(invocation -> invocation.getArgument(0));

        service.cancel(classId);

        verify(repository).save(classCaptor.capture());
        assertEquals(ClassStatus.CANCELED, classCaptor.getValue().getStatus());
    }

    // -------------------------------------------------------
    // findAll
    // -------------------------------------------------------

    @Test
    @DisplayName("findAll with date range should delegate to findAllByAcademyIdAndStartTimeBetween")
    void findAll_withDateRange_shouldCallBetweenQuery() {
        Instant start = Instant.parse("2026-06-01T00:00:00Z");
        Instant end = Instant.parse("2026-06-30T23:59:00Z");
        Pageable pageable = PageRequest.of(0, 20);

        ScheduledClass scheduledClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        scheduledClass.setId(classId);
        Page<ScheduledClass> classPage = new PageImpl<>(List.of(scheduledClass));

        when(repository.findAllByAcademyIdAndStartTimeBetween(academyId, start, end, pageable))
                .thenReturn(classPage);

        Page<ScheduledClassResponse> result = service.findAll(academyId, start, end, pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals(classId, result.getContent().get(0).id());

        verify(repository).findAllByAcademyIdAndStartTimeBetween(academyId, start, end, pageable);
        verify(repository, never()).findAllByAcademyId(any(), any());
    }

    @Test
    @DisplayName("findAll without date range should delegate to findAllByAcademyId")
    void findAll_withoutDateRange_shouldCallByAcademyQuery() {
        Pageable pageable = PageRequest.of(0, 20);

        ScheduledClass scheduledClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        scheduledClass.setId(classId);
        Page<ScheduledClass> classPage = new PageImpl<>(List.of(scheduledClass));

        when(repository.findAllByAcademyId(academyId, pageable)).thenReturn(classPage);

        Page<ScheduledClassResponse> result = service.findAll(academyId, null, null, pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());

        verify(repository).findAllByAcademyId(academyId, pageable);
        verify(repository, never()).findAllByAcademyIdAndStartTimeBetween(any(), any(), any(), any());
    }

    // -------------------------------------------------------
    // findById
    // -------------------------------------------------------

    @Test
    @DisplayName("findById should return the response when class exists and belongs to academy")
    void findById_whenFound_shouldReturnResponse() {
        ScheduledClass scheduledClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        scheduledClass.setId(classId);
        when(repository.findById(classId)).thenReturn(Optional.of(scheduledClass));

        ScheduledClassResponse result = service.findById(academyId, classId);

        assertNotNull(result);
        assertEquals(classId, result.id());
        assertEquals(academyId, result.academyId());
        assertEquals("Gracie Barra", result.academyName());
        assertEquals(ClassType.REGULAR, result.classType());
        assertEquals(TrainingType.GI, result.trainingType());
        assertEquals(ClassStatus.PUBLISHED, result.status());
        assertNotNull(result.instructor());
        assertEquals("John", result.instructor().name());
    }

    @Test
    @DisplayName("findById should throw ResourceNotFoundException when class not found")
    void findById_whenNotFound_shouldThrow() {
        when(repository.findById(classId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(academyId, classId));
    }

    @Test
    @DisplayName("findById should throw BusinessRuleException when class belongs to another academy")
    void findById_whenAcademyMismatch_shouldThrow() {
        ScheduledClass scheduledClass = buildScheduledClass(ClassStatus.PUBLISHED, List.of(technique));
        when(repository.findById(classId)).thenReturn(Optional.of(scheduledClass));

        UUID otherAcademy = UUID.randomUUID();
        assertThrows(BusinessRuleException.class, () -> service.findById(otherAcademy, classId));
    }

    // -------------------------------------------------------
    // helpers
    // -------------------------------------------------------

    private ScheduledClass buildScheduledClass(ClassStatus status, List<Technique> techniques) {
        return ScheduledClass.builder()
                .academy(academy)
                .instructor(instructor)
                .startTime(startTime)
                .duration(Duration.ofMinutes(90))
                .classType(ClassType.REGULAR)
                .trainingType(TrainingType.GI)
                .scheduledTechniques(techniques)
                .status(status)
                .build();
    }
}