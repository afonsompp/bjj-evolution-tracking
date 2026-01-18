package com.bjj.evolution.catalog;


import com.bjj.evolution.catalog.domain.dto.TechniqueRequest;
import com.bjj.evolution.catalog.domain.dto.TechniqueResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/techniques")
public class TechniqueController {

    private final TechniqueService service;

    public TechniqueController(TechniqueService service) {
        this.service = service;
    }

    @PostMapping
    public ResponseEntity<TechniqueResponse> create(@RequestBody TechniqueRequest request) {
        TechniqueResponse response = service.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<TechniqueResponse>> getAll() {
        return ResponseEntity.ok(service.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<TechniqueResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TechniqueResponse> update(@PathVariable Long id, @RequestBody TechniqueRequest request) {
        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
