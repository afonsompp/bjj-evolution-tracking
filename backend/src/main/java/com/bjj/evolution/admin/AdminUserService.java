package com.bjj.evolution.admin;

import com.bjj.evolution.admin.domain.dto.AdminUserResponse;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.shared.utils.SecurityUtils;
import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class AdminUserService {

    private static final Logger log = LoggerFactory.getLogger(AdminUserService.class);

    private final UserProfileRepository repository;

    public AdminUserService(UserProfileRepository repository) {
        this.repository = repository;
    }

    /**
     * Paginated user search for the admin panel. Restricted to ADMIN — the role
     * is stored on the profile (not the JWT), so we load the caller's profile and
     * check it here, mirroring UserProfileService#updateRole.
     */
    public Page<AdminUserResponse> searchUsers(Jwt jwt, String query, Pageable pageable) {
        requireAdmin(jwt);
        String term = query == null ? "" : query.trim();
        log.debug("Admin user search query='{}' page={} size={}", term, pageable.getPageNumber(), pageable.getPageSize());
        return repository.searchForAdmin(term, pageable)
                .map(AdminUserResponse::fromEntity);
    }

    private void requireAdmin(Jwt jwt) {
        UUID currentUserId = UUID.fromString(jwt.getSubject());
        UserProfile currentUser = repository.findById(currentUserId)
                .orElseThrow(() -> {
                    log.error("Admin access denied: caller profile not found user={}", currentUserId);
                    return new ResourceNotFoundException("Current user profile not found");
                });
        if (!SecurityUtils.isAdmin(currentUser)) {
            log.warn("Admin access denied: user={} role={} is not ADMIN", currentUserId, currentUser.getRole());
            throw new ForbiddenException("Only admins can manage users.");
        }
    }
}
