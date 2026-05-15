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

    private final UserProfileRepository repository;

    public UserProfileService(UserProfileRepository repository) {
        this.repository = repository;
    }

    public ProfileResponse saveOrUpdate(Jwt jwt, ProfileRequest request) {
        UUID userId = UUID.fromString(jwt.getSubject());

        UserProfile profile = repository.findById(userId)
                .map(existing -> {
                    if (!existing.getNickname().equals(request.nickname()) &&
                            repository.existsByNickname(request.nickname())) {
                        throw new ConflictException("Nickname is already taken.");
                    }
                    existing.setName(request.name());
                    existing.setSecondName(request.secondName());
                    existing.setNickname(request.nickname());
                    existing.setBelt(request.belt());
                    existing.setStripe(request.stripe());
                    existing.setStartsIn(request.startsIn());
                    return existing;
                })
                .orElseGet(() -> {
                    if (repository.existsByNickname(request.nickname())) {
                        throw new ConflictException("Nickname is already taken.");
                    }
                    return request.toEntity(userId);
                });

        UserProfile saved = repository.save(profile);
        return ProfileResponse.fromEntity(saved);
    }

    public ProfileResponse updateRole(Jwt jwt, UUID targetUserId, UserRole newRole) {
        UUID currentUserId = UUID.fromString(jwt.getSubject());

        UserProfile currentUser = repository.findById(currentUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Current user profile not found"));

        if (!SecurityUtils.isAdminOrManager(currentUser)) {
            throw new ForbiddenException("Only admins or managers can update user roles.");
        }

        if (newRole == UserRole.ADMIN && SecurityUtils.isManager(currentUser)) {
            throw new ForbiddenException("Only admins can assign the ADMIN role.");
        }

        UserProfile targetUser = repository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User", targetUserId));

        targetUser.setRole(newRole);
        UserProfile saved = repository.save(targetUser);
        return ProfileResponse.fromEntity(saved);
    }

    public Optional<ProfileResponse> getMyProfile(Jwt jwt) {
        return repository.findById(UUID.fromString(jwt.getSubject()))
                .map(ProfileResponse::fromEntity);
    }

    public Page<SearchProfileResponse> searchProfile(String query, Pageable pageable) {
        return repository.searchByTerm(query, pageable)
                .map(SearchProfileResponse::fromEntity);
    }

    public void deleteMyProfile(Jwt jwt) {
        repository.deleteById(UUID.fromString(jwt.getSubject()));
    }
}
