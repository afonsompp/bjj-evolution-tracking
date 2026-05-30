package com.bjj.evolution.shared.notification;

/**
 * Delivery channels a notification can be routed through. Only {@link #EMAIL} is
 * implemented today; {@link #PUSH} and {@link #WHATSAPP} are placeholders for the
 * planned phases (each will add its own {@link NotificationSender}).
 */
public enum NotificationChannel {
    EMAIL,
    PUSH,
    WHATSAPP
}
