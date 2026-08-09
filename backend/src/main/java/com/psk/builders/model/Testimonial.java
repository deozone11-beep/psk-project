package com.psk.builders.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity 
@Data 
@NoArgsConstructor 
@AllArgsConstructor 
public class Testimonial {
    @Id 
    @GeneratedValue(strategy = GenerationType.IDENTITY) 
    Long id;

    String customerName;
    String location;
    
    @Column(length = 1000) 
    String message;

    Integer rating;
    String phone;
    String email;
    String status = "APPROVED"; // APPROVED, PENDING, HIDDEN

    LocalDateTime createdAt = LocalDateTime.now();
}
