package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.member.domain.GraduationHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GraduationHistoryRepository extends JpaRepository<GraduationHistory, Long> {
    List<GraduationHistory> findByStudentIdOrderByGraduationDateDesc(UUID studentId);
}
