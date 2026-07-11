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
    @Lob @Column(columnDefinition = "LONGTEXT")
    String photoUrl; // now holds a base64 data URI (data:image/...;base64,...), nullable — text-only updates allowed
    LocalDate workDate;
    LocalDateTime createdAt;

    @PrePersist
    void create() { createdAt = LocalDateTime.now(); }
}