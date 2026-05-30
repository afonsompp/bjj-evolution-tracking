package com.bjj.evolution.shared.storage;

import java.time.Duration;

/**
 * Abstraction over outbound file storage.
 *
 * Every media feature (profile photo, technique video, competition photo,
 * waiver PDF, graduation certificate) goes through this interface, so the
 * concrete backend (Supabase Storage today, AWS S3 tomorrow) stays a single
 * swappable implementation.
 */
public interface FileStorage {

    /**
     * Stores the given content and returns the opaque storage key
     * (e.g. {@code "avatars/<uuid>.png"}). Persist the key, not the URL.
     *
     * @param scope             logical folder/prefix (e.g. {@code "avatars/<userId>"})
     * @param originalFilename  used only to derive the file extension; may be null
     * @param content           the file bytes
     * @param contentType       MIME type (e.g. {@code "image/png"})
     */
    String upload(String scope, String originalFilename, byte[] content, String contentType);

    /** Public URL for an object stored in a public bucket. */
    String publicUrl(String key);

    /** Time-limited signed URL for reading an object in a private bucket. */
    String signedUrl(String key, Duration ttl);

    /** Removes an object. No-op semantics if it does not exist. */
    void delete(String key);
}
