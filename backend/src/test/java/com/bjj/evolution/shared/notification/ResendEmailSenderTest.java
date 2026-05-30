package com.bjj.evolution.shared.notification;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import java.util.UUID;

import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withStatus;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class ResendEmailSenderTest {

    private static final String URL = "https://api.resend.com/emails";

    private final ResendProperties props =
            new ResendProperties(true, "re_test", "onboarding@resend.dev", "BJJ Evolution");

    private final OutboundNotification message =
            OutboundNotification.email(UUID.randomUUID(), "user@example.com", "User", "Sub", "<p>hi</p>", "hi", "TEST");

    /** Builds a sender wired to a MockRestServiceServer, with zero backoff for fast tests. */
    private record Fixture(ResendEmailSender sender, MockRestServiceServer server) {
    }

    private Fixture fixture(int maxAttempts) {
        RestClient.Builder builder = RestClient.builder().baseUrl("https://api.resend.com");
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ResendEmailSender sender = new ResendEmailSender(props, builder.build(), maxAttempts, 0L);
        return new Fixture(sender, server);
    }

    @Test
    void retriesOnServerErrorThenSucceeds() {
        Fixture f = fixture(3);
        f.server().expect(requestTo(URL)).andExpect(method(HttpMethod.POST))
                .andRespond(withStatus(HttpStatus.SERVICE_UNAVAILABLE));
        f.server().expect(requestTo(URL))
                .andRespond(withSuccess("{\"id\":\"abc\"}", MediaType.APPLICATION_JSON));

        f.sender().send(message);

        f.server().verify(); // both calls happened → it retried after the 503
    }

    @Test
    void doesNotRetryOnClientError() {
        Fixture f = fixture(3);
        f.server().expect(requestTo(URL))
                .andRespond(withStatus(HttpStatus.FORBIDDEN).body("{\"error\":\"not allowed\"}"));

        f.sender().send(message);

        f.server().verify(); // exactly one call → 403 was not retried
    }

    @Test
    void stopsAfterMaxAttemptsOnPersistentServerError() {
        Fixture f = fixture(3);
        for (int i = 0; i < 3; i++) {
            f.server().expect(requestTo(URL))
                    .andRespond(withStatus(HttpStatus.BAD_GATEWAY));
        }

        f.sender().send(message); // must not throw

        f.server().verify(); // exactly maxAttempts (3) calls
    }
}
