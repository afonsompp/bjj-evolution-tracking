package com.bjj.evolution.training.log;

import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.training.log.domain.dto.TechniqueSummaryResponse;
import com.bjj.evolution.training.log.domain.dto.TrainingRequest;
import com.bjj.evolution.training.log.domain.dto.TrainingResponse;
import com.bjj.evolution.user.domain.UserRole;
import com.bjj.evolution.user.domain.dto.ProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class TrainingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TrainingService trainingService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private static final String TOKEN = "test-jwt-token";

    private static final String USER_SUB = UUID.randomUUID().toString();

    private static final Jwt MOCK_JWT = Jwt.withTokenValue("mock-jwt")
            .header("alg", "RS256")
            .claim("sub", USER_SUB)
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();

    private Long trainingId;
    private TrainingResponse sampleResponse;
    private ProfileResponse sampleProfile;

    @BeforeEach
    void setUp() {
        trainingId = 1L;

        UUID profileId = UUID.fromString(USER_SUB);
        sampleProfile = new ProfileResponse(
                profileId, "John", "Doe", "jiujitsu_john",
                null, 0, LocalDate.of(2023, 1, 15),
                UserRole.CUSTOMER
        );

        TechniqueSummaryResponse guard = new TechniqueSummaryResponse(1L, "Closed Guard");
        TechniqueSummaryResponse armbar = new TechniqueSummaryResponse(2L, "Armbar");

        sampleResponse = new TrainingResponse(
                trainingId,
                ClassType.REGULAR,
                TrainingType.GI,
                LocalDateTime.of(2025, 5, 17, 10, 0),
                60L,
                List.of(guard),
                List.of(armbar),
                List.of(),
                3,
                5L,
                1L,
                4,
                4,
                0, 1, 2, 1, 0, 3,
                sampleProfile,
                "Great session focusing on guard retention."
        );

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    // -------------------------------------------------------
    // POST /trainings — create
    // -------------------------------------------------------

    @Test
    @DisplayName("POST /trainings should return 201 when created successfully")
    void create_shouldReturn201() throws Exception {
        when(trainingService.create(any(TrainingRequest.class), any(UUID.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/trainings")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classType": "REGULAR",
                                    "trainingType": "GI",
                                    "sessionDate": "2025-05-17T10:00:00",
                                    "durationMinutes": 60,
                                    "techniqueIds": [1],
                                    "submissionTechniqueIds": [2],
                                    "submissionTechniqueAllowedIds": [],
                                    "totalRolls": 3,
                                    "roundLengthMinutes": 5,
                                    "restLengthMinutes": 1,
                                    "cardioRating": 4,
                                    "intensityRating": 4,
                                    "taps": 0,
                                    "submissions": 1,
                                    "escapes": 2,
                                    "sweeps": 1,
                                    "takedowns": 0,
                                    "guardPasses": 3,
                                    "description": "Great session focusing on guard retention."
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.classType").value("REGULAR"))
                .andExpect(jsonPath("$.trainingType").value("GI"))
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.techniques[0].name").value("Closed Guard"))
                .andExpect(jsonPath("$.submissionTechniques[0].name").value("Armbar"))
                .andExpect(jsonPath("$.totalRolls").value(3))
                .andExpect(jsonPath("$.cardioRating").value(4))
                .andExpect(jsonPath("$.intensityRating").value(4))
                .andExpect(jsonPath("$.submissions").value(1))
                .andExpect(jsonPath("$.escapes").value(2))
                .andExpect(jsonPath("$.guardPasses").value(3))
                .andExpect(jsonPath("$.profile.nickname").value("jiujitsu_john"));

        verify(trainingService).create(any(TrainingRequest.class), any(UUID.class));
    }

    @Test
    @DisplayName("POST /trainings should return 400 when required fields are missing")
    void create_whenInvalidBody_shouldReturn400() throws Exception {
        mockMvc.perform(post("/trainings")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classType": "REGULAR",
                                    "trainingType": "GI",
                                    "durationMinutes": 60,
                                    "totalRolls": 3
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(trainingService, never()).create(any(), any());
    }

    @Test
    @DisplayName("POST /trainings should return 400 when rating is out of range")
    void create_whenRatingOutOfRange_shouldReturn400() throws Exception {
        mockMvc.perform(post("/trainings")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classType": "REGULAR",
                                    "trainingType": "GI",
                                    "sessionDate": "2025-05-17T10:00:00",
                                    "durationMinutes": 60,
                                    "totalRolls": 3,
                                    "roundLengthMinutes": 5,
                                    "restLengthMinutes": 1,
                                    "cardioRating": 6,
                                    "intensityRating": 4,
                                    "taps": 0,
                                    "submissions": 1,
                                    "escapes": 2,
                                    "sweeps": 1,
                                    "takedowns": 0,
                                    "guardPasses": 3
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(trainingService, never()).create(any(), any());
    }

    @Test
    @DisplayName("POST /trainings should return 404 when user profile not found")
    void create_whenUserNotFound_shouldReturn404() throws Exception {
        when(trainingService.create(any(TrainingRequest.class), any(UUID.class)))
                .thenThrow(new ResourceNotFoundException("User", UUID.fromString(USER_SUB)));

        mockMvc.perform(post("/trainings")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TRAINING_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("User not found with id: " + USER_SUB));

        verify(trainingService).create(any(TrainingRequest.class), any(UUID.class));
    }

    // -------------------------------------------------------
    // GET /trainings — list my trainings
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /trainings should return paginated results without filters")
    void getAll_withoutFilters_shouldReturnPage() throws Exception {
        Page<TrainingResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 10), 1);
        when(trainingService.findAll(any(UUID.class), isNull(), isNull(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/trainings")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].classType").value("REGULAR"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(trainingService).findAll(any(UUID.class), isNull(), isNull(), any());
    }

    @Test
    @DisplayName("GET /trainings should return paginated results with date filters")
    void getAll_withDateFilters_shouldReturnPage() throws Exception {
        Page<TrainingResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 10), 1);
        when(trainingService.findAll(any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class), any()))
                .thenReturn(page);

        mockMvc.perform(get("/trainings")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("startDate", "2025-05-01T00:00:00")
                        .param("endDate", "2025-05-31T23:59:59"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(trainingService).findAll(any(UUID.class), any(LocalDateTime.class), any(LocalDateTime.class), any());
    }

    @Test
    @DisplayName("GET /trainings should return empty page when no trainings exist")
    void getAll_shouldReturnEmptyPage() throws Exception {
        Page<TrainingResponse> emptyPage = new PageImpl<>(List.of(), PageRequest.of(0, 10), 0);
        when(trainingService.findAll(any(UUID.class), isNull(), isNull(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/trainings")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(trainingService).findAll(any(UUID.class), isNull(), isNull(), any());
    }

    // -------------------------------------------------------
    // GET /trainings/{id} — get by id
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /trainings/{id} should return 200 when training exists")
    void getById_whenFound_shouldReturn200() throws Exception {
        when(trainingService.findById(eq(trainingId), any(UUID.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(get("/trainings/{id}", trainingId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.classType").value("REGULAR"))
                .andExpect(jsonPath("$.durationMinutes").value(60))
                .andExpect(jsonPath("$.description").value("Great session focusing on guard retention."));

        verify(trainingService).findById(eq(trainingId), any(UUID.class));
    }

    @Test
    @DisplayName("GET /trainings/{id} should return 404 when training not found")
    void getById_whenNotFound_shouldReturn404() throws Exception {
        when(trainingService.findById(eq(trainingId), any(UUID.class)))
                .thenThrow(new ResourceNotFoundException("Training", trainingId));

        mockMvc.perform(get("/trainings/{id}", trainingId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Training not found with id: " + trainingId));

        verify(trainingService).findById(eq(trainingId), any(UUID.class));
    }

    // -------------------------------------------------------
    // PUT /trainings/{id} — update
    // -------------------------------------------------------

    @Test
    @DisplayName("PUT /trainings/{id} should return 200 when updated successfully")
    void update_shouldReturn200() throws Exception {
        when(trainingService.update(eq(trainingId), any(TrainingRequest.class), any(UUID.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(put("/trainings/{id}", trainingId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classType": "REGULAR",
                                    "trainingType": "GI",
                                    "sessionDate": "2025-05-17T10:00:00",
                                    "durationMinutes": 90,
                                    "techniqueIds": [1],
                                    "submissionTechniqueIds": [2],
                                    "submissionTechniqueAllowedIds": [],
                                    "totalRolls": 5,
                                    "roundLengthMinutes": 6,
                                    "restLengthMinutes": 1,
                                    "cardioRating": 4,
                                    "intensityRating": 4,
                                    "taps": 0,
                                    "submissions": 1,
                                    "escapes": 2,
                                    "sweeps": 1,
                                    "takedowns": 0,
                                    "guardPasses": 3,
                                    "description": "Great session focusing on guard retention."
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1));

        verify(trainingService).update(eq(trainingId), any(TrainingRequest.class), any(UUID.class));
    }

    @Test
    @DisplayName("PUT /trainings/{id} should return 404 when training not found")
    void update_whenNotFound_shouldReturn404() throws Exception {
        when(trainingService.update(eq(trainingId), any(TrainingRequest.class), any(UUID.class)))
                .thenThrow(new ResourceNotFoundException("Training", trainingId));

        mockMvc.perform(put("/trainings/{id}", trainingId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_TRAINING_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Training not found with id: " + trainingId));

        verify(trainingService).update(eq(trainingId), any(TrainingRequest.class), any(UUID.class));
    }

    @Test
    @DisplayName("PUT /trainings/{id} should return 400 when request body is invalid")
    void update_whenInvalidBody_shouldReturn400() throws Exception {
        mockMvc.perform(put("/trainings/{id}", trainingId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "classType": "REGULAR"
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(trainingService, never()).update(anyLong(), any(), any());
    }

    // -------------------------------------------------------
    // DELETE /trainings/{id} — delete
    // -------------------------------------------------------

    @Test
    @DisplayName("DELETE /trainings/{id} should return 204 when deleted successfully")
    void delete_shouldReturn204() throws Exception {
        doNothing().when(trainingService).delete(eq(trainingId), any(UUID.class));

        mockMvc.perform(delete("/trainings/{id}", trainingId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNoContent());

        verify(trainingService).delete(eq(trainingId), any(UUID.class));
    }

    @Test
    @DisplayName("DELETE /trainings/{id} should return 404 when training not found")
    void delete_whenNotFound_shouldReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Training", trainingId))
                .when(trainingService).delete(eq(trainingId), any(UUID.class));

        mockMvc.perform(delete("/trainings/{id}", trainingId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Training not found with id: " + trainingId));

        verify(trainingService).delete(eq(trainingId), any(UUID.class));
    }

    // -------------------------------------------------------
    // Reusable JSON snippets
    // -------------------------------------------------------

    private static final String VALID_TRAINING_JSON = """
            {
                "classType": "REGULAR",
                "trainingType": "GI",
                "sessionDate": "2025-05-17T10:00:00",
                "durationMinutes": 60,
                "techniqueIds": [1],
                "submissionTechniqueIds": [2],
                "submissionTechniqueAllowedIds": [],
                "totalRolls": 3,
                "roundLengthMinutes": 5,
                "restLengthMinutes": 1,
                "cardioRating": 4,
                "intensityRating": 4,
                "taps": 0,
                "submissions": 1,
                "escapes": 2,
                "sweeps": 1,
                "takedowns": 0,
                "guardPasses": 3,
                "description": "Great session focusing on guard retention."
            }
            """;
}
