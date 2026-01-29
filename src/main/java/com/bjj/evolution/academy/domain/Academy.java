package com.bjj.evolution.academy.domain;

import com.bjj.evolution.user.domain.UserProfile;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;

import java.util.UUID;

@Entity
public class Academy {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String name;

    private String address;


    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id")
    private UserProfile owner;

    public Academy() {}

    public Academy(String name, String address, UserProfile owner) {
        this.name = name;
        this.address = address;
        this.owner = owner;
    }

    public UUID getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getAddress() {
        return address;
    }

    public UserProfile getOwner() {
        return owner;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public void setOwner(UserProfile owner) {
        this.owner = owner;
    }
}
