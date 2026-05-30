package com.bjj.evolution.notification;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for the upcoming-class reminder job ({@link ClassReminderJob}).
 *
 * @param enabled     master switch for the reminder job
 * @param hoursBefore how far ahead to look — a class is reminded once it falls
 *                    within {@code [now, now + hoursBefore]}
 */
@ConfigurationProperties(prefix = "notification.class-reminder")
public record ClassReminderProperties(
        boolean enabled,
        int hoursBefore
) {
    public ClassReminderProperties {
        if (hoursBefore <= 0) hoursBefore = 12;
    }
}
