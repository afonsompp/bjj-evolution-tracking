package com.bjj.evolution.catalog;

import com.bjj.evolution.catalog.domain.Technique;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface TechniqueRepository extends JpaRepository<Technique, Long> {

    Page<Technique> findByNameContainingIgnoreCaseOrAlternativeNameContainingIgnoreCase(
            String name,
            String alternativeName,
            Pageable pageable
    );
}
