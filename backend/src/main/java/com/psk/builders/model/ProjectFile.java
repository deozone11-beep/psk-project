package com.psk.builders.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    AppUser customer;

    String fileName;
    String category; // "PLAN", "APPROVAL", "ESTIMATE", "INVOICE", "OTHER"

    @Column(length = 16777215)
    String fileData; // base64 encoded string

    String uploadedByUsername;
    String uploadedByRole; // "ADMIN", "ENGINEER", "CUSTOMER"
    LocalDateTime createdAt;

    @PrePersist
    void create() { createdAt = LocalDateTime.now(); }
}
