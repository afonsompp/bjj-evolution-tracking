package com.bjj.evolution.training.log;

import com.bjj.evolution.training.log.domain.Training;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrainingRepository extends JpaRepository<Training, Long> {

    Page<Training> findAllByUserProfileId(UUID userProfileId, Pageable pageable);

    Page<Training> findAllByUserProfileIdAndSessionDateBetween(
            UUID userProfileId,
            LocalDateTime startDate,
            LocalDateTime endDate,
            Pageable pageable
    );
    Optional<Training> findByIdAndUserProfileId(Long id, UUID userProfileId);

    boolean existsByIdAndUserProfileId(Long id, UUID userProfileId);
}
