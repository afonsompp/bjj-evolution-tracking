package com.bjj.evolution.notification.event;

import java.util.UUID;

/** A pending member was approved — notifies the student. */
public record MemberApprovedEvent(UUID academyId, UUID userId) implements NotificationEvent {
}
