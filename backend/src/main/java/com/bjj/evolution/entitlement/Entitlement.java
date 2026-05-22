package com.bjj.evolution.entitlement;

import java.time.Instant;
import java.util.Set;
import java.util.UUID;

public record Entitlement(UUID userId, Set<Feature> features, Instant validUntil) {

    public boolean hasFeature(Feature feature) {
        return features.contains(feature);
    }
}
