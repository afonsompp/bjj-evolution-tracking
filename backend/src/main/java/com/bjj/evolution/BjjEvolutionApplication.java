package com.bjj.evolution;

import com.bjj.evolution.shared.configuration.RateLimitProperties;
import com.bjj.evolution.shared.configuration.StorageProperties;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableConfigurationProperties({RateLimitProperties.class, StorageProperties.class})
public class BjjEvolutionApplication {

	public static void main(String[] args) {
		SpringApplication.run(BjjEvolutionApplication.class, args);
	}

}
