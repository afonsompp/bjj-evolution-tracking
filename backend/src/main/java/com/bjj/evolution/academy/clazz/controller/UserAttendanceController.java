package com.bjj.evolution.academy.clazz.controller;

import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.clazz.service.ClassAttendanceService;
import com.bjj.evolution.academy.member.domain.dto.AcademyMenberClassViewResponse;
import com.bjj.evolution.shared.utils.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

@RestController
@RequestMapping("/attendances")
public class UserAttendanceController {

    private final ClassAttendanceService classAttendanceService;

    public UserAttendanceController(ClassAttendanceService classAttendanceService) {
        this.classAttendanceService = classAttendanceService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<AcademyMenberClassViewResponse>> getMyAttendances(
            @RequestParam(required = false) CheckInStatus status,
            @RequestParam(required = false) UUID academyId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {

        UUID userId = SecurityUtils.getCurrentUserId();
        Instant start = startDate != null ? startDate.atStartOfDay(ZoneOffset.UTC).toInstant() : null;
        Instant end = endDate != null ? endDate.atTime(23, 59, 59).toInstant(ZoneOffset.UTC) : null;
        if (academyId != null) {
            return ResponseEntity.ok(
                    classAttendanceService.findClassViewsByStudentAndAcademy(academyId, userId, status, start, end, pageable));
        }
        return ResponseEntity.ok(classAttendanceService.findClassViewsByStudent(userId, status, start, end, pageable));
    }
}
