package com.psk.builders.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Enquiry {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    Long id;
    
    String name;
    String phone;
    String email;
    String service;
    
    @Column(length = 2000) 
    String message;
    
    LocalDateTime createdAt;
    
    // New CRM / Tracking Fields
    String trackId;
    String status; // NEW, ASSIGNED, CONTACTED, CONVERTED, CLOSED
    String assignedEngineerUsername;
    
    @Column(length = 2000)
    String engineerRemarks;
    
    @Column(length = 4000)
    String conversationHistory; // Serialized chat history
    
    Long convertedCustomerId; // AppUser ID after conversion
    String location; // GPS coordinate link
    
    @PrePersist 
    void create() {
        createdAt = LocalDateTime.now();
        if (status == null) status = "NEW";
    }
}
