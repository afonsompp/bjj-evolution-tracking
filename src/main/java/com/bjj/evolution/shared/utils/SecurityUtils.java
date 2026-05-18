package com.bjj.evolution.shared.utils;

import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;

import java.util.UUID;

public class SecurityUtils {

    public static UUID getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new IllegalStateException("No authenticated user found in security context");
        }
        Jwt jwt = (Jwt) authentication.getPrincipal();
        return UUID.fromString(jwt.getSubject());
    }

    public static boolean isAdmin(UserProfile profile) {
        return profile != null && profile.getRole() == UserRole.ADMIN;
    }

    public static boolean isAdminOrManager(UserProfile profile) {
        return isAdmin(profile) || isManager(profile);
    }

    public static boolean isNotAdminOrManager(UserProfile profile) {
        return !isAdminOrManager(profile);
    }

    public static boolean isManager(UserProfile profile) {
        return profile != null && profile.getRole() == UserRole.MANAGER;
    }

    public static boolean isAcademyOwner(UserProfile profile) {
        return profile != null && profile.getRole() == UserRole.ACADEMY_OWNER;
    }

}
