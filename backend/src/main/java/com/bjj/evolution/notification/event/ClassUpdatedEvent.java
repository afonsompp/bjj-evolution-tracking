package com.bjj.evolution.notification.event;

/** A class's schedule changed (time and/or instructor) — notifies enrolled students. */
public record ClassUpdatedEvent(Long classId) implements NotificationEvent {
}
