package com.bjj.evolution.training.log.domain;

import com.bjj.evolution.shared.exception.BusinessRuleException;
import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import org.hibernate.annotations.Check;

@Embeddable
public class Rating {

    @Check(constraints = "value BETWEEN 1 AND 5")
    @Column(nullable = false)
    private Integer value;

    protected Rating() {}

    private Rating(Integer value) {
        if (value < 1 || value > 5) {
            throw new BusinessRuleException("Rating must be between 1 and 5.");
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
