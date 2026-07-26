package com.psk.builders.repository;

import com.psk.builders.model.Enquiry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface EnquiryRepository extends JpaRepository<Enquiry, Long> {
    List<Enquiry> findAllByOrderByCreatedAtDesc();
    Optional<Enquiry> findByTrackId(String trackId);
    List<Enquiry> findByPhoneOrEmail(String phone, String email);
    List<Enquiry> findByAssignedEngineerUsernameOrderByCreatedAtDesc(String username);
    List<Enquiry> findByConvertedCustomerId(Long customerId);
}
