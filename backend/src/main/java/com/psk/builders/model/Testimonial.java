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

    public Testimonial(Long id, String customerName, String location, String message, Integer rating) {
        this.id = id;
        this.customerName = customerName;
        this.location = location;
        this.message = message;
        this.rating = rating;
        this.status = "APPROVED";
        this.createdAt = LocalDateTime.now();
    }
}
