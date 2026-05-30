package com.bjj.evolution.shared.notification;

import java.util.UUID;

/**
 * A fully-rendered, channel-agnostic message ready to be dispatched. The domain
 * layer produces these (resolving recipient + content); {@link NotificationDispatcher}
 * routes them to the {@link NotificationSender} for the chosen {@link #channel()}.
 *
 * @param type a stable identifier of what triggered this (e.g. {@code MEMBER_APPROVED}),
 *             used for logging and, later, per-user preferences.
 */
public record OutboundNotification(
        UUID toUserId,
        String toEmail,
        String toName,
        String locale,
        String subject,
        String html,
        String text,
        NotificationChannel channel,
        String type
) {
    /** Convenience factory for an email notification (locale defaults to pt-BR). */
    public static OutboundNotification email(UUID toUserId, String toEmail, String toName,
                                             String subject, String html, String text, String type) {
        return new OutboundNotification(toUserId, toEmail, toName, "pt-BR",
                subject, html, text, NotificationChannel.EMAIL, type);
    }
}
