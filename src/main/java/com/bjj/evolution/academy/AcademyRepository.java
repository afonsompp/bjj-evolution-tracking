package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.Academy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AcademyRepository extends JpaRepository<Academy, UUID> {
    Page<Academy> findByNameContainingIgnoreCase(String name, Pageable pageable);
}
