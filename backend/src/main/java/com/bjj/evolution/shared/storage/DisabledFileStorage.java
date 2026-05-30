package com.bjj.evolution.shared.storage;

import java.time.Duration;

/**
 * Fallback used when no storage backend is configured ({@code storage.endpoint}
 * is blank). Lets the application boot in environments without storage (local,
 * tests); any actual file operation fails with a clear message.
 */
public class DisabledFileStorage implements FileStorage {

    private static final String MESSAGE =
            "File storage is not configured. Set storage.endpoint and credentials to enable uploads.";

    @Override
    public String upload(String scope, String originalFilename, byte[] content, String contentType) {
        throw new IllegalStateException(MESSAGE);
    }

    @Override
    public String publicUrl(String key) {
        throw new IllegalStateException(MESSAGE);
    }

    @Override
    public String signedUrl(String key, Duration ttl) {
        throw new IllegalStateException(MESSAGE);
    }

    @Override
    public void delete(String key) {
        // no-op: nothing was ever stored
    }
}
