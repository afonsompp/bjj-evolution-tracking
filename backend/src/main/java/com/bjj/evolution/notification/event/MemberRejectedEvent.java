package com.bjj.evolution.notification.event;

import java.util.UUID;

/** A pending join request was rejected — notifies the student. */
public record MemberRejectedEvent(UUID academyId, UUID userId) implements NotificationEvent {
}
