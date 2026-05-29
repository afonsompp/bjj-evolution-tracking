package com.bjj.evolution.shared.storage;

import com.bjj.evolution.shared.configuration.StorageProperties;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;

import java.net.URI;

/**
 * Wires the storage beans. When {@code storage.endpoint} is set, a real
 * Supabase/S3-backed {@link FileStorage} is created; otherwise a
 * {@link DisabledFileStorage} keeps the app bootable.
 */
@Configuration
public class StorageConfig {

    @Bean
    @ConditionalOnProperty(prefix = "storage", name = "endpoint")
    public S3Client s3Client(StorageProperties props) {
        return S3Client.builder()
                .endpointOverride(URI.create(props.endpoint()))
                .region(Region.of(props.region()))
                .credentialsProvider(credentials(props))
                .forcePathStyle(true) // required by Supabase Storage
                .build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "storage", name = "endpoint")
    public S3Presigner s3Presigner(StorageProperties props) {
        return S3Presigner.builder()
                .endpointOverride(URI.create(props.endpoint()))
                .region(Region.of(props.region()))
                .credentialsProvider(credentials(props))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build();
    }

    @Bean
    @ConditionalOnProperty(prefix = "storage", name = "endpoint")
    public FileStorage supabaseFileStorage(S3Client s3Client, S3Presigner s3Presigner, StorageProperties props) {
        return new SupabaseFileStorage(s3Client, s3Presigner, props);
    }

    @Bean
    @ConditionalOnMissingBean(FileStorage.class)
    public FileStorage disabledFileStorage() {
        return new DisabledFileStorage();
    }

    private static StaticCredentialsProvider credentials(StorageProperties props) {
        return StaticCredentialsProvider.create(
                AwsBasicCredentials.create(props.accessKey(), props.secretKey()));
    }
}
