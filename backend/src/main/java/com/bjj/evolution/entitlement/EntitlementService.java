package com.bjj.evolution.entitlement;

import org.springframework.stereotype.Service;

import java.util.EnumSet;
import java.util.UUID;

@Service
public class EntitlementService {

    public Entitlement resolveFor(UUID userId) {
        return new Entitlement(userId, EnumSet.allOf(Feature.class), null);
    }
}
