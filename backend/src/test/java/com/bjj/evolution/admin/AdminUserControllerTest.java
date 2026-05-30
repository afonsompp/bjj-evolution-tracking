package com.bjj.evolution.admin;

import com.bjj.evolution.admin.domain.dto.AdminUserResponse;
import com.bjj.evolution.catalog.domain.Belt;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.user.domain.UserRole;
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
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AdminUserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminUserService adminUserService;

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

    @BeforeEach
    void setUp() {
        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    @Test
    @DisplayName("GET /admin/users should return paginated results with query")
    void searchUsers_withQuery_shouldReturnPage() throws Exception {
        AdminUserResponse user = new AdminUserResponse(
                UUID.randomUUID(), "John", "Doe", "jiujitsu_john",
                "john@example.com", Belt.PURPLE, 2, null, UserRole.CUSTOMER);
        Page<AdminUserResponse> page = new PageImpl<>(List.of(user), PageRequest.of(0, 20), 1);
        when(adminUserService.searchUsers(any(Jwt.class), eq("john"), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("query", "john"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].nickname").value("jiujitsu_john"))
                .andExpect(jsonPath("$.content[0].email").value("john@example.com"))
                .andExpect(jsonPath("$.content[0].role").value("CUSTOMER"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(adminUserService).searchUsers(any(Jwt.class), eq("john"), any());
    }

    @Test
    @DisplayName("GET /admin/users should default to empty query when none provided")
    void searchUsers_withoutQuery_shouldDefaultToEmpty() throws Exception {
        Page<AdminUserResponse> page = new PageImpl<>(List.of(), PageRequest.of(0, 20), 0);
        when(adminUserService.searchUsers(any(Jwt.class), eq(""), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(adminUserService).searchUsers(any(Jwt.class), eq(""), any());
    }

    @Test
    @DisplayName("GET /admin/users should return 403 when caller is not admin")
    void searchUsers_shouldReturn403_whenNotAdmin() throws Exception {
        when(adminUserService.searchUsers(any(Jwt.class), anyString(), any()))
                .thenThrow(new ForbiddenException("Only admins can manage users."));

        mockMvc.perform(get("/api/v1/admin/users")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("query", "john"))
                .andExpect(status().isForbidden());
    }
}
