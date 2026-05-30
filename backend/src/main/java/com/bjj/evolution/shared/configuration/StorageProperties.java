package com.bjj.evolution.shared.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration for outbound file storage.
 *
 * Backed by Supabase Storage via its S3-compatible API, so the AWS S3 SDK is
 * used directly — switching to native AWS S3 later is only a change of
 * {@code endpoint}/{@code region}/credentials, not code.
 *
 * Supabase values (Project → Storage → S3 connection):
 *   endpoint       https://&lt;project-ref&gt;.supabase.co/storage/v1/s3
 *   publicUrlBase  https://&lt;project-ref&gt;.supabase.co/storage/v1/object/public
 *   region         the project's region (shown on the S3 connection page)
 *   accessKey/secretKey  generated S3 access keys
 *   bucket         a bucket you created (public for avatars)
 */
@ConfigurationProperties(prefix = "storage")
public record StorageProperties(
        String endpoint,
        String region,
        String accessKey,
        String secretKey,
        String bucket,
        String publicUrlBase,
        long signedUrlTtlSeconds
) {
    public StorageProperties {
        if (region == null || region.isBlank()) region = "us-east-1";
        if (signedUrlTtlSeconds <= 0) signedUrlTtlSeconds = 3600;
    }

    /** True when an endpoint is configured (i.e. real storage is wired up). */
    public boolean isConfigured() {
        return endpoint != null && !endpoint.isBlank();
    }
}
