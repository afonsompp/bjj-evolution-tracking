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
    public ResponseEntity<AcademyResponse> create(@Valid @RequestBody AcademyRequest request) {
        AcademyResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<AcademyResponse>> getAll(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(service.findAll(query, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademyResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademyResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody AcademyRequest request
    ) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
