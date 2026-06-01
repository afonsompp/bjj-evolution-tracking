package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.AcademySecurity;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassResponse;
import com.bjj.evolution.academy.clazz.service.ScheduledClassService;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ScheduledClassControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ScheduledClassService scheduledClassService;

    @MockitoBean
    private AcademySecurity academySecurity;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private static final String TOKEN = "test-jwt-token";

    private static final Jwt MOCK_JWT = Jwt.withTokenValue("mock-jwt")
            .header("alg", "RS256")
            .claim("sub", UUID.randomUUID().toString())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();

    private UUID academyId;
    private Long classId;
    private ProfileResponse instructorResponse;
    private TechniqueResponse techniqueResponse;
    private ScheduledClassResponse sampleResponse;

    @BeforeEach
    void setUp() {
        academyId = UUID.randomUUID();
        classId = 1L;

        instructorResponse = new ProfileResponse(
                UUID.randomUUID(), "John", "Danaher",
                "johnny", null, null, LocalDate.of(2020, 1, 1), null, UserRole.CUSTOMER
        );

        techniqueResponse = new TechniqueResponse(
                1L, "Armbar", "Juji Gatame",
                TechniqueType.SUBMISSION, TechniqueTarget.ARM
        );

        sampleResponse = new ScheduledClassResponse(
                classId, academyId, "Gracie Barra",
                instructorResponse,
                Instant.parse("2026-06-01T10:00:00Z"),
                90, ClassType.REGULAR, TrainingType.GI,
                List.of(techniqueResponse), ClassStatus.PUBLISHED
        );

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    // -------------------------------------------------------
    // POST /academies/{academyId}/classes — create
    // -------------------------------------------------------

    @Test
    @DisplayName("POST should return 201 when created successfully")
    void create_shouldReturn201() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(scheduledClassService.createManualClass(any(ScheduledClassRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/academies/{academyId}/classes", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "academyId": "%s",
                                    "instructorId": "%s",
                                    "startTime": "2026-06-01T10:00:00Z",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(academyId, instructorResponse.id())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(classId))
                .andExpect(jsonPath("$.academyId").value(academyId.toString()))
                .andExpect(jsonPath("$.academyName").value("Gracie Barra"))
                .andExpect(jsonPath("$.classType").value("REGULAR"))
                .andExpect(jsonPath("$.trainingType").value("GI"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"));

        verify(scheduledClassService).createManualClass(any(ScheduledClassRequest.class));
    }

    @Test
    @DisplayName("POST should return 400 when academyId in path does not match request body")
    void create_whenAcademyIdMismatch_shouldReturn400() throws Exception {
        UUID otherAcademy = UUID.randomUUID();
        when(academySecurity.isInstructorOrAdmin(any(), eq(otherAcademy))).thenReturn(true);

        mockMvc.perform(post("/api/v1/academies/{academyId}/classes", otherAcademy)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "academyId": "%s",
                                    "instructorId": "%s",
                                    "startTime": "2026-06-01T10:00:00Z",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(academyId, instructorResponse.id())))
                .andExpect(status().isBadRequest());

        verify(scheduledClassService, never()).createManualClass(any());
    }

    @Test
    @DisplayName("POST should return 400 when request body is invalid")
    void create_whenInvalidBody_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/academies/{academyId}/classes", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "academyId": "%s",
                                    "instructorId": "%s",
                                    "startTime": null,
                                    "durationMinutes": -1,
                                    "classType": null,
                                    "trainingType": null
                                }
                                """.formatted(academyId, instructorResponse.id())))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST should return 403 when user is not instructor or admin")
    void create_whenNotAuthorized_shouldReturn403() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(post("/api/v1/academies/{academyId}/classes", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "academyId": "%s",
                                    "instructorId": "%s",
                                    "startTime": "2026-06-01T10:00:00Z",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(academyId, instructorResponse.id())))
                .andExpect(status().isForbidden());

        verify(scheduledClassService, never()).createManualClass(any());
    }

    // -------------------------------------------------------
    // PUT /academies/{academyId}/classes/{classId} — update
    // -------------------------------------------------------

    @Test
    @DisplayName("PUT should return 200 when updated successfully")
    void update_shouldReturn200() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(scheduledClassService.update(eq(classId), any(ScheduledClassRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(put("/api/v1/academies/{academyId}/classes/{classId}", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "academyId": "%s",
                                    "instructorId": "%s",
                                    "startTime": "2026-06-01T10:00:00Z",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(academyId, instructorResponse.id())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(classId))
                .andExpect(jsonPath("$.academyName").value("Gracie Barra"));

        verify(scheduledClassService).update(eq(classId), any(ScheduledClassRequest.class));
    }

    @Test
    @DisplayName("PUT should return 404 when class not found")
    void update_whenNotFound_shouldReturn404() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(scheduledClassService.update(eq(classId), any(ScheduledClassRequest.class)))
                .thenThrow(new ResourceNotFoundException("Class", classId));

        mockMvc.perform(put("/api/v1/academies/{academyId}/classes/{classId}", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "academyId": "%s",
                                    "instructorId": "%s",
                                    "startTime": "2026-06-01T10:00:00Z",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(academyId, instructorResponse.id())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Class not found with id: " + classId));

        verify(scheduledClassService).update(eq(classId), any(ScheduledClassRequest.class));
    }

    // -------------------------------------------------------
    // PATCH /academies/{academyId}/classes/{classId}/cancel
    // -------------------------------------------------------

    @Test
    @DisplayName("PATCH cancel should return 204 when canceled successfully")
    void cancel_shouldReturn204() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        doNothing().when(scheduledClassService).cancel(classId);

        mockMvc.perform(patch("/api/v1/academies/{academyId}/classes/{classId}/cancel", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNoContent());

        verify(scheduledClassService).cancel(classId);
    }

    @Test
    @DisplayName("PATCH cancel should return 404 when class not found")
    void cancel_whenNotFound_shouldReturn404() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        doThrow(new ResourceNotFoundException("Class", classId))
                .when(scheduledClassService).cancel(classId);

        mockMvc.perform(patch("/api/v1/academies/{academyId}/classes/{classId}/cancel", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Class not found with id: " + classId));

        verify(scheduledClassService).cancel(classId);
    }

    @Test
    @DisplayName("PATCH cancel should return 422 when class is already completed")
    void cancel_whenAlreadyCompleted_shouldReturn422() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        doThrow(new BusinessRuleException("Cannot cancel a class that is already completed."))
                .when(scheduledClassService).cancel(classId);

        mockMvc.perform(patch("/api/v1/academies/{academyId}/classes/{classId}/cancel", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Cannot cancel a class that is already completed."));
    }

    // -------------------------------------------------------
    // GET /academies/{academyId}/classes — list
    // -------------------------------------------------------

    @Test
    @DisplayName("GET should return paginated classes with date range")
    void getAll_withDateRange_shouldReturnPage() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        Page<ScheduledClassResponse> page = new PageImpl<>(
                List.of(sampleResponse), PageRequest.of(0, 20), 1);
        when(scheduledClassService.findAll(eq(academyId), any(Instant.class), any(Instant.class), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/academies/{academyId}/classes", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("startDate", "2026-06-01")
                        .param("endDate", "2026-06-30")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(classId))
                .andExpect(jsonPath("$.content[0].academyName").value("Gracie Barra"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(scheduledClassService).findAll(eq(academyId), any(Instant.class), any(Instant.class), any());
    }

    @Test
    @DisplayName("GET should return paginated classes without date range")
    void getAll_withoutDateRange_shouldReturnPage() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        Page<ScheduledClassResponse> page = new PageImpl<>(
                List.of(sampleResponse), PageRequest.of(0, 20), 1);
        when(scheduledClassService.findAll(eq(academyId), isNull(), isNull(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/api/v1/academies/{academyId}/classes", academyId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(classId))
                .andExpect(jsonPath("$.content[0].classType").value("REGULAR"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(scheduledClassService).findAll(eq(academyId), isNull(), isNull(), any());
    }

    @Test
    @DisplayName("GET should return 403 when user has no access to the academy")
    void getAll_whenNoAccess_shouldReturn403() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(get("/api/v1/academies/{academyId}/classes", academyId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden());

        verify(scheduledClassService, never()).findAll(any(), any(), any(), any());
    }

    // -------------------------------------------------------
    // GET /academies/{academyId}/classes/{classId} — by id
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /classes/{classId} should return 200 when found")
    void getById_whenFound_shouldReturn200() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        when(scheduledClassService.findById(academyId, classId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/academies/{academyId}/classes/{classId}", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(classId))
                .andExpect(jsonPath("$.academyName").value("Gracie Barra"))
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.instructor.name").value("John"))
                .andExpect(jsonPath("$.instructor.nickname").value("johnny"))
                .andExpect(jsonPath("$.scheduledTechniques[0].name").value("Armbar"));

        verify(scheduledClassService).findById(academyId, classId);
    }

    @Test
    @DisplayName("GET /classes/{classId} should return 404 when not found")
    void getById_whenNotFound_shouldReturn404() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        when(scheduledClassService.findById(academyId, classId))
                .thenThrow(new ResourceNotFoundException("Class", classId));

        mockMvc.perform(get("/api/v1/academies/{academyId}/classes/{classId}", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Class not found with id: " + classId));

        verify(scheduledClassService).findById(academyId, classId);
    }

    @Test
    @DisplayName("GET /classes/{classId} should return 422 when class belongs to another academy")
    void getById_whenAcademyMismatch_shouldReturn422() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        when(scheduledClassService.findById(academyId, classId))
                .thenThrow(new BusinessRuleException("Class does not belong to the given academy."));

        mockMvc.perform(get("/api/v1/academies/{academyId}/classes/{classId}", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.message").value("Class does not belong to the given academy."));

        verify(scheduledClassService).findById(academyId, classId);
    }

    @Test
    @DisplayName("GET /classes/{classId} should return 403 when user has no access")
    void getById_whenNoAccess_shouldReturn403() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(get("/api/v1/academies/{academyId}/classes/{classId}", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden());

        verify(scheduledClassService, never()).findById(any(), anyLong());
    }
}