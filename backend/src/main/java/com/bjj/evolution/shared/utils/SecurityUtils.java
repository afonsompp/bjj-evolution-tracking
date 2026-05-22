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

    public static boolean isAdminOrPlatformManager(UserProfile profile) {
        return isAdmin(profile) || isPlatformManager(profile);
    }

    public static boolean isNotAdminOrPlatformManager(UserProfile profile) {
        return !isAdminOrPlatformManager(profile);
    }

    public static boolean isPlatformManager(UserProfile profile) {
        return profile != null && profile.getRole() == UserRole.PLATFORM_MANAGER;
    }

}
