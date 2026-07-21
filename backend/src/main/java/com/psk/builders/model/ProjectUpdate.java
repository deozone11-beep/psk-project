package com.psk.builders.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUpdate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    AppUser customer; // which customer this update belongs to

    String title;
    @Column(length = 2000)
    String description;
    @Column(length = 16777215)
    String photoUrl; // holds base64 data URIs separated by |||, nullable
    LocalDate workDate;
    String engineerName;
    @Column(length = 1000)
    String workerNames;
    LocalDateTime createdAt;

    @PrePersist
    void create() { createdAt = LocalDateTime.now(); }
}