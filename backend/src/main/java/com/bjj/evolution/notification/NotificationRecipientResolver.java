package com.bjj.evolution.notification;

import com.bjj.evolution.user.UserProfileRepository;
import com.bjj.evolution.user.domain.UserProfile;
import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.UUID;

/**
 * Resolves a user id (or profile) into the contact details needed to send a
 * notification — email and a display name. Anonymized (deleted) profiles are
 * never returned as recipients.
 */
@Component
public class NotificationRecipientResolver {

    private final UserProfileRepository userProfileRepository;

    public NotificationRecipientResolver(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    public Optional<Recipient> forUser(UUID userId) {
        return userProfileRepository.findById(userId)
                .filter(profile -> !profile.isAnonymized())
                .map(NotificationRecipientResolver::toRecipient);
    }

    public Recipient forProfile(UserProfile profile) {
        return toRecipient(profile);
    }

    private static Recipient toRecipient(UserProfile profile) {
        return new Recipient(profile.getId(), profile.getEmail(), displayName(profile));
    }

    /** Friendly name: first (+ second) name, falling back to the nickname. */
    public static String displayName(UserProfile profile) {
        if (profile.getName() != null && !profile.getName().isBlank()) {
            if (profile.getSecondName() != null && !profile.getSecondName().isBlank()) {
                return profile.getName() + " " + profile.getSecondName();
            }
            return profile.getName();
        }
        return profile.getNickname();
    }

    public record Recipient(UUID userId, String email, String name) {
        public boolean hasEmail() {
            return email != null && !email.isBlank();
        }
    }
}
