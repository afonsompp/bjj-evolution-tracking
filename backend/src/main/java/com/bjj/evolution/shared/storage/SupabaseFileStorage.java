package com.bjj.evolution.shared.storage;

import com.bjj.evolution.shared.configuration.StorageProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.time.Duration;
import java.util.UUID;

/**
 * {@link FileStorage} backed by Supabase Storage through its S3-compatible API.
 * Wired only when {@code storage.endpoint} is configured (see {@link StorageConfig}).
 */
public class SupabaseFileStorage implements FileStorage {

    private static final Logger log = LoggerFactory.getLogger(SupabaseFileStorage.class);

    private final S3Client s3;
    private final S3Presigner presigner;
    private final StorageProperties props;

    public SupabaseFileStorage(S3Client s3, S3Presigner presigner, StorageProperties props) {
        this.s3 = s3;
        this.presigner = presigner;
        this.props = props;
    }

    @Override
    public String upload(String scope, String originalFilename, byte[] content, String contentType) {
        String key = buildKey(scope, originalFilename);
        log.info("Uploading object key={} bucket={} size={}", key, props.bucket(), content.length);
        s3.putObject(
                PutObjectRequest.builder()
                        .bucket(props.bucket())
                        .key(key)
                        .contentType(contentType)
                        .build(),
                RequestBody.fromBytes(content));
        return key;
    }

    @Override
    public String publicUrl(String key) {
        return "%s/%s/%s".formatted(trimTrailingSlash(props.publicUrlBase()), props.bucket(), key);
    }

    @Override
    public String signedUrl(String key, Duration ttl) {
        GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                .signatureDuration(ttl)
                .getObjectRequest(GetObjectRequest.builder()
                        .bucket(props.bucket())
                        .key(key)
                        .build())
                .build();
        return presigner.presignGetObject(presignRequest).url().toString();
    }

    @Override
    public void delete(String key) {
        if (key == null || key.isBlank()) return;
        log.info("Deleting object key={} bucket={}", key, props.bucket());
        s3.deleteObject(DeleteObjectRequest.builder()
                .bucket(props.bucket())
                .key(key)
                .build());
    }

    private String buildKey(String scope, String originalFilename) {
        String ext = extensionOf(originalFilename);
        String prefix = scope == null || scope.isBlank() ? "" : trimTrailingSlash(scope) + "/";
        return prefix + UUID.randomUUID() + ext;
    }

    private static String extensionOf(String filename) {
        if (filename == null) return "";
        int dot = filename.lastIndexOf('.');
        if (dot < 0 || dot == filename.length() - 1) return "";
        String ext = filename.substring(dot).toLowerCase();
        // keep it to a safe alphanumeric extension
        return ext.matches("\\.[a-z0-9]{1,8}") ? ext : "";
    }

    private static String trimTrailingSlash(String s) {
        return s != null && s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}
