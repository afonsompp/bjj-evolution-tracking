package com.bjj.evolution.user;

import com.bjj.evolution.user.domain.UserProfile;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, UUID> {
    boolean existsByNickname(String nickname);

    @Query("SELECT u FROM UserProfile u WHERE u.id = :id AND u.anonymizedAt IS NULL")
    Optional<UserProfile> findActiveById(UUID id);

    @Query("SELECT u FROM UserProfile u WHERE u.anonymizedAt IS NULL AND (" +
            "LOWER(u.nickname) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
            "LOWER(u.secondName) LIKE LOWER(CONCAT('%', :query, '%')))")
    Page<UserProfile> searchByTerm(String query, Pageable pageable);
}
