package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.dto.AcademyRequest;
import com.bjj.evolution.academy.domain.dto.AcademyResponse;
import com.bjj.evolution.academy.member.AcademyMemberService;
import com.bjj.evolution.academy.member.domain.MemberStatus;
import com.bjj.evolution.academy.member.domain.dto.AcademyMemberResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/academies")
public class AcademyController {

    private final AcademyService service;
    private final AcademyMemberService memberService;

    public AcademyController(AcademyService service, AcademyMemberService memberService) {
        this.service = service;
        this.memberService = memberService;
    }

    @PostMapping
    @PreAuthorize("@academySecurity.isPlatformManager(authentication)")
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

    @GetMapping("/memberships")
    public ResponseEntity<Page<AcademyMemberResponse>> getMyMemberships(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) MemberStatus status,
            Pageable pageable) {
        UUID userId = UUID.fromString(jwt.getSubject());
        return ResponseEntity.ok(memberService.findMyMemberships(userId, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademyResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(service.findById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("@academySecurity.isOwner(authentication, #id)")
    public ResponseEntity<AcademyResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody AcademyRequest request) {

        return ResponseEntity.ok(service.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("@academySecurity.isOwner(authentication, #id)")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }
}
