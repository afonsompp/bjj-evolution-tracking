package com.bjj.evolution.user;

import com.bjj.evolution.shared.exception.ConflictException;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.shared.utils.SecurityUtils;
import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.UserRole;
import com.bjj.evolution.user.domain.dto.ProfileRequest;
import com.bjj.evolution.user.domain.dto.ProfileResponse;
import com.bjj.evolution.user.domain.dto.SearchProfileResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;

import java.util.Optional;
import java.util.UUID;

@Service
public class UserProfileService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileService.class);

    private final UserProfileRepository repository;

    public UserProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    public ProfileResponse saveOrUpdate(Jwt jwt, ProfileRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());

        UserProfile profile = repository.findById(userId)
                .map(existing -> {
                    log.info("Updating profile for user={} nickname={}", userId, existing.getNickname());

                    if (!existing.getNickname().equals(request.nickname()) &&
                            repository.existsByNickname(request.nickname())) {
                        log.warn("Nickname conflict on update: user={} attempted nickname={}", userId, request.nickname());
                        throw new ConflictException("Nickname is already taken.");
                    }
                    existing.setName(request.name());
                    existing.setSecondName(request.secondName());
                    existing.setNickname(request.nickname());
                    existing.setBelt(request.belt());
                    existing.setBeltStripe(request.beltStripe());
                    existing.setStartsIn(request.startsIn());
                    return existing;
                })
                .orElseGet(() -> {
                    if (repository.existsByNickname(request.nickname())) {
                        log.warn("Nickname conflict on create: user={} attempted nickname={}", userId, request.nickname());
                        throw new ConflictException("Nickname is already taken.");
                    }
                    log.info("Creating new profile for user={} nickname={}", userId, request.nickname());
                    return request.toEntity(userId);
                });

        UserProfile saved = repository.save(profile);
        log.info("Profile saved successfully for user={} nickname={}", saved.getId(), saved.getNickname());
        return ProfileResponse.fromEntity(saved);
    }

    public ProfileResponse updateRole(Jwt jwt, UUID targetUserId, UserRole newRole) {
        UUID currentUserId = UUID.fromString(jwt.getSubject());

        log.info("Role update requested: actor={} target={} newRole={}", currentUserId, targetUserId, newRole);

        UserProfile currentUser = repository.findById(currentUserId)
                .orElseThrow(() -> {
                    log.error("Role update failed: actor profile not found user={}", currentUserId);
                    return new ResourceNotFoundException("Current user profile not found");
                });

        if (!SecurityUtils.isAdminOrPlatformManager(currentUser)) {
            log.warn("Role update denied: actor={} lacks admin/platform-manager privileges (role={})",
                    currentUserId, currentUser.getRole());
            throw new ForbiddenException("Only admins or platform managers can update user roles.");
        }

        if (newRole == UserRole.ADMIN && SecurityUtils.isPlatformManager(currentUser)) {
            log.warn("Role update denied: manager actor={} attempted to assign ADMIN to target={}",
                    currentUserId, targetUserId);
            throw new ForbiddenException("Only admins can assign the ADMIN role.");
        }

        UserProfile targetUser = repository.findById(targetUserId)
                .orElseThrow(() -> {
                    log.error("Role update failed: target user not found user={}", targetUserId);
                    return new ResourceNotFoundException("User", targetUserId);
                });

        UserRole oldRole = targetUser.getRole();
        targetUser.setRole(newRole);
        UserProfile saved = repository.save(targetUser);
        log.info("Role updated: actor={} changed target={} from {} to {}",
                currentUserId, targetUserId, oldRole, newRole);
        return ProfileResponse.fromEntity(saved);
    }

    public Optional<ProfileResponse> getMyProfile(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        log.debug("Fetching profile for user={}", userId);
        return repository.findById(userId)
                .map(ProfileResponse::fromEntity);
    }

    public Page<SearchProfileResponse> searchProfile(String query, Pageable pageable) {
        log.debug("Searching profiles query='{}' page={} size={}", query, pageable.getPageNumber(), pageable.getPageSize());
        return repository.searchByTerm(query, pageable)
                .map(SearchProfileResponse::fromEntity);
    }

    public void deleteMyProfile(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        log.warn("Deleting profile for user={}", userId);
        repository.deleteById(userId);
        log.info("Profile deleted for user={}", userId);
    }
}
