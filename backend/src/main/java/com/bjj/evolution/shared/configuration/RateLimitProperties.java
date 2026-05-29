package com.bjj.evolution.shared.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

@ConfigurationProperties(prefix = "rate-limit")
public record RateLimitProperties(
        boolean enabled,
        List<Rule> rules
) {

    public RateLimitProperties {
        if (rules == null) {
            rules = List.of();
        }
    }

    public record Rule(
            String pathPattern,
            int capacity,
            int refillPerMinute
    ) {
    }
}
