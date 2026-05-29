package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.AcademySecurity;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.dto.CheckInResponse;
import com.bjj.evolution.academy.clazz.service.ClassAttendanceService;
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
class ClassAttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClassAttendanceService classAttendanceService;

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
    private UUID studentId;
    private ProfileResponse studentResponse;
    private CheckInResponse sampleResponse;

    @BeforeEach
    void setUp() {
        academyId = UUID.randomUUID();
        classId = 1L;
        studentId = UUID.randomUUID();

        studentResponse = new ProfileResponse(
                studentId, "Jane", "Doe",
                "jane_bjj", null, null, LocalDate.of(2022, 3, 1), null, UserRole.CUSTOMER
        );

        sampleResponse = new CheckInResponse(
                1L, classId, studentResponse,
                CheckInStatus.REGISTERED, Instant.now()
        );

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    // -------------------------------------------------------
    // POST /academies/{aid}/classes/{cid}/attendances — register
    // -------------------------------------------------------

    @Test
    @DisplayName("POST register should return 201 when registered successfully")
    void register_shouldReturn201() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        when(classAttendanceService.register(academyId, classId, studentId))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/academies/{aid}/classes/{cid}/attendances", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":\"%s\"}".formatted(studentId)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.classId").value(classId))
                .andExpect(jsonPath("$.status").value("REGISTERED"))
                .andExpect(jsonPath("$.student.name").value("Jane"));

        verify(classAttendanceService).register(academyId, classId, studentId);
    }

    @Test
    @DisplayName("POST register should return 400 when request body is invalid")
    void register_whenInvalidBody_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/academies/{aid}/classes/{cid}/attendances", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest());

        verify(classAttendanceService, never()).register(any(), anyLong(), any());
    }

    @Test
    @DisplayName("POST register should return 403 when user has no access")
    void register_whenNoAccess_shouldReturn403() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(post("/api/v1/academies/{aid}/classes/{cid}/attendances", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":\"%s\"}".formatted(studentId)))
                .andExpect(status().isForbidden());

        verify(classAttendanceService, never()).register(any(), anyLong(), any());
    }

    // -------------------------------------------------------
    // PATCH .../attendances/{studentId}/confirm
    // -------------------------------------------------------

    @Test
    @DisplayName("PATCH confirm should return 200 when confirmed successfully")
    void confirm_shouldReturn200() throws Exception {
        CheckInResponse confirmedResponse = new CheckInResponse(
                1L, classId, studentResponse, CheckInStatus.CONFIRMED, Instant.now());

        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(classAttendanceService.confirm(academyId, classId, studentId))
                .thenReturn(confirmedResponse);

        mockMvc.perform(patch("/api/v1/academies/{aid}/classes/{cid}/attendances/{sid}/confirm", academyId, classId, studentId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"));

        verify(classAttendanceService).confirm(academyId, classId, studentId);
    }

    @Test
    @DisplayName("PATCH confirm should return 403 when user is not instructor or admin")
    void confirm_whenNotAuthorized_shouldReturn403() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(patch("/api/v1/academies/{aid}/classes/{cid}/attendances/{sid}/confirm", academyId, classId, studentId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden());

        verify(classAttendanceService, never()).confirm(any(), anyLong(), any());
    }

    @Test
    @DisplayName("PATCH confirm should return 404 when attendance not found")
    void confirm_whenNotFound_shouldReturn404() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(classAttendanceService.confirm(academyId, classId, studentId))
                .thenThrow(new ResourceNotFoundException("Attendance record not found for student"));

        mockMvc.perform(patch("/api/v1/academies/{aid}/classes/{cid}/attendances/{sid}/confirm", academyId, classId, studentId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Attendance record not found for student"));

        verify(classAttendanceService).confirm(academyId, classId, studentId);
    }

    @Test
    @DisplayName("PATCH confirm should return 422 when attendance is already canceled")
    void confirm_whenAlreadyCanceled_shouldReturn422() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        when(classAttendanceService.confirm(academyId, classId, studentId))
                .thenThrow(new BusinessRuleException("Cannot confirm a canceled check-in."));

        mockMvc.perform(patch("/api/v1/academies/{aid}/classes/{cid}/attendances/{sid}/confirm", academyId, classId, studentId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.message").value("Cannot confirm a canceled check-in."));

        verify(classAttendanceService).confirm(academyId, classId, studentId);
    }

    // -------------------------------------------------------
    // PATCH .../attendances/{studentId}/cancel
    // -------------------------------------------------------

    @Test
    @DisplayName("PATCH cancel should return 200 when canceled successfully")
    void cancel_shouldReturn200() throws Exception {
        CheckInResponse canceledResponse = new CheckInResponse(
                1L, classId, studentResponse, CheckInStatus.CANCELED, null);

        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        when(classAttendanceService.cancel(academyId, classId, studentId))
                .thenReturn(canceledResponse);

        mockMvc.perform(patch("/api/v1/academies/{aid}/classes/{cid}/attendances/{sid}/cancel", academyId, classId, studentId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELED"));

        verify(classAttendanceService).cancel(academyId, classId, studentId);
    }

    @Test
    @DisplayName("PATCH cancel should return 403 when user has no access")
    void cancel_whenNoAccess_shouldReturn403() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(patch("/api/v1/academies/{aid}/classes/{cid}/attendances/{sid}/cancel", academyId, classId, studentId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden());

        verify(classAttendanceService, never()).cancel(any(), anyLong(), any());
    }

    @Test
    @DisplayName("PATCH cancel should return 404 when attendance not found")
    void cancel_whenNotFound_shouldReturn404() throws Exception {
        when(academySecurity.hasAccess(any(), eq(academyId))).thenReturn(true);
        when(classAttendanceService.cancel(academyId, classId, studentId))
                .thenThrow(new ResourceNotFoundException("Attendance record not found for student"));

        mockMvc.perform(patch("/api/v1/academies/{aid}/classes/{cid}/attendances/{sid}/cancel", academyId, classId, studentId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Attendance record not found for student"));

        verify(classAttendanceService).cancel(academyId, classId, studentId);
    }

    // -------------------------------------------------------
    // GET /academies/{aid}/classes/{cid}/attendances — list
    // -------------------------------------------------------

    @Test
    @DisplayName("GET attendances should return paginated results")
    void listByClass_shouldReturnPage() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(true);
        Page<CheckInResponse> page = new PageImpl<>(
                List.of(sampleResponse), PageRequest.of(0, 20), 1);
        when(classAttendanceService.listByClass(eq(academyId), eq(classId), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/academies/{aid}/classes/{cid}/attendances", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].classId").value(classId))
                .andExpect(jsonPath("$.content[0].status").value("REGISTERED"))
                .andExpect(jsonPath("$.content[0].student.name").value("Jane"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(classAttendanceService).listByClass(eq(academyId), eq(classId), any());
    }

    @Test
    @DisplayName("GET attendances should return 403 when user is not instructor or admin")
    void listByClass_whenNotAuthorized_shouldReturn403() throws Exception {
        when(academySecurity.isInstructorOrAdmin(any(), eq(academyId))).thenReturn(false);

        mockMvc.perform(get("/api/v1/academies/{aid}/classes/{cid}/attendances", academyId, classId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isForbidden());

        verify(classAttendanceService, never()).listByClass(any(), anyLong(), any());
    }
}