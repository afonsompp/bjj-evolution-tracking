package com.bjj.evolution.shared.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Routes a rendered {@link OutboundNotification} to the {@link NotificationSender}
 * registered for its {@link NotificationChannel}. Senders are discovered from the
 * Spring context, so adding a channel needs no change here.
 */
@Component
public class NotificationDispatcher {

    private static final Logger log = LoggerFactory.getLogger(NotificationDispatcher.class);

    private final Map<NotificationChannel, NotificationSender> sendersByChannel;

    public NotificationDispatcher(List<NotificationSender> senders) {
        this.sendersByChannel = new EnumMap<>(NotificationChannel.class);
        for (NotificationSender sender : senders) {
            this.sendersByChannel.putIfAbsent(sender.channel(), sender);
        }
        log.info("Notification channels available: {}", sendersByChannel.keySet());
    }

    public void dispatch(OutboundNotification message) {
        NotificationSender sender = sendersByChannel.get(message.channel());
        if (sender == null) {
            log.warn("No sender for channel={} (type={}) — dropping notification", message.channel(), message.type());
            return;
        }
        sender.send(message);
    }
}
