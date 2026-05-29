package com.bjj.evolution.user;

import com.bjj.evolution.user.domain.dto.ProfileRequest;
import com.bjj.evolution.user.domain.dto.ProfileResponse;
import com.bjj.evolution.user.domain.dto.RoleUpdateRequest;
import com.bjj.evolution.user.domain.dto.SearchProfileResponse;
import com.bjj.evolution.user.domain.dto.UserDataExportResponse;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

@RestController
@RequestMapping("profiles")
public class UserProfileController {

    private final UserProfileService service;
    private final UserDataExportService exportService;

    public UserProfileController(UserProfileService service, UserDataExportService exportService) {
        this.service = service;
        this.exportService = exportService;
    }

    @GetMapping
    public ResponseEntity<ProfileResponse> getProfile(@AuthenticationPrincipal Jwt jwt) {
        return service.getMyProfile(jwt)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/search")
    public ResponseEntity<Page<SearchProfileResponse>> searchProfile(@RequestParam String query,
                                                                     @PageableDefault(size = 10, sort = "nickname", direction = Sort.Direction.ASC)
                                                      Pageable pageable) {
        return ResponseEntity.ok(service.searchProfile(query, pageable));
    }


    @PostMapping
    public ResponseEntity<ProfileResponse> updateProfile(
            @AuthenticationPrincipal Jwt jwt,
            @Valid @RequestBody ProfileRequest profileRequest) {
        return ResponseEntity.ok(service.saveOrUpdate(jwt, profileRequest));
    }

    @PatchMapping("/{userId}/role")
    public ResponseEntity<ProfileResponse> updateUserRole(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable UUID userId,
            @Valid @RequestBody RoleUpdateRequest request) {
        return ResponseEntity.ok(service.updateRole(jwt, userId, request.role()));
    }
    
    

    @PostMapping(value = "/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ProfileResponse> uploadPhoto(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(service.updatePhoto(jwt, file));
    }

    @DeleteMapping("/photo")
    public ResponseEntity<ProfileResponse> removePhoto(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok(service.removePhoto(jwt));
    }

    @GetMapping("/export")
    public ResponseEntity<UserDataExportResponse> exportMyData(@AuthenticationPrincipal Jwt jwt) {
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"my-data.json\"")
                .body(exportService.export(jwt));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteProfile(@AuthenticationPrincipal Jwt jwt) {
        service.deleteMyProfile(jwt);
        return ResponseEntity.noContent().build();
    }
}
