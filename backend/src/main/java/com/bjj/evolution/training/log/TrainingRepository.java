package com.bjj.evolution.training.log;

import com.bjj.evolution.training.log.domain.Training;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface TrainingRepository extends JpaRepository<Training, Long> {

    Page<Training> findAllByUserProfileId(UUID userProfileId, Pageable pageable);

    Page<Training> findAllByUserProfileIdAndSessionDateBetween(
            UUID userProfileId,
            Instant startDate,
            Instant endDate,
            Pageable pageable
    );

    Optional<Training> findByIdAndUserProfileId(Long id, UUID userProfileId);

    boolean existsByIdAndUserProfileId(Long id, UUID userProfileId);

    @Query("SELECT COUNT(t), " +
           "SUM(t.taps), SUM(t.submissions), SUM(t.escapes), " +
           "SUM(t.sweeps), SUM(t.takedowns), SUM(t.guardPasses), SUM(t.totalRolls), " +
           "AVG(t.cardioRating.value), AVG(t.intensityRating.value), " +
           "SUM(t.durationMinutes) " +
           "FROM Training t WHERE t.userProfile.id = :userId " +
           "AND t.sessionDate >= COALESCE(:startDate, t.sessionDate) " +
           "AND t.sessionDate <= COALESCE(:endDate, t.sessionDate)")
    List<Object[]> computeStats(@Param("userId") UUID userId,
                          @Param("startDate") Instant startDate,
                          @Param("endDate") Instant endDate);

    @Query("SELECT t.name, COUNT(t) FROM Training tr " +
           "JOIN tr.submissionTechniques t " +
           "WHERE tr.userProfile.id = :userId " +
           "AND tr.sessionDate >= COALESCE(:startDate, tr.sessionDate) " +
           "AND tr.sessionDate <= COALESCE(:endDate, tr.sessionDate) " +
           "GROUP BY t.name ORDER BY COUNT(t) DESC")
    List<Object[]> findTopAttackTechniques(@Param("userId") UUID userId,
                                            @Param("startDate") Instant startDate,
                                            @Param("endDate") Instant endDate);

    @Query("SELECT t.name, COUNT(t) FROM Training tr " +
           "JOIN tr.submissionTechniquesAllowed t " +
           "WHERE tr.userProfile.id = :userId " +
           "AND tr.sessionDate >= COALESCE(:startDate, tr.sessionDate) " +
           "AND tr.sessionDate <= COALESCE(:endDate, tr.sessionDate) " +
           "GROUP BY t.name ORDER BY COUNT(t) DESC")
    List<Object[]> findTopDefenseTechniques(@Param("userId") UUID userId,
                                             @Param("startDate") Instant startDate,
                                             @Param("endDate") Instant endDate);
}
