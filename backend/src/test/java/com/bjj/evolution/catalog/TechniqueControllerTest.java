package com.bjj.evolution.catalog;

import com.bjj.evolution.catalog.domain.TechniqueTarget;
import com.bjj.evolution.catalog.domain.TechniqueType;
import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
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
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
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
class TechniqueControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TechniqueService techniqueService;

    @MockitoBean
    private UserProfileRepository userProfileRepository;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private static final String TOKEN = "test-jwt-token";

    private static final Jwt MOCK_JWT = Jwt.withTokenValue("mock-jwt")
            .header("alg", "RS256")
            .claim("sub", UUID.randomUUID().toString())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();

    private Long techniqueId;
    private TechniqueResponse sampleResponse;
    private UUID userId;

    @BeforeEach
    void setUp() {
        techniqueId = 1L;
        userId = UUID.fromString(MOCK_JWT.getSubject());
        sampleResponse = new TechniqueResponse(
                techniqueId,
                "Armbar",
                "Juji Gatame",
                TechniqueType.SUBMISSION,
                TechniqueTarget.ARM
        );

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);

        UserProfile adminProfile = new UserProfile();
        adminProfile.setId(userId);
        adminProfile.setRole(UserRole.ADMIN);
        when(userProfileRepository.findById(userId)).thenReturn(java.util.Optional.of(adminProfile));
    }

    // -------------------------------------------------------
    // POST /techniques — create
    // -------------------------------------------------------

    @Test
    @DisplayName("POST /techniques should return 201 when created successfully")
    void create_shouldReturn201() throws Exception {
        when(techniqueService.create(any(TechniqueRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/techniques")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Armbar",
                                    "alternativeName": "Juji Gatame",
                                    "type": "SUBMISSION",
                                    "target": "ARM"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Armbar"))
                .andExpect(jsonPath("$.alternativeName").value("Juji Gatame"))
                .andExpect(jsonPath("$.type").value("SUBMISSION"))
                .andExpect(jsonPath("$.target").value("ARM"));

        verify(techniqueService).create(any(TechniqueRequest.class));
    }

    // -------------------------------------------------------
    // GET /techniques — list with optional query
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /techniques should return paginated results with query")
    void getAll_withQuery_shouldReturnPage() throws Exception {
        Page<TechniqueResponse> page = new PageImpl<>(
                List.of(sampleResponse), PageRequest.of(0, 10), 1);
        when(techniqueService.findAll(eq("armbar"), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/techniques")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("query", "armbar")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Armbar"))
                .andExpect(jsonPath("$.content[0].type").value("SUBMISSION"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(techniqueService).findAll(eq("armbar"), any());
    }

    @Test
    @DisplayName("GET /techniques should return paginated results without query")
    void getAll_withoutQuery_shouldReturnAll() throws Exception {
        Page<TechniqueResponse> page = new PageImpl<>(
                List.of(sampleResponse), PageRequest.of(0, 10), 1);
        when(techniqueService.findAll(isNull(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/techniques")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Armbar"));

        verify(techniqueService).findAll(isNull(), any());
    }

    @Test
    @DisplayName("GET /techniques should return empty page when no matches")
    void getAll_shouldReturnEmptyPage() throws Exception {
        Page<TechniqueResponse> emptyPage = new PageImpl<>(
                List.of(), PageRequest.of(0, 10), 0);
        when(techniqueService.findAll(eq("nonexistent"), any())).thenReturn(emptyPage);

        mockMvc.perform(get("/api/v1/techniques")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("query", "nonexistent"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isEmpty())
                .andExpect(jsonPath("$.totalElements").value(0));

        verify(techniqueService).findAll(eq("nonexistent"), any());
    }

    // -------------------------------------------------------
    // GET /techniques/{id} — get by id
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /techniques/{id} should return 200 when found")
    void getById_whenFound_shouldReturn200() throws Exception {
        when(techniqueService.findById(techniqueId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/techniques/{id}", techniqueId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Armbar"))
                .andExpect(jsonPath("$.alternativeName").value("Juji Gatame"))
                .andExpect(jsonPath("$.type").value("SUBMISSION"))
                .andExpect(jsonPath("$.target").value("ARM"));

        verify(techniqueService).findById(techniqueId);
    }

    @Test
    @DisplayName("GET /techniques/{id} should return 404 when not found")
    void getById_whenNotFound_shouldReturn404() throws Exception {
        when(techniqueService.findById(techniqueId))
                .thenThrow(new ResourceNotFoundException("Technique", techniqueId));

        mockMvc.perform(get("/api/v1/techniques/{id}", techniqueId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Technique not found with id: " + techniqueId));

        verify(techniqueService).findById(techniqueId);
    }

    // -------------------------------------------------------
    // PUT /techniques/{id} — update
    // -------------------------------------------------------

    @Test
    @DisplayName("PUT /techniques/{id} should return 200 when updated successfully")
    void update_shouldReturn200() throws Exception {
        when(techniqueService.update(eq(techniqueId), any(TechniqueRequest.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(put("/api/v1/techniques/{id}", techniqueId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Armbar",
                                    "alternativeName": "Juji Gatame",
                                    "type": "SUBMISSION",
                                    "target": "ARM"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Armbar"));

        verify(techniqueService).update(eq(techniqueId), any(TechniqueRequest.class));
    }

    @Test
    @DisplayName("PUT /techniques/{id} should return 404 when technique not found")
    void update_whenNotFound_shouldReturn404() throws Exception {
        when(techniqueService.update(eq(techniqueId), any(TechniqueRequest.class)))
                .thenThrow(new ResourceNotFoundException("Technique", techniqueId));

        mockMvc.perform(put("/api/v1/techniques/{id}", techniqueId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Armbar",
                                    "alternativeName": "Juji Gatame",
                                    "type": "SUBMISSION",
                                    "target": "ARM"
                                }
                                """))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Technique not found with id: " + techniqueId));

        verify(techniqueService).update(eq(techniqueId), any(TechniqueRequest.class));
    }

    // -------------------------------------------------------
    // DELETE /techniques/{id} — delete
    // -------------------------------------------------------

    @Test
    @DisplayName("DELETE /techniques/{id} should return 204 when deleted successfully")
    void delete_shouldReturn204() throws Exception {
        doNothing().when(techniqueService).delete(techniqueId);

        mockMvc.perform(delete("/api/v1/techniques/{id}", techniqueId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNoContent());

        verify(techniqueService).delete(techniqueId);
    }

    @Test
    @DisplayName("DELETE /techniques/{id} should return 404 when technique not found")
    void delete_whenNotFound_shouldReturn404() throws Exception {
        doThrow(new ResourceNotFoundException("Technique", techniqueId))
                .when(techniqueService).delete(techniqueId);

        mockMvc.perform(delete("/api/v1/techniques/{id}", techniqueId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Technique not found with id: " + techniqueId));

        verify(techniqueService).delete(techniqueId);
    }

    @Test
    @DisplayName("POST /techniques should return 403 when user is not admin")
    void create_whenNotAdmin_shouldReturn403() throws Exception {
        UserProfile customerProfile = new UserProfile();
        customerProfile.setId(userId);
        customerProfile.setRole(UserRole.CUSTOMER);
        when(userProfileRepository.findById(userId)).thenReturn(java.util.Optional.of(customerProfile));

        mockMvc.perform(post("/api/v1/techniques")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "name": "Armbar",
                                    "type": "SUBMISSION",
                                    "target": "ARM"
                                }
                                """))
                .andExpect(status().isForbidden());
    }
}
