package com.bjj.evolution.notification.event;

/** A class was canceled — notifies enrolled students. */
public record ClassCanceledEvent(Long classId) implements NotificationEvent {
}
