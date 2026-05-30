package com.bjj.evolution.shared.filter;

import com.bjj.evolution.user.UserProfileRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Persists the authenticated user's email (from the Supabase JWT {@code email}
 * claim) onto their {@link com.bjj.evolution.user.domain.UserProfile}, so that
 * notifications sent outside a request context (async listeners, the reminder
 * job) have a recipient address.
 *
 * Runs as a servlet filter <em>inside</em> Spring Security's chain (which is
 * ordered -100), so the {@link SecurityContextHolder} is already populated.
 * An in-memory cache of the last-synced email per user keeps this to a single
 * DB touch per (user, email) for the lifetime of the process — there is no
 * per-request database cost once a user is in sync.
 */
@Component
@Order(3)
public class UserEmailSyncFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(UserEmailSyncFilter.class);

    private final UserProfileRepository userProfileRepository;
    private final ConcurrentHashMap<UUID, String> syncedEmails = new ConcurrentHashMap<>();

    public UserEmailSyncFilter(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            syncEmail();
        } catch (Exception e) {
            // Email sync is best-effort and must never break a request.
            log.debug("Email sync skipped: {}", e.getMessage());
        }
        filterChain.doFilter(request, response);
    }

    private void syncEmail() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt jwt)) {
            return;
        }
        String email = jwt.getClaimAsString("email");
        if (email == null || email.isBlank()) {
            return;
        }
        UUID userId;
        try {
            userId = UUID.fromString(jwt.getSubject());
        } catch (IllegalArgumentException e) {
            return;
        }
        if (email.equals(syncedEmails.get(userId))) {
            return; // already in sync within this process — no DB touch
        }
        userProfileRepository.findById(userId).ifPresent(profile -> {
            if (!email.equals(profile.getEmail())) {
                profile.setEmail(email);
                userProfileRepository.save(profile);
                log.info("Synced email for user={}", userId);
            }
            syncedEmails.put(userId, email);
        });
    }
}
