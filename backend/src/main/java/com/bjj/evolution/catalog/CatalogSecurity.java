package com.bjj.evolution.catalog;

import com.bjj.evolution.shared.utils.SecurityUtils;
import com.bjj.evolution.user.UserProfileRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Component("catalogSecurity")
public class CatalogSecurity {

    private static final Logger log = LoggerFactory.getLogger(CatalogSecurity.class);
    private final UserProfileRepository userProfileRepository;

    public CatalogSecurity(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    public boolean isGlobalAdmin(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }

        try {
            UUID userId = SecurityUtils.getCurrentUserId();
            return userProfileRepository.findById(userId)
                    .map(profile -> {
                        boolean authorized = SecurityUtils.isAdminOrPlatformManager(profile);
                        if (!authorized) {
                            log.warn("Global admin access denied: user={} role={}", userId, profile.getRole());
                        }
                        return authorized;
                    })
                    .orElseGet(() -> {
                        log.warn("Global admin access denied: user profile not found user={}", userId);
                        return false;
                    });
        } catch (Exception e) {
            log.error("Error evaluating catalog security", e);
            return false;
        }
    }
}
