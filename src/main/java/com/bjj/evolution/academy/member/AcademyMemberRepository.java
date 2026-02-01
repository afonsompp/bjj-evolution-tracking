package com.bjj.evolution.academy.member;

import com.bjj.evolution.academy.member.domain.AcademyMember;
import com.bjj.evolution.academy.member.domain.AcademyMemberId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.UUID;

public interface AcademyMemberRepository extends JpaRepository<AcademyMember, AcademyMemberId> {

    Page<AcademyMember> findAllByAcademyId(UUID academyId, Pageable pageable);

    @Query("SELECT am FROM AcademyMember am " +
            "WHERE am.id.academyId = :academyId " +
            "AND (LOWER(am.user.name) LIKE LOWER(CONCAT('%', :name, '%')) " +
            "OR LOWER(am.user.secondName) LIKE LOWER(CONCAT('%', :name, '%')))")
    Page<AcademyMember> findByAcademyIdAndUserName(UUID academyId, String name, Pageable pageable);
}
