package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
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
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class AcademyControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AcademyService academyService;

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
    private AcademyResponse sampleResponse;

    @BeforeEach
    void setUp() {
        academyId = UUID.randomUUID();
        sampleResponse = new AcademyResponse(academyId, "Gracie Barra", "123 Main St");

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);
    }

    // -------------------------------------------------------
    // POST /academies — create
    // -------------------------------------------------------

    @Test
    @DisplayName("POST /academies should return 201 when created successfully")
    void create_shouldReturn201() throws Exception {
        when(academySecurity.isPlatformManager(any())).thenReturn(true);
        when(academyService.create(any(AcademyRequest.class), any(UUID.class)))
                .thenReturn(sampleResponse);

        mockMvc.perform(post("/api/v1/academies")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Gracie Barra","address":"123 Main St"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(academyId.toString()))
                .andExpect(jsonPath("$.name").value("Gracie Barra"))
                .andExpect(jsonPath("$.address").value("123 Main St"));

        verify(academyService).create(any(AcademyRequest.class), any(UUID.class));
    }

    @Test
    @DisplayName("POST /academies should return 400 when request body is invalid")
    void create_whenInvalidBody_shouldReturn400() throws Exception {
        mockMvc.perform(post("/api/v1/academies")
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"","address":""}
                                """))
                .andExpect(status().isBadRequest());

        verify(academyService, never()).create(any(), any());
    }

    // -------------------------------------------------------
    // GET /academies/search — publicly accessible search
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /academies/search should return paginated results with query")
    void search_withQuery_shouldReturnPage() throws Exception {
        Page<AcademyResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 10), 1);
        when(academyService.findAllPublic(eq("Gracie"), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/academies/search")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("query", "Gracie")
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Gracie Barra"))
                .andExpect(jsonPath("$.totalElements").value(1));

        verify(academyService).findAllPublic(eq("Gracie"), any());
    }

    @Test
    @DisplayName("GET /academies/search should return paginated results without query")
    void search_withoutQuery_shouldReturnAll() throws Exception {
        Page<AcademyResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 10), 1);
        when(academyService.findAllPublic(isNull(), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/academies/search")
                        .header("Authorization", "Bearer " + TOKEN)
                        .param("page", "0")
                        .param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Gracie Barra"));

        verify(academyService).findAllPublic(isNull(), any());
    }

    // -------------------------------------------------------
    // GET /academies — my academies
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /academies should return the authenticated user's academies")
    void getMyAcademies_shouldReturnUserAcademies() throws Exception {
        Page<AcademyResponse> page = new PageImpl<>(List.of(sampleResponse), PageRequest.of(0, 10), 1);
        when(academyService.findMyAcademies(any(UUID.class), any())).thenReturn(page);

        mockMvc.perform(get("/api/v1/academies")
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(academyId.toString()));

        verify(academyService).findMyAcademies(any(UUID.class), any());
    }

    // -------------------------------------------------------
    // GET /academies/{id} — get by id
    // -------------------------------------------------------

    @Test
    @DisplayName("GET /academies/{id} should return the academy when found")
    void getById_whenFound_shouldReturnAcademy() throws Exception {
        when(academyService.findById(academyId)).thenReturn(sampleResponse);

        mockMvc.perform(get("/api/v1/academies/{id}", academyId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(academyId.toString()))
                .andExpect(jsonPath("$.name").value("Gracie Barra"));

        verify(academyService).findById(academyId);
    }

    @Test
    @DisplayName("GET /academies/{id} should return 404 when academy is not found")
    void getById_whenNotFound_shouldReturn404() throws Exception {
        when(academyService.findById(academyId))
                .thenThrow(new ResourceNotFoundException("Academy", academyId));

        mockMvc.perform(get("/api/v1/academies/{id}", academyId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message").value("Academy not found with id: " + academyId));

        verify(academyService).findById(academyId);
    }

    // -------------------------------------------------------
    // PUT /academies/{id} — update
    // -------------------------------------------------------

    @Test
    @DisplayName("PUT /academies/{id} should return 200 when owner updates successfully")
    void update_whenOwner_shouldReturn200() throws Exception {
        when(academySecurity.isOwner(any(), eq(academyId))).thenReturn(true);
        when(academyService.update(eq(academyId), any(AcademyRequest.class))).thenReturn(sampleResponse);

        mockMvc.perform(put("/api/v1/academies/{id}", academyId)
                        .header("Authorization", "Bearer " + TOKEN)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Updated Gym","address":"456 Oak St"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Gracie Barra"));

        verify(academySecurity).isOwner(any(), eq(academyId));
        verify(academyService).update(eq(academyId), any(AcademyRequest.class));
    }

    // -------------------------------------------------------
    // DELETE /academies/{id}
    // -------------------------------------------------------

    @Test
    @DisplayName("DELETE /academies/{id} should return 204 when owner deletes")
    void delete_whenOwner_shouldReturn204() throws Exception {
        when(academySecurity.isOwner(any(), eq(academyId))).thenReturn(true);
        doNothing().when(academyService).delete(academyId);

        mockMvc.perform(delete("/api/v1/academies/{id}", academyId)
                        .header("Authorization", "Bearer " + TOKEN))
                .andExpect(status().isNoContent());

        verify(academySecurity).isOwner(any(), eq(academyId));
        verify(academyService).delete(academyId);
    }
}
