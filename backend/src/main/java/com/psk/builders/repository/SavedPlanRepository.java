package com.psk.builders.repository;

import com.psk.builders.model.SavedPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface SavedPlanRepository extends JpaRepository<SavedPlan, Long> {
    List<SavedPlan> findByCustomer_IdOrderByCreatedAtDesc(Long customerId);
    List<SavedPlan> findAllByOrderByCreatedAtDesc();
    List<SavedPlan> findByCustomer_AssignedEngineerUsernameOrderByCreatedAtDesc(String engineerUsername);
}
