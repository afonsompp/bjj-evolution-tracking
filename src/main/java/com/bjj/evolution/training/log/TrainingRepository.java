package com.bjj.evolution.training.log;

import com.bjj.evolution.training.log.domain.Training;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrainingRepository extends JpaRepository<Training, Long> {
    List<Training> findAllByUserProfileId(UUID userProfileId);

    Optional<Training> findByIdAndUserProfileId(Long id, UUID userProfileId);

    boolean existsByIdAndUserProfileId(Long id, UUID userProfileId);
}
