package com.bjj.evolution.notification;

import com.bjj.evolution.notification.event.NotificationEvent;
import com.bjj.evolution.shared.notification.NotificationDispatcher;
import com.bjj.evolution.shared.notification.OutboundNotification;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.util.List;

/**
 * Handles {@link NotificationEvent}s after the triggering transaction commits,
 * off the request thread. Mirrors {@code AuditEventListener}: render (reads) +
 * dispatch (sends). A failed notification is logged, never rethrown.
 */
@Component
public class NotificationEventListener {

    private static final Logger log = LoggerFactory.getLogger(NotificationEventListener.class);

    private final NotificationRenderer renderer;
    private final NotificationDispatcher dispatcher;

    public NotificationEventListener(NotificationRenderer renderer, NotificationDispatcher dispatcher) {
        this.renderer = renderer;
        this.dispatcher = dispatcher;
    }

    @Async("notificationTaskExecutor")
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(NotificationEvent event) {
        try {
            List<OutboundNotification> messages = renderer.render(event);
            messages.forEach(dispatcher::dispatch);
            log.debug("Handled {}: dispatched {} notification(s)", event.getClass().getSimpleName(), messages.size());
        } catch (Exception e) {
            log.error("Failed to handle notification event {}: {}", event.getClass().getSimpleName(), e.getMessage(), e);
        }
    }
}
