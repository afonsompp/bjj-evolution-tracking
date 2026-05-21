package com.bjj.evolution.academy;

import com.bjj.evolution.academy.domain.Academy;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface AcademyRepository extends JpaRepository<Academy, UUID> {
    Page<Academy> findByNameContainingIgnoreCase(String name, Pageable pageable);

    @Query("SELECT am.academy FROM AcademyMember am WHERE am.user.id = :userId")
    Page<Academy> findAllByUserId(UUID userId, Pageable pageable);
}
