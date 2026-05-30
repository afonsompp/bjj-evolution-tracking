package com.bjj.evolution.shared.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Fallback used when email is not configured ({@code notification.resend.enabled=false}
 * or no API key). Lets the application boot and run in environments without email
 * (local, tests) by logging what would have been sent instead of delivering it.
 */
public class DisabledEmailSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(DisabledEmailSender.class);

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.EMAIL;
    }

    @Override
    public void send(OutboundNotification message) {
        log.warn("""
                Email channel is disabled — not sending (configure notification.resend.* to enable).
                  type={} to={} subject={}
                {}""",
                message.type(), message.toEmail(), message.subject(),
                message.text() != null ? message.text() : message.html());
    }
}
