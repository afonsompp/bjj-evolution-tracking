package com.bjj.evolution.user;

import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.shared.exception.ConflictException;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.domain.UserRole;
import com.bjj.evolution.user.domain.dto.ProfileRequest;
import com.bjj.evolution.user.domain.dto.ProfileResponse;
import com.bjj.evolution.user.domain.dto.SearchProfileResponse;
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
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserProfileService userProfileService;

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
    private ProfileResponse sampleResponse;
    private SearchProfileResponse sampleSearchResponse;

    @BeforeEach
    void setUp() {
        userId = UUID.fromString(USER_SUB);
        sampleResponse = new ProfileResponse(
                userId, "John", "Doe", "jiujitsu_john",
                Belt.PURPLE, 2, LocalDate.of(2023, 1, 15),
                UserRole.CUSTOMER
        );
        sampleSearchResponse = new SearchProfileResponse(
                userId, "John", "Doe", "jiujitsu_john",
                Belt.PURPLE, 2, LocalDate.of(2023, 1, 15)
        );

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    // -------------------------------------------------------
    // GET /profiles — get my profile
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /profiles should return 200 when profile exists")
    void getProfile_shouldReturn200_whenProfileExists() throws Exception {
        when(userProfileService.getMyProfile(any(Jwt.class))).thenReturn(Optional.of(sampleResponse));

        mockMvc.perform(get("/profiles")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.name").value("John"))
                .andExpect(jsonPath("$.nickname").value("jiujitsu_john"))
                .andExpect(jsonPath("$.belt").value("PURPLE"))
                .andExpect(jsonPath("$.stripe").value(2))
                .andExpect(jsonPath("$.role").value("CUSTOMER"));

        verify(userProfileService).getMyProfile(any(Jwt.class));
    }

    @Test
    @DisplayName("GET /profiles should return 404 when profile does not exist")
    void getProfile_shouldReturn404_whenProfileNotFound() throws Exception {
        when(userProfileService.getMyProfile(any(Jwt.class))).thenReturn(Optional.empty());

        mockMvc.perform(get("/profiles")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound());

        verify(userProfileService).getMyProfile(any(Jwt.class));
    }

    // -------------------------------------------------------
    // GET /profiles/search — public search
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /profiles/search should return paginated results with query")
    void search_withQuery_shouldReturnPage() throws Exception {
        Page<SearchProfileResponse> page = new PageImpl<>(
                List.of(sampleSearchResponse), PageRequest.of(0, 10), 1);
        when(userProfileService.searchProfile(eq("john"), any())).thenReturn(page);

        mockMvc.perform(get("/profiles/search")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("query", "john")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].nickname").value("jiujitsu_john"))
                .andExpect(jsonPath("$.content[0].belt").value("PURPLE"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(userProfileService).searchProfile(eq("john"), any());
    }

    @Test
    @DisplayName("GET /profiles/search should return empty page when no matches")
    void search_shouldReturnEmptyPage_whenNoMatches() throws Exception {
        Page<SearchProfileResponse> emptyPage = new PageImpl<>(
                List.of(), PageRequest.of(0, 10), 0);
        when(userProfileService.searchProfile(eq("nonexistent"), any())).thenReturn(emptyPage);

        mockMvc.perform(get("/profiles/search")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("query", "nonexistent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(userProfileService).searchProfile(eq("nonexistent"), any());
    }

    // -------------------------------------------------------
    // POST /profiles — create or update profile
    // -------------------------------------------------------

    @Test
    @DisplayName("POST /profiles should return 200 when profile is saved successfully")
    void saveOrUpdate_shouldReturn200() throws Exception {
        when(userProfileService.saveOrUpdate(any(Jwt.class), any(ProfileRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/profiles")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "John",
                                    "secondName": "Doe",
                                    "nickname": "jiujitsu_john",
                                    "belt": "PURPLE",
                                    "stripe": 2,
                                    "startsIn": "2023-01-15"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(userId.toString()))
                .andExpect(jsonPath("$.nickname").value("jiujitsu_john"))
                .andExpect(jsonPath("$.belt").value("PURPLE"))
                .andExpect(jsonPath("$.stripe").value(2));

        verify(userProfileService).saveOrUpdate(any(Jwt.class), any(ProfileRequest.class));
    }

    @Test
    @DisplayName("POST /profiles should return 409 when nickname is already taken")
    void saveOrUpdate_shouldReturn409_whenNicknameConflict() throws Exception {
        ConflictException conflict = new ConflictException("Nickname is already taken.");
        when(userProfileService.saveOrUpdate(any(Jwt.class), any(ProfileRequest.class)))
                .thenThrow(conflict);

        mockMvc.perform(post("/profiles")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "John",
                                    "nickname": "jiujitsu_john",
                                    "belt": "PURPLE"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409))
                .andExpect(jsonPath("$.message").value("Nickname is already taken."));

        verify(userProfileService).saveOrUpdate(any(Jwt.class), any(ProfileRequest.class));
    }

    // -------------------------------------------------------
    // PATCH /profiles/{userId}/role — update user role
    // -------------------------------------------------------

    @Test
    @DisplayName("PATCH /profiles/{userId}/role should return 200 when admin updates role")
    void updateRole_shouldReturn200_whenAdminUpdatesRole() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        ProfileResponse updatedResponse = new ProfileResponse(
                targetUserId, "Jane", "Doe", "jiujitsu_jane",
                Belt.BLUE, 1, LocalDate.of(2024, 6, 1),
                UserRole.MANAGER
        );

        when(userProfileService.updateRole(any(Jwt.class), eq(targetUserId), eq(UserRole.MANAGER)))
                .thenReturn(updatedResponse);

        mockMvc.perform(patch("/profiles/{userId}/role", targetUserId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"MANAGER\""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(targetUserId.toString()))
                .andExpect(jsonPath("$.role").value("MANAGER"));

        verify(userProfileService).updateRole(any(Jwt.class), eq(targetUserId), eq(UserRole.MANAGER));
    }

    @Test
    @DisplayName("PATCH /profiles/{userId}/role should return 403 when actor lacks privileges")
    void updateRole_shouldReturn403_whenActorLacksPrivileges() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        when(userProfileService.updateRole(any(Jwt.class), eq(targetUserId), eq(UserRole.MANAGER)))
                .thenThrow(new ForbiddenException("Only admins or managers can update user roles."));

        mockMvc.perform(patch("/profiles/{userId}/role", targetUserId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"MANAGER\""))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message")
                        .value("Only admins or managers can update user roles."));

        verify(userProfileService).updateRole(any(Jwt.class), eq(targetUserId), eq(UserRole.MANAGER));
    }

    @Test
    @DisplayName("PATCH /profiles/{userId}/role should return 403 when manager tries to assign ADMIN")
    void updateRole_shouldReturn403_whenManagerPromotesToAdmin() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        when(userProfileService.updateRole(any(Jwt.class), eq(targetUserId), eq(UserRole.ADMIN)))
                .thenThrow(new ForbiddenException("Only admins can assign the ADMIN role."));

        mockMvc.perform(patch("/profiles/{userId}/role", targetUserId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"ADMIN\""))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.message")
                        .value("Only admins can assign the ADMIN role."));

        verify(userProfileService).updateRole(any(Jwt.class), eq(targetUserId), eq(UserRole.ADMIN));
    }

    @Test
    @DisplayName("PATCH /profiles/{userId}/role should return 404 when current user profile not found")
    void updateRole_shouldReturn404_whenCurrentUserNotFound() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        when(userProfileService.updateRole(any(Jwt.class), eq(targetUserId), any(UserRole.class)))
                .thenThrow(new ResourceNotFoundException("Current user profile not found"));

        mockMvc.perform(patch("/profiles/{userId}/role", targetUserId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"MANAGER\""))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Current user profile not found"));

        verify(userProfileService).updateRole(any(Jwt.class), eq(targetUserId), any(UserRole.class));
    }

    @Test
    @DisplayName("PATCH /profiles/{userId}/role should return 404 when target user not found")
    void updateRole_shouldReturn404_whenTargetUserNotFound() throws Exception {
        UUID targetUserId = UUID.randomUUID();
        when(userProfileService.updateRole(any(Jwt.class), eq(targetUserId), any(UserRole.class)))
                .thenThrow(new ResourceNotFoundException("User", targetUserId));

        mockMvc.perform(patch("/profiles/{userId}/role", targetUserId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("\"MANAGER\""))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("User not found with id: " + targetUserId));

        verify(userProfileService).updateRole(any(Jwt.class), eq(targetUserId), any(UserRole.class));
    }

    // -------------------------------------------------------
    // DELETE /profiles — delete my profile
    // -------------------------------------------------------

    @Test
    @DisplayName("DELETE /profiles should return 204 when deleted successfully")
    void delete_shouldReturn204() throws Exception {
        doNothing().when(userProfileService).deleteMyProfile(any(Jwt.class));

        mockMvc.perform(delete("/profiles")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNoContent());

        verify(userProfileService).deleteMyProfile(any(Jwt.class));
    }
}
