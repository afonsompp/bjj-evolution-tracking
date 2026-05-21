package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.member.domain.GraduationHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface GraduationHistoryRepository extends JpaRepository<GraduationHistory, Long> {
    Page<GraduationHistory> findByStudentIdOrderByGraduationDateDesc(UUID studentId, Pageable pageable);
    Page<GraduationHistory> findByAcademyIdOrderByGraduationDateDesc(UUID academyId, Pageable pageable);
}
