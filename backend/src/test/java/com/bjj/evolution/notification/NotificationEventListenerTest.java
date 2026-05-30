package com.bjj.evolution.notification;

import com.bjj.evolution.notification.event.MemberApprovedEvent;
import com.bjj.evolution.notification.event.NotificationEvent;
import com.bjj.evolution.shared.notification.NotificationDispatcher;
import com.bjj.evolution.shared.notification.OutboundNotification;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationEventListenerTest {

    @Mock
    private NotificationRenderer renderer;

    @Mock
    private NotificationDispatcher dispatcher;

    @InjectMocks
    private NotificationEventListener listener;

    @Test
    void handle_rendersAndDispatchesEachMessage() {
        NotificationEvent event = new MemberApprovedEvent(UUID.randomUUID(), UUID.randomUUID());
        OutboundNotification m1 = OutboundNotification.email(UUID.randomUUID(), "a@x.com", "A", "s", "<p>", "t", "T");
        OutboundNotification m2 = OutboundNotification.email(UUID.randomUUID(), "b@x.com", "B", "s", "<p>", "t", "T");
        when(renderer.render(event)).thenReturn(List.of(m1, m2));

        listener.handle(event);

        verify(renderer).render(event);
        verify(dispatcher).dispatch(m1);
        verify(dispatcher).dispatch(m2);
    }

    @Test
    void handle_swallowsExceptions() {
        NotificationEvent event = new MemberApprovedEvent(UUID.randomUUID(), UUID.randomUUID());
        when(renderer.render(event)).thenThrow(new RuntimeException("boom"));

        assertThatCode(() -> listener.handle(event)).doesNotThrowAnyException();
    }
}
