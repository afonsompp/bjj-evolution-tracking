package com.bjj.evolution.training.log.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

@Embeddable
public class Rating {

    @Column(nullable = false)
    private Integer value;

    protected Rating() {}

    private Rating(Integer value) {
        if (value < 1 || value > 5) {
            throw new IllegalArgumentException("Rating may be between 1 and 5");
        }
        this.value = value;
    }

    public static Rating of(int value) {
        return new Rating(value);
    }

    public int getValue() {
        return value;
    }
}
