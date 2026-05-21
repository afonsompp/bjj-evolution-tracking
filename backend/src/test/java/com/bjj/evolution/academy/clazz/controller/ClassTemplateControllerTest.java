package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.AcademySecurity;
import com.bjj.evolution.academy.clazz.domain.dto.ClassRecurrenceRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateResponse;
import com.bjj.evolution.academy.clazz.service.ClassTemplateService;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
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

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class ClassTemplateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClassTemplateService classTemplateService;

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
    private UUID templateId;
    private ProfileResponse instructorResponse;
    private TechniqueResponse techniqueResponse;
    private ClassTemplateResponse sampleResponse;

    @BeforeEach
    void setUp() {
        academyId = UUID.randomUUID();
        templateId = UUID.randomUUID();

        instructorResponse = new ProfileResponse(
                UUID.randomUUID(), "John", "Danaher",
                "johnny", null, null, LocalDate.of(2020, 1, 1), UserRole.CUSTOMER
        );

        techniqueResponse = new TechniqueResponse(
                1L, "Armbar", "Juji Gatame",
                TechniqueType.SUBMISSION, TechniqueTarget.ARM
        );

        sampleResponse = new ClassTemplateResponse(
                templateId, "Morning Class", instructorResponse,
                90L, ClassType.REGULAR, TrainingType.GI,
                List.of(techniqueResponse),
                List.of(new ClassRecurrenceRequest(DayOfWeek.MONDAY, LocalTime.of(7, 0)))
        );

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    // -------------------------------------------------------
    // POST /academies/{academyId}/templates — create
    // -------------------------------------------------------

    @Test
    @DisplayName("POST should return 201 when created successfully")
    void create_shouldReturn201() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(classTemplateService.create(eq(academyId), any(ClassTemplateRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/academies/{academyId}/templates", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Morning Class",
                                    "instructorId": "%s",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(instructorResponse.id())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(templateId.toString()))
                .andExpect(jsonPath("$.name").value("Morning Class"))
                .andExpect(jsonPath("$.classType").value("REGULAR"))
                .andExpect(jsonPath("$.trainingType").value("GI"))
                .andExpect(jsonPath("$.durationMinutes").value(90))
                .andExpect(jsonPath("$.instructor.name").value("John"))
                .andExpect(jsonPath("$.techniques[0].name").value("Armbar"));

        verify(classTemplateService).create(eq(academyId), any(ClassTemplateRequest.class));
    }

    @Test
    @DisplayName("POST should return 400 when request body is invalid")
    void create_whenInvalidBody_shouldReturn400() throws Exception {
        mockMvc.perform(post("/academies/{academyId}/templates", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "",
                                    "instructorId": null,
                                    "durationMinutes": -1,
                                    "classType": null,
                                    "trainingType": null
                                }
                                """))
                .andExpect(status().isBadRequest());

        verify(classTemplateService, never()).create(any(), any());
    }

    @Test
    @DisplayName("POST should return 403 when user is not instructor or admin")
    void create_whenNotAuthorized_shouldReturn403() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(post("/academies/{academyId}/templates", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Morning Class",
                                    "instructorId": "%s",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(instructorResponse.id())))
                .andExpect(status().isForbidden());

        verify(classTemplateService, never()).create(any(), any());
    }

    @Test
    @DisplayName("POST should return 201 with recurrence rules")
    void create_withRecurrence_shouldReturn201() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(classTemplateService.create(eq(academyId), any(ClassTemplateRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/academies/{academyId}/templates", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Morning Class",
                                    "instructorId": "%s",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI",
                                    "recurrenceRules": [
                                        {"dayOfWeek": "MONDAY", "startTime": "07:00:00"},
                                        {"dayOfWeek": "WEDNESDAY", "startTime": "07:00:00"}
                                    ]
                                }
                                """.formatted(instructorResponse.id())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.recurrenceRules[0].dayOfWeek").value("MONDAY"));

        verify(classTemplateService).create(eq(academyId), any(ClassTemplateRequest.class));
    }

    // -------------------------------------------------------
    // GET /academies/{academyId}/templates — list
    // -------------------------------------------------------

    @Test
    @DisplayName("GET should return paginated templates")
    void getAll_shouldReturnPage() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        Page<ClassTemplateResponse> page = new PageImpl<>(
                List.of(sampleResponse), PageRequest.of(0, 20), 1);
        when(classTemplateService.findAll(eq(academyId), any())).thenReturn(page);

        mockMvc.perform(get("/academies/{academyId}/templates", academyId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(templateId.toString()))
                .andExpect(jsonPath("$.content[0].name").value("Morning Class"))
                .andExpect(jsonPath("$.content[0].classType").value("REGULAR"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(classTemplateService).findAll(eq(academyId), any());
    }

    @Test
    @DisplayName("GET should return 403 when user has no access to academy")
    void getAll_whenNoAccess_shouldReturn403() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(get("/academies/{academyId}/templates", academyId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden());

        verify(classTemplateService, never()).findAll(any(), any());
    }

    // -------------------------------------------------------
    // PUT /academies/{academyId}/templates/{templateId} — update
    // -------------------------------------------------------

    @Test
    @DisplayName("PUT should return 200 when updated successfully")
    void update_shouldReturn200() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(classTemplateService.update(eq(templateId), any(ClassTemplateRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(put("/academies/{academyId}/templates/{templateId}", academyId, templateId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Morning Class",
                                    "instructorId": "%s",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(instructorResponse.id())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(templateId.toString()))
                .andExpect(jsonPath("$.name").value("Morning Class"));

        verify(classTemplateService).update(eq(templateId), any(ClassTemplateRequest.class));
    }

    @Test
    @DisplayName("PUT should return 404 when template not found")
    void update_whenNotFound_shouldReturn404() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(classTemplateService.update(eq(templateId), any(ClassTemplateRequest.class)))
                .thenThrow(new ResourceNotFoundException("Class template", templateId));

        mockMvc.perform(put("/academies/{academyId}/templates/{templateId}", academyId, templateId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Morning Class",
                                    "instructorId": "%s",
                                    "durationMinutes": 90,
                                    "classType": "REGULAR",
                                    "trainingType": "GI"
                                }
                                """.formatted(instructorResponse.id())))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Class template not found with id: " + templateId));

        verify(classTemplateService).update(eq(templateId), any(ClassTemplateRequest.class));
    }

    // -------------------------------------------------------
    // DELETE /academies/{academyId}/templates/{templateId} — delete
    // -------------------------------------------------------

    @Test
    @DisplayName("DELETE should return 204 when deleted successfully")
    void delete_shouldReturn204() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        doNothing().when(classTemplateService).delete(templateId);

        mockMvc.perform(delete("/academies/{academyId}/templates/{templateId}", academyId, templateId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNoContent());

        verify(classTemplateService).delete(templateId);
    }

    @Test
    @DisplayName("DELETE should return 404 when template not found")
    void delete_whenNotFound_shouldReturn404() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        doThrow(new ResourceNotFoundException("Class template", templateId))
                .when(classTemplateService).delete(templateId);

        mockMvc.perform(delete("/academies/{academyId}/templates/{templateId}", academyId, templateId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Class template not found with id: " + templateId));

        verify(classTemplateService).delete(templateId);
    }
}