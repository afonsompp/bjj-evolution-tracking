package com.bjj.evolution.shared.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for outbound email via Resend (https://resend.com).
 *
 * Email is sent through Resend's REST API, so switching provider later is only
 * a new {@link NotificationSender} implementation — calling code never changes.
 * Leave {@code enabled=false} (or omit the API key) to boot with the
 * {@link DisabledEmailSender} fallback, which logs messages instead of sending.
 *
 * Resend values (Dashboard → API Keys / Domains):
 *   apiKey     a Resend API key ("re_...")
 *   fromEmail  a verified sender (use {@code onboarding@resend.dev} for testing)
 *   fromName   display name shown to recipients
 */
@ConfigurationProperties(prefix = "notification.resend")
public record ResendProperties(
        boolean enabled,
        String apiKey,
        String fromEmail,
        String fromName
) {
    public ResendProperties {
        if (fromName == null || fromName.isBlank()) fromName = "BJJ Evolution";
    }

    /** RFC 5322 {@code From} value, e.g. {@code BJJ Evolution <noreply@...>}. */
    public String from() {
        return "%s <%s>".formatted(fromName, fromEmail);
    }

    /** True when email can actually be sent (enabled + key + sender configured). */
    public boolean isConfigured() {
        return enabled
                && apiKey != null && !apiKey.isBlank()
                && fromEmail != null && !fromEmail.isBlank();
    }
}
