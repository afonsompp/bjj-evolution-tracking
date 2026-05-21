package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.clazz.service.ClassTemplateService;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ClassTemplateResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/academies/{academyId}/templates")
public class ClassTemplateController {

    private final ClassTemplateService service;

    public ClassTemplateController(ClassTemplateService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<ClassTemplateResponse> create(
            @PathVariable UUID academyId,
            @Valid @RequestBody ClassTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(academyId, request));
    }

    @GetMapping
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<Page<ClassTemplateResponse>> getAll(
            @PathVariable UUID academyId,
            Pageable pageable) {
        return ResponseEntity.ok(service.findAll(academyId, pageable));
    }

    @PutMapping("/{templateId}")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<ClassTemplateResponse> update(
            @PathVariable UUID academyId,
            @PathVariable UUID templateId,
            @Valid @RequestBody ClassTemplateRequest request) {
        return ResponseEntity.ok(service.update(templateId, request));
    }

    @DeleteMapping("/{templateId}")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Void> delete(
            @PathVariable UUID academyId,
            @PathVariable UUID templateId) {
        service.delete(templateId);
        return ResponseEntity.noContent().build();
    }
}
