package com.bjj.evolution.shared.notification;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Wires the notification channel senders. When {@code notification.resend.enabled=true}
 * a real {@link ResendEmailSender} is created; otherwise a {@link DisabledEmailSender}
 * keeps the app bootable. Mirrors {@code StorageConfig}.
 *
 * Future channels (push, whatsapp) add their own {@link NotificationSender} beans here;
 * {@link NotificationDispatcher} picks them up automatically.
 */
@Configuration
public class NotificationConfig {

    @Bean
    @ConditionalOnProperty(prefix = "notification.resend", name = "enabled", havingValue = "true")
    public NotificationSender resendEmailSender(ResendProperties props) {
        return new ResendEmailSender(props);
    }

    @Bean
    @ConditionalOnMissingBean(NotificationSender.class)
    public NotificationSender disabledEmailSender() {
        return new DisabledEmailSender();
    }
}
