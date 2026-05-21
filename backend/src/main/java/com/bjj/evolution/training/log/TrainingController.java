package com.bjj.evolution.training.log;

import com.bjj.evolution.training.log.domain.dto.TrainingRequest;
import com.bjj.evolution.training.log.domain.dto.TrainingResponse;
import com.bjj.evolution.training.log.domain.dto.TrainingStatsResponse;
import com.bjj.evolution.training.log.domain.dto.DashboardResponse;
import com.bjj.evolution.shared.utils.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/trainings")
public class TrainingController {

    private final TrainingService service;

    public TrainingController(TrainingService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TrainingResponse> create(
            @Valid @RequestBody TrainingRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = extractUserId(jwt);
        TrainingResponse response = service.create(request, userId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<TrainingResponse>> getAll(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @RequestParam(required = false) LocalDate endDate,
            @PageableDefault(size = 10, sort = "sessionDate", direction = Sort.Direction.DESC)
            Pageable pageable
    ) {
        UUID userId = extractUserId(jwt);
        return ResponseEntity.ok(
                service.findAll(userId, 
                        startDate != null ? startDate.atStartOfDay() : null, 
                        endDate != null ? endDate.atTime(23, 59, 59) : null, 
                        pageable)
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<TrainingResponse> getById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = extractUserId(jwt);
        return ResponseEntity.ok(service.findById(id, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TrainingResponse> update(
            @PathVariable Long id,
            @Valid @RequestBody TrainingRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = extractUserId(jwt);
        return ResponseEntity.ok(service.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = extractUserId(jwt);
        service.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<TrainingStatsResponse> getStats(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            LocalDate startDate,
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
            @RequestParam(required = false) LocalDate endDate) {

        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.getStats(userId, 
                startDate != null ? startDate.atStartOfDay() : null, 
                endDate != null ? endDate.atTime(23, 59, 59) : null));
    }

    @GetMapping("/dashboard")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<DashboardResponse> getDashboard(
            @RequestParam(defaultValue = "30") int days) {

        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.getDashboardMetrics(userId, days));
    }

    private UUID extractUserId(Jwt jwt) {
        return UUID.fromString(jwt.getSubject());
    }
}
