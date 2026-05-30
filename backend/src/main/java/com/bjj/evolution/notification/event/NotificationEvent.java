package com.bjj.evolution.notification.event;

/**
 * Marker for domain events that should produce one or more notifications.
 * Services publish these via {@code ApplicationEventPublisher}; a single
 * {@code NotificationEventListener} handles them after the triggering
 * transaction commits.
 *
 * Events carry only identifiers (and minimal scalars) — the renderer reloads
 * fresh data through repositories, since it runs on an async thread with no
 * open persistence session.
 */
public sealed interface NotificationEvent
        permits MemberJoinRequestedEvent,
                MemberApprovedEvent,
                MemberRejectedEvent,
                ClassUpdatedEvent,
                ClassCanceledEvent {
}
