package com.bjj.evolution.shared.converter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class DurationConverterTest {

    private DurationConverter converter;

    @BeforeEach
    void setUp() {
        converter = new DurationConverter();
    }

    @Test
    void testConvertToDatabaseColumn_withNonNullDuration_shouldReturnSeconds() {
        Duration duration = Duration.ofMinutes(10);
        Long result = converter.convertToDatabaseColumn(duration);
        assertEquals(600L, result);
    }

    @Test
    void testConvertToDatabaseColumn_withNullDuration_shouldReturnNull() {
        Long result = converter.convertToDatabaseColumn(null);
        assertNull(result);
    }

    @Test
    void testConvertToEntityAttribute_withNonNullSeconds_shouldReturnDuration() {
        Long seconds = 900L;
        Duration result = converter.convertToEntityAttribute(seconds);
        assertEquals(Duration.ofMinutes(15), result);
    }

    @Test
    void testConvertToEntityAttribute_withNullSeconds_shouldReturnNull() {
        Duration result = converter.convertToEntityAttribute(null);
        assertNull(result);
    }
}
