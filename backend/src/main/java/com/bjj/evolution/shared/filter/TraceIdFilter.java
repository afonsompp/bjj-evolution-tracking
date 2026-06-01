package com.bjj.evolution.shared.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import io.sentry.Sentry;
import org.slf4j.MDC;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.UUID;

@Component
@Order(1)
public class TraceIdFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(TraceIdFilter.class);

    private static final String TRACE_ID_HEADER = "X-Trace-Id";
    private static final String REQUEST_ID_HEADER = "X-Request-Id";
    private static final String MDC_TRACE_ID_KEY = "traceId";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws ServletException, IOException {

        // Use incoming request ID if present, otherwise generate a new trace ID
        String requestId = request.getHeader(REQUEST_ID_HEADER);
        boolean isPropagated = requestId != null && !requestId.isBlank();

        String traceId = isPropagated ? requestId.trim() : UUID.randomUUID().toString().replace("-", "");

        MDC.put(MDC_TRACE_ID_KEY, traceId);
        response.setHeader(TRACE_ID_HEADER, traceId);
        // Tag Sentry events with the same id so a captured exception links back to
        // these logs (and to the frontend, which sends X-Request-Id). No-op when
        // SENTRY_DSN is unset.
        Sentry.configureScope(scope -> scope.setTag("request_id", traceId));

        if (isPropagated) {
            log.debug("Propagating requestId={} from upstream (header {})", traceId, REQUEST_ID_HEADER);
        }

        // Wrap request and response for content caching
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request, 4096);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            // Log request
            log.info("--> {} {} {}",
                    request.getMethod(),
                    getRequestUri(request),
                    request.getQueryString() != null ? "?" + request.getQueryString() : "");

            chain.doFilter(wrappedRequest, wrappedResponse);

        } catch (Exception ex) {
            log.error("Request failed: {} {} - {}", request.getMethod(), getRequestUri(request), ex.getMessage());
            throw ex;

        } finally {
            long duration = System.currentTimeMillis() - startTime;

            // Log response
            int status = wrappedResponse.getStatus();
            log.info("<-- {} {} [{}] {}ms",
                    request.getMethod(),
                    getRequestUri(request),
                    status,
                    duration);

            if (status >= 500) {
                log.warn("Server error: {} {} returned {} in {}ms",
                        request.getMethod(), getRequestUri(request), status, duration);
            } else if (status >= 400) {
                log.warn("Client error: {} {} returned {} in {}ms",
                        request.getMethod(), getRequestUri(request), status, duration);
            }

            // Copy body back to the original response
            wrappedResponse.copyBodyToResponse();

            // Clean up MDC and the Sentry tag (threads are pooled, so leaving
            // them set would bleed into the next request on this thread).
            MDC.remove(MDC_TRACE_ID_KEY);
            Sentry.configureScope(scope -> scope.removeTag("request_id"));
        }
    }

    private String getRequestUri(HttpServletRequest request) {
        String uri = request.getRequestURI();
        if (request.getContextPath() != null) {
            uri = uri.substring(request.getContextPath().length());
        }
        return uri;
    }
}