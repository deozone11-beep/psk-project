package com.psk.builders.repository;

import com.psk.builders.model.CensusBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CensusBlockRepository extends JpaRepository<CensusBlock, Long> {
    List<CensusBlock> findAllByOrderByCreatedAtDesc();
}
