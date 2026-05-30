package com.bjj.evolution.shared.notification;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class NotificationDispatcherTest {

    @Mock
    private NotificationSender emailSender;

    @Test
    void dispatch_routesToSenderForChannel() {
        when(emailSender.channel()).thenReturn(NotificationChannel.EMAIL);
        NotificationDispatcher dispatcher = new NotificationDispatcher(List.of(emailSender));

        OutboundNotification message =
                OutboundNotification.email(UUID.randomUUID(), "a@b.com", "A", "subject", "<p>", "text", "TYPE");
        dispatcher.dispatch(message);

        verify(emailSender).send(message);
    }

    @Test
    void dispatch_dropsWhenNoSenderForChannel() {
        when(emailSender.channel()).thenReturn(NotificationChannel.EMAIL);
        NotificationDispatcher dispatcher = new NotificationDispatcher(List.of(emailSender));

        OutboundNotification push = new OutboundNotification(
                UUID.randomUUID(), "a@b.com", "A", "pt-BR", "subject", "<p>", "text",
                NotificationChannel.PUSH, "TYPE");
        dispatcher.dispatch(push);

        verify(emailSender, never()).send(any());
    }
}
