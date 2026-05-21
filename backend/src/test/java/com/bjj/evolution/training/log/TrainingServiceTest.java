package com.bjj.evolution.training.log;

import com.bjj.evolution.catalog.TechniqueRepository;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.Technique;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.training.log.domain.Rating;
import com.bjj.evolution.training.log.domain.Training;
import com.bjj.evolution.training.log.domain.dto.TrainingRequest;
import com.bjj.evolution.training.log.domain.dto.TrainingResponse;
import com.bjj.evolution.training.log.domain.dto.TrainingStatsResponse;
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
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TrainingServiceTest {

    @Mock
    private TrainingRepository trainingRepository;

    @Mock
    private TechniqueRepository techniqueRepository;

    @Mock
    private UserProfileRepository userProfileRepository;

    @InjectMocks
    private TrainingService service;

    @Captor
    private ArgumentCaptor<Training> trainingCaptor;

    private UUID userId;
    private Long trainingId;
    private UserProfile profile;
    private Technique technique;
    private TrainingRequest request;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        trainingId = 1L;

        profile = new UserProfile(userId, "John", "Danaher", "johnny",
                null, null, LocalDate.of(2020, 1, 1), UserRole.CUSTOMER);

        technique = new Technique(1L, "Armbar", "Juji Gatame", TechniqueType.SUBMISSION, TechniqueTarget.ARM);

        request = new TrainingRequest(
                ClassType.REGULAR, TrainingType.GI,
                LocalDateTime.of(2026, 6, 1, 10, 0),
                90,
                List.of(1L),                // techniqueIds
                List.of(2L),                // submissionTechniqueIds
                List.of(3L),                // submissionTechniqueAllowedIds
                5,                          // totalRolls
                "Good session",             // description
                7,                          // roundLengthMinutes
                2,                          // restLengthMinutes
                4,                          // cardioRating
                3,                          // intensityRating
                2,                          // taps
                3,                          // submissions
                1,                          // escapes
                2,                          // sweeps
                1,                          // takedowns
                2,                          // guardPasses
                Duration.ofMinutes(90)      // duration
        );
    }

    // -------------------------------------------------------
    // create
    // -------------------------------------------------------

    @Test
    @DisplayName("create should save and return a TrainingResponse")
    void create_shouldSaveAndReturnResponse() {
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(techniqueRepository.findAllById(List.of(1L))).thenReturn(List.of(technique));
        when(techniqueRepository.findAllById(List.of(2L))).thenReturn(List.of(technique));
        when(techniqueRepository.findAllById(List.of(3L))).thenReturn(List.of(technique));

        Training savedTraining = buildTraining(trainingId);
        when(trainingRepository.save(any(Training.class))).thenReturn(savedTraining);

        TrainingResponse result = service.create(request, userId);

        assertNotNull(result);
        assertEquals(trainingId, result.id());
        assertEquals(ClassType.REGULAR, result.classType());
        assertEquals(TrainingType.GI, result.trainingType());
        assertEquals(5, result.totalRolls());
        assertEquals(4, result.cardioRating());
        assertEquals(3, result.intensityRating());
        assertNotNull(result.profile());
        assertEquals("John", result.profile().name());

        verify(trainingRepository).save(trainingCaptor.capture());
        Training captured = trainingCaptor.getValue();
        assertEquals(profile, captured.getUserProfile());
        assertEquals(ClassType.REGULAR, captured.getClassType());
    }

    @Test
    @DisplayName("create should throw ResourceNotFoundException when user not found")
    void create_whenUserNotFound_shouldThrow() {
        when(userProfileRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.create(request, userId));
        verify(trainingRepository, never()).save(any());
    }

    @Test
    @DisplayName("create should throw ResourceNotFoundException when technique not found")
    void create_whenTechniqueNotFound_shouldThrow() {
        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));
        when(techniqueRepository.findAllById(List.of(1L))).thenReturn(List.of());

        assertThrows(ResourceNotFoundException.class, () -> service.create(request, userId));
        verify(trainingRepository, never()).save(any());
    }

    @Test
    @DisplayName("create should create training with null technique lists")
    void create_withNullTechniqueLists_shouldCreate() {
        TrainingRequest requestNoTechs = new TrainingRequest(
                ClassType.REGULAR, TrainingType.GI,
                LocalDateTime.of(2026, 6, 1, 10, 0),
                90,
                null, null, null,
                5, "Good session", 7, 2,
                4, 3, 2, 3, 1, 2, 1, 2,
                Duration.ofMinutes(90)
        );

        when(userProfileRepository.findById(userId)).thenReturn(Optional.of(profile));

        Training savedTraining = Training.builder()
                .id(trainingId)
                .userProfile(profile)
                .classType(ClassType.REGULAR)
                .trainingType(TrainingType.GI)
                .sessionDate(LocalDateTime.of(2026, 6, 1, 10, 0))
                .durationMinutes(90)
                .technique(List.of())
                .submissionsTechniques(List.of())
                .submissionsTechniquesAllowed(List.of())
                .totalRolls(5)
                .roundLengthMinutes(7)
                .restLengthMinutes(2)
                .cardioRating(Rating.of(4))
                .intensityRating(Rating.of(3))
                .taps(2)
                .submissions(3)
                .escapes(1)
                .sweeps(2)
                .takedowns(1)
                .guardPasses(2)
                .description("Good session")
                .build();
        when(trainingRepository.save(any(Training.class))).thenReturn(savedTraining);

        TrainingResponse result = service.create(requestNoTechs, userId);

        assertNotNull(result);
        assertEquals(trainingId, result.id());
        assertTrue(result.techniques().isEmpty());
        assertTrue(result.submissionTechniques().isEmpty());
        assertTrue(result.submissionTechniquesAllowed().isEmpty());
    }

    // -------------------------------------------------------
    // findAll
    // -------------------------------------------------------

    @Test
    @DisplayName("findAll with date range should call between query")
    void findAll_withDateRange_shouldCallBetweenQuery() {
        LocalDateTime start = LocalDateTime.of(2026, 6, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 6, 30, 23, 59);
        Pageable pageable = PageRequest.of(0, 10);

        Training training = buildTraining(trainingId);
        Page<Training> trainingPage = new PageImpl<>(List.of(training));

        when(trainingRepository.findAllByUserProfileIdAndSessionDateBetween(userId, start, end, pageable))
                .thenReturn(trainingPage);

        Page<TrainingResponse> result = service.findAll(userId, start, end, pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());
        assertEquals(trainingId, result.getContent().get(0).id());

        verify(trainingRepository).findAllByUserProfileIdAndSessionDateBetween(userId, start, end, pageable);
        verify(trainingRepository, never()).findAllByUserProfileId(any(), any());
    }

    @Test
    @DisplayName("findAll without date range should call findAllByUserProfileId")
    void findAll_withoutDateRange_shouldCallByUserQuery() {
        Pageable pageable = PageRequest.of(0, 10);

        Training training = buildTraining(trainingId);
        Page<Training> trainingPage = new PageImpl<>(List.of(training));

        when(trainingRepository.findAllByUserProfileId(userId, pageable)).thenReturn(trainingPage);

        Page<TrainingResponse> result = service.findAll(userId, null, null, pageable);

        assertFalse(result.isEmpty());
        assertEquals(1, result.getTotalElements());

        verify(trainingRepository).findAllByUserProfileId(userId, pageable);
        verify(trainingRepository, never()).findAllByUserProfileIdAndSessionDateBetween(any(), any(), any(), any());
    }

    @Test
    @DisplayName("findAll should return empty page when no trainings")
    void findAll_whenNoTrainings_shouldReturnEmptyPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(trainingRepository.findAllByUserProfileId(userId, pageable))
                .thenReturn(Page.empty());

        Page<TrainingResponse> result = service.findAll(userId, null, null, pageable);

        assertTrue(result.isEmpty());
    }

    // -------------------------------------------------------
    // findById
    // -------------------------------------------------------

    @Test
    @DisplayName("findById should return TrainingResponse when found and owned by user")
    void findById_whenFound_shouldReturnResponse() {
        Training training = buildTraining(trainingId);
        when(trainingRepository.findByIdAndUserProfileId(trainingId, userId))
                .thenReturn(Optional.of(training));

        TrainingResponse result = service.findById(trainingId, userId);

        assertNotNull(result);
        assertEquals(trainingId, result.id());
        assertEquals(ClassType.REGULAR, result.classType());

        verify(trainingRepository).findByIdAndUserProfileId(trainingId, userId);
    }

    @Test
    @DisplayName("findById should throw ResourceNotFoundException when not found")
    void findById_whenNotFound_shouldThrow() {
        when(trainingRepository.findByIdAndUserProfileId(trainingId, userId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(trainingId, userId));
    }

    @Test
    @DisplayName("findById should throw ResourceNotFoundException when training belongs to another user")
    void findById_whenNotOwned_shouldThrow() {
        UUID otherUser = UUID.randomUUID();
        when(trainingRepository.findByIdAndUserProfileId(trainingId, otherUser))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.findById(trainingId, otherUser));
    }

    // -------------------------------------------------------
    // update
    // -------------------------------------------------------

    @Test
    @DisplayName("update should update and return TrainingResponse")
    void update_shouldUpdateAndReturnResponse() {
        Training existingTraining = buildTraining(trainingId);
        when(trainingRepository.findByIdAndUserProfileId(trainingId, userId))
                .thenReturn(Optional.of(existingTraining));
        when(techniqueRepository.findAllById(List.of(1L))).thenReturn(List.of(technique));
        when(techniqueRepository.findAllById(List.of(2L))).thenReturn(List.of(technique));
        when(techniqueRepository.findAllById(List.of(3L))).thenReturn(List.of(technique));

        Training updatedTraining = buildTraining(trainingId);
        when(trainingRepository.save(any(Training.class))).thenReturn(updatedTraining);

        TrainingResponse result = service.update(trainingId, request, userId);

        assertNotNull(result);
        assertEquals(trainingId, result.id());
        verify(trainingRepository).save(any(Training.class));
    }

    @Test
    @DisplayName("update should throw ResourceNotFoundException when training not found or not owned")
    void update_whenNotFound_shouldThrow() {
        when(trainingRepository.findByIdAndUserProfileId(trainingId, userId))
                .thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> service.update(trainingId, request, userId));
        verify(trainingRepository, never()).save(any());
    }

    // -------------------------------------------------------
    // delete
    // -------------------------------------------------------

    @Test
    @DisplayName("delete should call deleteById when training exists and is owned")
    void delete_whenFound_shouldDelete() {
        when(trainingRepository.existsByIdAndUserProfileId(trainingId, userId)).thenReturn(true);

        service.delete(trainingId, userId);

        verify(trainingRepository).deleteById(trainingId);
    }

    @Test
    @DisplayName("delete should throw ResourceNotFoundException when not found or not owned")
    void delete_whenNotFound_shouldThrow() {
        when(trainingRepository.existsByIdAndUserProfileId(trainingId, userId)).thenReturn(false);

        assertThrows(ResourceNotFoundException.class, () -> service.delete(trainingId, userId));
        verify(trainingRepository, never()).deleteById(anyLong());
    }

    // -------------------------------------------------------
    // getStats
    // -------------------------------------------------------

    @Test
    @DisplayName("getStats should return stats from repository projection")
    void getStats_shouldReturnStats() {
        LocalDateTime start = LocalDateTime.of(2026, 1, 1, 0, 0);
        LocalDateTime end = LocalDateTime.of(2026, 12, 31, 23, 59);

        Object[] projection = new Object[]{
                10L,              // [0] count
                20L,              // [1] total taps
                15L,              // [2] total submissions
                5L,               // [3] total escapes
                8L,               // [4] total sweeps
                3L,               // [5] total takedowns
                12L,              // [6] total guard passes
                40L,              // [7] total rolls
                3.5,              // [8] avg cardio rating
                2.8,              // [9] avg intensity rating
                90L               // [10] total duration in minutes
        };

        when(trainingRepository.computeStats(userId, start, end)).thenReturn(List.<Object[]>of(projection));

        TrainingStatsResponse stats = service.getStats(userId, start, end);

        assertEquals(10, stats.totalSessions());
        assertEquals(20, stats.totalTaps());
        assertEquals(15, stats.totalSubmissions());
        assertEquals(5, stats.totalEscapes());
        assertEquals(8, stats.totalSweeps());
        assertEquals(3, stats.totalTakedowns());
        assertEquals(12, stats.totalGuardPasses());
        assertEquals(40, stats.totalRolls());
        assertEquals(3.5, stats.avgCardioRating());
        assertEquals(2.8, stats.avgIntensityRating());
        assertEquals(90, stats.totalMinutes());

        verify(trainingRepository).computeStats(userId, start, end);
    }

    @Test
    @DisplayName("getStats should handle null projection fields")
    void getStats_withNullFields_shouldReturnDefaults() {
        Object[] nullProjection = new Object[]{null, null, null, null, null, null, null, null, null, null, null};

        when(trainingRepository.computeStats(any(UUID.class), any(), any())).thenReturn(List.<Object[]>of(nullProjection));

        TrainingStatsResponse stats = service.getStats(userId, null, null);

        assertEquals(0, stats.totalSessions());
        assertEquals(0, stats.totalTaps());
        assertEquals(0, stats.totalMinutes());
        assertEquals(0.0, stats.avgCardioRating());
    }

    // -------------------------------------------------------
    // helpers
    // -------------------------------------------------------

    private Training buildTraining(Long id) {
        return Training.builder()
                .id(id)
                .userProfile(profile)
                .classType(ClassType.REGULAR)
                .trainingType(TrainingType.GI)
                .sessionDate(LocalDateTime.of(2026, 6, 1, 10, 0))
                .durationMinutes(90)
                .technique(List.of(technique))
                .submissionsTechniques(List.of(technique))
                .submissionsTechniquesAllowed(List.of(technique))
                .totalRolls(5)
                .roundLengthMinutes(7)
                .restLengthMinutes(2)
                .cardioRating(Rating.of(4))
                .intensityRating(Rating.of(3))
                .taps(2)
                .submissions(3)
                .escapes(1)
                .sweeps(2)
                .takedowns(1)
                .guardPasses(2)
                .description("Good session")
                .build();
    }
}