package com.bjj.evolution.shared.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * {@link NotificationSender} for the {@link NotificationChannel#EMAIL} channel,
 * backed by Resend's REST API. Wired only when {@code notification.resend.enabled=true}
 * (see {@code NotificationConfig}); otherwise {@link DisabledEmailSender} is used.
 *
 * <p>Sends are retried with exponential backoff on <em>transient</em> failures
 * (network I/O errors, HTTP 5xx, HTTP 429). <em>Permanent</em> failures (other 4xx,
 * e.g. 403 from the onboarding sender, 422 invalid, 401 bad key) are not retried.
 * After exhausting attempts the failure is logged and swallowed — a failed email
 * must never break the business flow that triggered it.
 */
public class ResendEmailSender implements NotificationSender {

    private static final Logger log = LoggerFactory.getLogger(ResendEmailSender.class);

    private static final int DEFAULT_MAX_ATTEMPTS = 3;
    private static final long DEFAULT_BACKOFF_MS = 1000L;
    private static final long MAX_BACKOFF_MS = 10_000L;

    private final ResendProperties props;
    private final RestClient client;
    private final int maxAttempts;
    private final long backoffMs;

    public ResendEmailSender(ResendProperties props) {
        this(props, defaultClient(props), DEFAULT_MAX_ATTEMPTS, DEFAULT_BACKOFF_MS);
    }

    /** Package-private constructor for tests (inject a RestClient + tune retry/backoff). */
    ResendEmailSender(ResendProperties props, RestClient client, int maxAttempts, long backoffMs) {
        this.props = props;
        this.client = client;
        this.maxAttempts = Math.max(1, maxAttempts);
        this.backoffMs = Math.max(0, backoffMs);
    }

    private static RestClient defaultClient(ResendProperties props) {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(Duration.ofSeconds(5));
        factory.setReadTimeout(Duration.ofSeconds(10));
        return RestClient.builder()
                .baseUrl("https://api.resend.com")
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + props.apiKey())
                .requestFactory(factory)
                .build();
    }

    @Override
    public NotificationChannel channel() {
        return NotificationChannel.EMAIL;
    }

    @Override
    public void send(OutboundNotification message) {
        if (message.toEmail() == null || message.toEmail().isBlank()) {
            log.warn("Skipping email type={} user={}: recipient has no email on file", message.type(), message.toUserId());
            return;
        }
        Map<String, Object> body = buildBody(message);
        String to = mask(message.toEmail());

        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            String failure;
            try {
                client.post()
                        .uri("/emails")
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(body)
                        .retrieve()
                        .toBodilessEntity();
                if (attempt > 1) {
                    log.info("Email sent type={} to={} (attempt {}/{})", message.type(), to, attempt, maxAttempts);
                } else {
                    log.info("Email sent type={} to={}", message.type(), to);
                }
                return;
            } catch (RestClientResponseException e) {
                if (!isRetryable(e.getStatusCode())) {
                    log.error("Email rejected (no retry) type={} to={} status={}: {}",
                            message.type(), to, e.getStatusCode().value(), e.getResponseBodyAsString());
                    return;
                }
                failure = "HTTP " + e.getStatusCode().value();
            } catch (ResourceAccessException e) {
                failure = "I/O error: " + e.getMessage();
            } catch (Exception e) {
                log.error("Email send failed (unexpected) type={} to={}: {}", message.type(), to, e.getMessage());
                return;
            }

            if (attempt < maxAttempts) {
                long delay = backoffFor(attempt);
                log.warn("Email send attempt {}/{} failed type={} to={} ({}); retrying in {}ms",
                        attempt, maxAttempts, message.type(), to, failure, delay);
                sleep(delay);
            } else {
                log.error("Email send failed after {} attempts type={} to={}: {}",
                        maxAttempts, message.type(), to, failure);
            }
        }
    }

    private Map<String, Object> buildBody(OutboundNotification message) {
        Map<String, Object> body = new HashMap<>();
        body.put("from", props.from());
        body.put("to", List.of(message.toEmail()));
        body.put("subject", message.subject());
        if (message.html() != null) body.put("html", message.html());
        if (message.text() != null) body.put("text", message.text());
        return body;
    }

    /** Retry on server errors and rate limiting; never on other client errors. */
    private static boolean isRetryable(HttpStatusCode status) {
        return status.is5xxServerError() || status.value() == 429;
    }

    private long backoffFor(int attempt) {
        long delay = (long) (backoffMs * Math.pow(3, attempt - 1));
        return Math.min(delay, MAX_BACKOFF_MS);
    }

    private static void sleep(long millis) {
        if (millis <= 0) return;
        try {
            Thread.sleep(millis);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }

    /** Masks the local-part for privacy-friendly logs, e.g. {@code j***@gmail.com}. */
    private static String mask(String email) {
        int at = email.indexOf('@');
        if (at <= 1) return "***" + (at >= 0 ? email.substring(at) : "");
        return email.charAt(0) + "***" + email.substring(at);
    }
}
