package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.member.domain.dto.AcademyMemberRequest;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberResponse;
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

    public AcademyMemberController(AcademyMemberService service) {
        this.service = service;
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
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
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
            @Valid @RequestBody GraduationRequest request) {
        return ResponseEntity.ok(service.graduateMember(academyId, userId, request));
    }

    @PatchMapping("/{userId}/approve")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<AcademyMemberResponse> approveMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId) {
        return ResponseEntity.ok(service.approveMember(academyId, userId));
    }


    @GetMapping
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<Page<AcademyMemberResponse>> getAll(
            @PathVariable UUID academyId,
            @RequestParam(required = false) String query,
            @PageableDefault(size = 20, sort = "user.name", direction = Sort.Direction.ASC) Pageable pageable
    ) {
        return ResponseEntity.ok(service.findAll(academyId, query, pageable));
    }

    @GetMapping("/{userId}")
    @PreAuthorize("@academySecurity.hasAccess(authentication, #academyId)")
    public ResponseEntity<AcademyMemberResponse> getMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId) {
        return ResponseEntity.ok(service.findById(academyId, userId));
    }

    @DeleteMapping("/{userId}")
    @PreAuthorize("@academySecurity.isInstructorOrAdmin(authentication, #academyId)")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID academyId,
            @PathVariable UUID userId) {
        service.removeMember(academyId, userId);
        return ResponseEntity.noContent().build();
    }
}
