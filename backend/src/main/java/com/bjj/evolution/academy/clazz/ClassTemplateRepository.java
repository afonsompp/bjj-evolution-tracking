package com.bjj.evolution.academy.clazz;

import com.bjj.evolution.academy.clazz.domain.ClassTemplate;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ClassTemplateRepository extends JpaRepository<ClassTemplate, UUID> {
    Page<ClassTemplate> findAllByAcademyId(UUID academyId, Pageable pageable);
}
