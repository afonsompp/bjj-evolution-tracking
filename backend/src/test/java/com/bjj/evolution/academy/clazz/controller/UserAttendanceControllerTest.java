package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.domain.ClassStatus;
import com.bjj.evolution.academy.clazz.service.ClassAttendanceService;
import com.bjj.evolution.academy.clazz.domain.dto.CheckInResponse;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassResponse;
import com.bjj.evolution.academy.member.domain.dto.AcademyMenberClassViewResponse;
import com.bjj.evolution.catalog.domain.ClassType;
import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.TrainingType;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
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
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserAttendanceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ClassAttendanceService classAttendanceService;

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

    private UUID userId;
    private AcademyMenberClassViewResponse sampleAttendance;

    @BeforeEach
    void setUp() {
        userId = UUID.fromString(USER_SUB);

        ProfileResponse instructor = new ProfileResponse(
                UUID.randomUUID(), "Carlos", "Gracie", "carlos_gracie",
                null, null, null, UserRole.MANAGER
        );

        ScheduledClassResponse scheduledClass = new ScheduledClassResponse(
                1L,
                UUID.randomUUID(),
                "Gracie Barra",
                instructor,
                LocalDateTime.of(2025, 5, 17, 10, 0),
                90L,
                ClassType.REGULAR,
                TrainingType.GI,
                List.of(new TechniqueResponse(1L, "Closed Guard", null, TechniqueType.POSITION, TechniqueTarget.TORSO)),
                ClassStatus.PUBLISHED
        );

        sampleAttendance = new AcademyMenberClassViewResponse(
                1L,
                scheduledClass,
                CheckInStatus.CONFIRMED,
                LocalDateTime.of(2025, 5, 17, 10, 0)
        );

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    // -------------------------------------------------------
    // GET /attendances
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /attendances should return paginated results without status filter")
    void getAll_withoutStatus_shouldReturnPage() throws Exception {
        Page<AcademyMenberClassViewResponse> page = new PageImpl<>(
                List.of(sampleAttendance), PageRequest.of(0, 20), 1);
        when(classAttendanceService.findClassViewsByStudent(eq(userId), isNull(), any()))
                .thenReturn(page);

        mockMvc.perform(get("/attendances")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$.content[0].scheduledClass.id").value(1))
                .andExpect(jsonPath("$.content[0].scheduledClass.academyName").value("Gracie Barra"))
                .andExpect(jsonPath("$.content[0].scheduledClass.classType").value("REGULAR"))
                .andExpect(jsonPath("$.content[0].scheduledClass.instructor.nickname").value("carlos_gracie"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(classAttendanceService).findClassViewsByStudent(eq(userId), isNull(), any());
    }

    @Test
    @DisplayName("GET /attendances should return filtered results with status filter")
    void getAll_withStatusFilter_shouldReturnFilteredPage() throws Exception {
        Page<AcademyMenberClassViewResponse> page = new PageImpl<>(
                List.of(sampleAttendance), PageRequest.of(0, 20), 1);
        when(classAttendanceService.findClassViewsByStudent(eq(userId), eq(CheckInStatus.CONFIRMED), any()))
                .thenReturn(page);

        mockMvc.perform(get("/attendances")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("status", "CONFIRMED"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].status").value("CONFIRMED"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(classAttendanceService).findClassViewsByStudent(eq(userId), eq(CheckInStatus.CONFIRMED), any());
    }

    @Test
    @DisplayName("GET /attendances should return empty page when no attendances exist")
    void getAll_shouldReturnEmptyPage() throws Exception {
        Page<AcademyMenberClassViewResponse> emptyPage = new PageImpl<>(
                List.of(), PageRequest.of(0, 20), 0);
        when(classAttendanceService.findClassViewsByStudent(eq(userId), isNull(), any()))
                .thenReturn(emptyPage);

        mockMvc.perform(get("/attendances")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(classAttendanceService).findClassViewsByStudent(eq(userId), isNull(), any());
    }

    @Test
    @DisplayName("GET /attendances should return 401 when not authenticated")
    void getAll_withoutAuth_shouldReturn401() throws Exception {
        mockMvc.perform(get("/attendances"))
                .andExpect(status().isUnauthorized());

        verify(classAttendanceService, never()).findClassViewsByStudent(any(), any(), any());
    }
}