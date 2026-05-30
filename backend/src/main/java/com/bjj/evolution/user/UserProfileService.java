package com.bjj.evolution.user;

import com.bjj.evolution.shared.exception.BusinessRuleException;
import com.bjj.evolution.shared.exception.ConflictException;
import com.bjj.evolution.shared.exception.ForbiddenException;
import com.bjj.evolution.shared.exception.ResourceNotFoundException;
import com.bjj.evolution.shared.storage.FileStorage;
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
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class UserProfileService {

    private static final Logger log = LoggerFactory.getLogger(UserProfileService.class);

    private static final Set<String> ALLOWED_PHOTO_TYPES =
            Set.of("image/png", "image/jpeg", "image/webp");

    private final UserProfileRepository repository;
    private final FileStorage fileStorage;

    public UserProfileService(UserProfileRepository repository, FileStorage fileStorage) {
        this.repository = repository;
        this.fileStorage = fileStorage;
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
                    existing.setAnonymizedAt(null);
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

        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            profile.setEmail(email);
        }

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
        return repository.findActiveById(userId)
                .map(ProfileResponse::fromEntity);
    }

    public Page<SearchProfileResponse> searchProfile(String query, Pageable pageable) {
        log.debug("Searching profiles query='{}' page={} size={}", query, pageable.getPageNumber(), pageable.getPageSize());
        return repository.searchByTerm(query, pageable)
                .map(SearchProfileResponse::fromEntity);
    }

    public void deleteMyProfile(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        log.warn("Anonymizing profile for user={}", userId);
        UserProfile profile = repository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", userId));
        String oldKey = profile.getPhotoKey();
        profile.anonymize();
        repository.save(profile);
        if (oldKey != null) {
            fileStorage.delete(oldKey);
        }
        log.info("Profile anonymized for user={}", userId);
    }

    public ProfileResponse updatePhoto(Jwt jwt, MultipartFile file) {
        UUID userId = UUID.fromString(jwt.getSubject());

        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("No file provided.");
        }
        if (!ALLOWED_PHOTO_TYPES.contains(file.getContentType())) {
            throw new BusinessRuleException("Unsupported image type. Allowed: PNG, JPEG, WebP.");
        }

        UserProfile profile = repository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", userId));

        byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            throw new BusinessRuleException("Could not read the uploaded file.");
        }

        String previousKey = profile.getPhotoKey();
        String key = fileStorage.upload("avatars/" + userId, file.getOriginalFilename(), content, file.getContentType());
        profile.setPhotoKey(key);
        profile.setPhotoUrl(fileStorage.publicUrl(key));
        UserProfile saved = repository.save(profile);

        if (previousKey != null && !previousKey.equals(key)) {
            fileStorage.delete(previousKey); // best-effort cleanup of the replaced photo
        }
        log.info("Profile photo updated for user={} key={}", userId, key);
        return ProfileResponse.fromEntity(saved);
    }

    public ProfileResponse removePhoto(Jwt jwt) {
        UUID userId = UUID.fromString(jwt.getSubject());
        UserProfile profile = repository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("UserProfile", userId));

        String key = profile.getPhotoKey();
        profile.setPhotoKey(null);
        profile.setPhotoUrl(null);
        UserProfile saved = repository.save(profile);
        if (key != null) {
            fileStorage.delete(key);
        }
        log.info("Profile photo removed for user={}", userId);
        return ProfileResponse.fromEntity(saved);
    }
}
