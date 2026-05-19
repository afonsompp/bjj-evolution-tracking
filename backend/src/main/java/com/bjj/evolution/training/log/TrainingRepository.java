package com.bjj.evolution.training.log;

import com.bjj.evolution.training.log.domain.Training;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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

    @Query("SELECT COUNT(t), " +
           "SUM(t.taps), SUM(t.submissions), SUM(t.escapes), " +
           "SUM(t.sweeps), SUM(t.takedowns), SUM(t.guardPasses), SUM(t.totalRolls), " +
           "AVG(t.cardioRating.value), AVG(t.intensityRating.value), " +
           "SUM(t.duration) " +
           "FROM Training t WHERE t.userProfile.id = :userId " +
           "AND (:startDate IS NULL OR t.sessionDate >= :startDate) " +
           "AND (:endDate IS NULL OR t.sessionDate <= :endDate)")
    Object[] computeStats(@Param("userId") UUID userId,
                          @Param("startDate") LocalDateTime startDate,
                          @Param("endDate") LocalDateTime endDate);
}
