package com.bjj.evolution.user;

import com.bjj.evolution.user.domain.UserProfile;
import com.bjj.evolution.user.domain.dto.ProfileRequest;
import com.bjj.evolution.user.domain.dto.ProfileResponse;
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
                    existing.setName(request.name());
                    existing.setSecondName(request.secondName());
                    existing.setBelt(request.belt());
                    existing.setStripe(request.stripe());
                    existing.setStartsIn(request.startsIn());
                    return existing;
                })
                .orElse(new UserProfile(
                        userId,
                        request.name(),
                        request.secondName(),
                        request.belt(),
                        request.stripe(),
                        request.startsIn()
                ));

        UserProfile saved = repository.save(profile);
        return ProfileResponse.fromEntity(saved);
    }

    public Optional<ProfileResponse> getMyProfile(Jwt jwt) {
        return repository.findById(UUID.fromString(jwt.getSubject()))
                .map(ProfileResponse::fromEntity);
    }

    public void deleteMyProfile(Jwt jwt) {
        repository.deleteById(UUID.fromString(jwt.getSubject()));
    }
}
