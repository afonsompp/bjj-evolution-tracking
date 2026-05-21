package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.clazz.service.ScheduledClassService;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassRequest;
import com.bjj.evolution.academy.clazz.domain.dto.ScheduledClassResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/academies/{academyId}/classes")
public class ScheduledClassController {

    private final ScheduledClassService service;

    public ScheduledClassController(ScheduledClassService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<ScheduledClassResponse> createManual(
            @PathVariable UUID academyId,
            @Valid @RequestBody ScheduledClassRequest request) {

        if (!academyId.equals(request.academyId())) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(service.createManualClass(request));
    }

    @PutMapping("/{classId}")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<ScheduledClassResponse> update(
            @PathVariable UUID academyId,
            @PathVariable Long classId,
            @Valid @RequestBody ScheduledClassRequest request) {

        return ResponseEntity.ok(service.update(classId, request));
    }

    @PatchMapping("/{classId}/cancel")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Void> cancel(
            @PathVariable UUID academyId,
            @PathVariable Long classId) {

        service.cancel(classId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<Page<ScheduledClassResponse>> getAll(
            @PathVariable UUID academyId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20, sort = "startTime", direction = Sort.Direction.ASC) Pageable pageable) {

        return ResponseEntity.ok(service.findAll(academyId, startDate, endDate, pageable));
    }

    @GetMapping("/{classId}")
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<ScheduledClassResponse> getById(
            @PathVariable UUID academyId,
            @PathVariable Long classId) {

        return ResponseEntity.ok(service.findById(academyId, classId));
    }

}
