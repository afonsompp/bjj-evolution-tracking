package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/academies")
public class AcademyController {

    private final AcademyService service;

    public AcademyController(AcademyService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<AcademyResponse> create(@AuthenticationPrincipal Jwt jwt,
                                                  @Valid @RequestBody AcademyRequest request) {
        AcademyResponse response = service.create(request, UUID.fromString(jwt.getSubject()));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<AcademyResponse>> search(
            @RequestParam(required = false) String query,
            Pageable pageable) {
        return ResponseEntity.ok(service.findAllPublic(query, pageable));
    }

    @GetMapping
    public ResponseEntity<Page<AcademyResponse>> getMyAcademies(
            @AuthenticationPrincipal Jwt jwt,
            Pageable pageable) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(service.findMyAcademies(userId, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademyResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademyResponse> update(
            @PathVariable UUID id,
            @RequestBody AcademyRequest request,
            @AuthenticationPrincipal Jwt jwt) {

        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(service.update(id, request, userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt,@PathVariable UUID id) {
        service.delete(id, UUID.fromString(jwt.getSubject()));
        return ResponseEntity.noContent().build();
    }
}
