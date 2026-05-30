package com.bjj.evolution.notification.event;

import java.util.UUID;

/** A user requested to join an academy — notifies the academy's owners/managers. */
public record MemberJoinRequestedEvent(UUID academyId, UUID requesterUserId) implements NotificationEvent {
}
