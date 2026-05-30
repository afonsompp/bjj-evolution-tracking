package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.clazz.service.ClassAttendanceService;
import com.bjj.evolution.academy.clazz.domain.dto.CheckInRequest;
import com.bjj.evolution.academy.clazz.domain.dto.CheckInResponse;
import com.bjj.evolution.shared.utils.SecurityUtils;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/academies/{academyId}")
public class ClassAttendanceController {

    private final ClassAttendanceService service;

    public ClassAttendanceController(ClassAttendanceService service) {
        this.service = service;
    }

    @PostMapping("/classes/{classId}/attendances")
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<CheckInResponse> register(
            @PathVariable UUID academyId,
            @PathVariable Long classId,
            @Valid @RequestBody CheckInRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED).body(service.
                register(academyId, classId, request.studentId()));
    }

    @PatchMapping("/classes/{classId}/attendances/{studentId}/confirm")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<CheckInResponse> confirm(
            @PathVariable UUID academyId,
            @PathVariable Long classId,
            @PathVariable UUID studentId) {

        return ResponseEntity.ok(service.confirm(academyId, classId, studentId));
    }

    @PatchMapping("/classes/{classId}/attendances/{studentId}/cancel")
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<CheckInResponse> cancel(
            @PathVariable UUID academyId,
            @PathVariable Long classId,
            @PathVariable UUID studentId) {

        return ResponseEntity.ok(service.cancel(academyId, classId, studentId));
    }

    @PostMapping("/classes/{classId}/attendances/me")
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<CheckInResponse> selfCheckIn(
            @PathVariable UUID academyId,
            @PathVariable Long classId) {

        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.status(HttpStatus.CREATED).body(service.register(academyId, classId, userId));
    }

    @GetMapping("/classes/{classId}/attendances/me")
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<CheckInResponse> getMyAttendance(
            @PathVariable UUID academyId,
            @PathVariable Long classId) {

        UUID userId = SecurityUtils.getCurrentUserId();
        return service.getMyAttendance(academyId, classId, userId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PatchMapping("/classes/{classId}/attendances/me/cancel")
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<CheckInResponse> cancelMyAttendance(
            @PathVariable UUID academyId,
            @PathVariable Long classId) {

        UUID userId = SecurityUtils.getCurrentUserId();
        return ResponseEntity.ok(service.cancel(academyId, classId, userId));
    }

    @GetMapping("/classes/{classId}/attendances")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Page<CheckInResponse>> listByClass(
            @PathVariable UUID academyId,
            @PathVariable Long classId,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.ASC) Pageable pageable) {

        return ResponseEntity.ok(service.listByClass(academyId, classId, pageable));
    }

    @DeleteMapping("/classes/{classId}/attendances/{studentId}")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Void> deleteAttendance(
            @PathVariable UUID academyId,
            @PathVariable Long classId,
            @PathVariable UUID studentId) {

        service.deleteAttendance(academyId, classId, studentId);
        return ResponseEntity.noContent().build();
    }
}
