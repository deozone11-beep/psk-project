package com.psk.builders.repository;
import com.psk.builders.model.ProjectUpdate;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectUpdateRepository extends JpaRepository<ProjectUpdate, Long> {
    List<ProjectUpdate> findAllByOrderByWorkDateDesc();
    List<ProjectUpdate> findByCustomer_IdOrderByWorkDateDesc(Long customerId);
}
