package com.bjj.evolution.shared.notification;

/**
 * A single delivery channel (email, push, whatsapp). Implementations are wired
 * conditionally (see {@code NotificationConfig}) and selected by channel in
 * {@link NotificationDispatcher}. Adding a channel = adding one implementation;
 * no domain code changes.
 */
public interface NotificationSender {

    /** Channel this sender handles. */
    NotificationChannel channel();

    /**
     * Best-effort send. Implementations must not throw on delivery failure —
     * a failed notification should never break the business flow that triggered it.
     */
    void send(OutboundNotification message);
}
