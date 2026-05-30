package com.bjj.evolution.admin;

import com.bjj.evolution.admin.domain.dto.AdminUserResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("admin/users")
public class AdminUserController {

    private final AdminUserService service;

    public AdminUserController(AdminUserService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<Page<AdminUserResponse>> searchUsers(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false, defaultValue = "") String query,
            @PageableDefault(size = 20, sort = "nickname", direction = Sort.Direction.ASC) Pageable pageable) {
        return ResponseEntity.ok(service.searchUsers(jwt, query, pageable));
    }
}
