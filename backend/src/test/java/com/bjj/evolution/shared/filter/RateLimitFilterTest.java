package com.bjj.evolution.shared.filter;

import com.bjj.evolution.academy.AcademySecurity;
import com.bjj.evolution.academy.AcademyService;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
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
import org.springframework.test.web.servlet.MvcResult;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class RateLimitFilterTest {

    private static final String TOKEN = "test-jwt-token";

    private static final Jwt MOCK_JWT = Jwt.withTokenValue("mock-jwt")
            .header("alg", "RS256")
            .claim("sub", UUID.randomUUID().toString())
            .issuedAt(Instant.now())
            .expiresAt(Instant.now().plusSeconds(3600))
            .build();

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AcademyService academyService;

    @MockitoBean
    private AcademySecurity academySecurity;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private String clientIp;

    @BeforeEach
    void setUp() {
        // Random IP per test isolates the bucket from other tests sharing this context.
        clientIp = "10.%d.%d.%d".formatted(
                ThreadLocalRandom.current().nextInt(256),
                ThreadLocalRandom.current().nextInt(256),
                ThreadLocalRandom.current().nextInt(256));

        when(jwtDecoder.decode(anyString())).thenReturn(MOCK_JWT);

        AcademyResponse sample = new AcademyResponse(UUID.randomUUID(), "Gracie Barra", "123 Main St");
        Page<AcademyResponse> page = new PageImpl<>(List.of(sample), PageRequest.of(0, 10), 1);
        when(academyService.findAllPublic(any(), any())).thenReturn(page);
    }

    @Test
    @DisplayName("GET /academies/search returns 429 after exhausting the 60 req/min bucket")
    void search_whenBucketExhausted_returns429() throws Exception {
        for (int i = 1; i <= 60; i++) {
            mockMvc.perform(get("/api/v1/academies/search")
                            .header("Authorization", "Bearer " + TOKEN)
                            .header("X-Forwarded-For", clientIp))
                    .andExpect(status().isOk());
        }

        MvcResult result = mockMvc.perform(get("/api/v1/academies/search")
                        .header("Authorization", "Bearer " + TOKEN)
                        .header("X-Forwarded-For", clientIp))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"))
                .andExpect(header().string("X-RateLimit-Remaining", "0"))
                .andExpect(jsonPath("$.error").value("Too Many Requests"))
                .andExpect(jsonPath("$.retryAfterSeconds").isNumber())
                .andReturn();

        long retryAfter = Long.parseLong(result.getResponse().getHeader("Retry-After"));
        assertThat(retryAfter).isPositive();
    }

    @Test
    @DisplayName("Different IPs each get their own 60-token bucket")
    void search_differentIps_haveIndependentBuckets() throws Exception {
        String otherIp = "10.255.255." + ThreadLocalRandom.current().nextInt(256);

        for (int i = 1; i <= 60; i++) {
            mockMvc.perform(get("/api/v1/academies/search")
                            .header("Authorization", "Bearer " + TOKEN)
                            .header("X-Forwarded-For", clientIp))
                    .andExpect(status().isOk());
        }

        // First IP is now exhausted.
        mockMvc.perform(get("/api/v1/academies/search")
                        .header("Authorization", "Bearer " + TOKEN)
                        .header("X-Forwarded-For", clientIp))
                .andExpect(status().isTooManyRequests());

        // A different IP should still be free.
        mockMvc.perform(get("/api/v1/academies/search")
                        .header("Authorization", "Bearer " + TOKEN)
                        .header("X-Forwarded-For", otherIp))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-RateLimit-Remaining"));
    }
}
