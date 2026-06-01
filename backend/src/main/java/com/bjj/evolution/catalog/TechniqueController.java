package com.bjj.evolution.catalog;

import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/techniques")
public class TechniqueController {


    private final TechniqueService service;

    public TechniqueController(TechniqueService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("@catalogSecurity.isGlobalAdmin(authentication)")
    public ResponseEntity<TechniqueResponse> create(@Valid @RequestBody TechniqueRequest request) {
        TechniqueResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<Page<TechniqueResponse>> getAll(
            @RequestParam(required = false) String query,
            @PageableDefault(size = 10, sort = "name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(service.findAll(query, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechniqueResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@catalogSecurity.isGlobalAdmin(authentication)")
    public ResponseEntity<TechniqueResponse> update(@PathVariable Long id, @Valid @RequestBody TechniqueRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@catalogSecurity.isGlobalAdmin(authentication)")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
