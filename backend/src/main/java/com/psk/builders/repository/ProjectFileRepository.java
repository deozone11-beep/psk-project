package com.psk.builders.repository;

import com.psk.builders.model.ProjectFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectFileRepository extends JpaRepository<ProjectFile, Long> {
    List<ProjectFile> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);
}
