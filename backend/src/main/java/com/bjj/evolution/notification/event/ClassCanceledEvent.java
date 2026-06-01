package com.bjj.evolution.notification.event;

import java.util.List;
import java.util.UUID;

/**
 * A class was canceled — notifies the students who had an active check-in at the
 * moment of cancellation. Their check-ins are canceled in the same transaction, so
 * the recipients are captured here rather than re-queried (they are no longer active).
 */
public record ClassCanceledEvent(Long classId, List<UUID> recipientStudentIds) implements NotificationEvent {
}
