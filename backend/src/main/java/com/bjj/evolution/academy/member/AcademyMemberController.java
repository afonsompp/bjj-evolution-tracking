package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.clazz.service.ClassAttendanceService;
import com.bjj.evolution.academy.clazz.domain.CheckInStatus;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberRequest;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberResponse;
import com.bjj.evolution.academy.member.domain.dto.AcademyMenberClassViewResponse;
import com.bjj.evolution.academy.member.domain.dto.GraduationHistoryResponse;
import com.bjj.evolution.academy.member.domain.dto.GraduationRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/academies/{academyId}/members")
public class AcademyMemberController {

    private final AcademyMemberService service;
    private final ClassAttendanceService attendanceService;

    public AcademyMemberController(AcademyMemberService service, ClassAttendanceService attendanceService) {
        this.service = service;
        this.attendanceService = attendanceService;
    }

    @PostMapping("/join")
    public ResponseEntity<AcademyMemberResponse> requestToJoin(
            @PathVariable UUID academyId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.joinAcademy(academyId, userId));
    }

    @PostMapping
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<AcademyMemberResponse> addMemberManual(
            @PathVariable UUID academyId,
            @Valid @RequestBody AcademyMemberRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createMember(academyId, request));
    }

    @PutMapping("/{userId}")
    @PreAuthorize("@academySecurity.isOwner(authentication, #academyId)")
    public ResponseEntity<AcademyMemberResponse> updateMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId,
            @Valid @RequestBody AcademyMemberRequest request) {
        return ResponseEntity.ok(service.updateMember(academyId, userId, request));
    }


    @PostMapping("/{userId}/graduate")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<AcademyMemberResponse> graduateMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId,
            @Valid @RequestBody GraduationRequest request,
            @AuthenticationPrincipal Jwt jwt) { // JWT injetado

        UUID promoterId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(service.graduateMember(academyId, userId, request, promoterId));
    }

    @PatchMapping("/{userId}/approve")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<AcademyMemberResponse> approveMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId) {
        return ResponseEntity.ok(service.approveMember(academyId, userId));
    }

    @PatchMapping("/{userId}/reject")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Void> rejectMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId) {
        service.rejectMember(academyId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<Page<AcademyMemberResponse>> getAll(
            @PathVariable UUID academyId,
            @RequestParam(required = false) String query,
            @RequestParam(required = false) MemberStatus status, // Novo Filtro
            @PageableDefault(size = 20, sort = "user.name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(service.findAll(academyId, query, status, pageable));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("@academySecurity.isSameUser(authentication, #userId)")
    public ResponseEntity<AcademyMemberResponse> getMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId) {
        return ResponseEntity.ok(service.   findById(academyId, userId));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId) {
        service.removeMember(academyId, userId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> leaveAcademy(
            @PathVariable UUID academyId,
            @AuthenticationPrincipal Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        service.leaveAcademy(academyId, userId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{userId}/graduations")
    @PreAuthorize("@academySecurity.isSameUser(authentication, #userId) or @academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Page<GraduationHistoryResponse>> getMemberGraduations(
            @PathVariable UUID academyId,
            @PathVariable UUID userId,
            @PageableDefault(size = 20, sort = "graduationDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.findGraduationHistoryByMember(academyId, userId, pageable));
    }

    @GetMapping("/graduations")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Page<GraduationHistoryResponse>> getAcademyGraduations(
            @PathVariable UUID academyId,
            @PageableDefault(size = 20, sort = "graduationDate", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(service.findGraduationHistoryByAcademy(academyId, pageable));
    }

    @GetMapping("/{userId}/attendances")
    @PreAuthorize("@academySecurity.isSameUser(authentication, #userId) or @academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Page<AcademyMenberClassViewResponse>> getMemberAttendances(
            @PathVariable UUID academyId,
            @PathVariable UUID userId,
            @RequestParam(required = false) CheckInStatus status,
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        return ResponseEntity.ok(attendanceService.findClassViewsByStudentAndAcademy(academyId, userId, status, pageable));
    }
}
