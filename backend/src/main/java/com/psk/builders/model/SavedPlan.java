package com.psk.builders.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
public class SavedPlan {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    AppUser customer;

    Double plotLength;
    Double plotWidth;
    Double totalSqft;
    String facingDirection; // North, East, South, West
    String floors; // Ground Floor, G+1 Duplex, G+2
    
    Integer designOptionIndex;
    String designOptionName;
    Double estimatedCost;
    
    @Column(length = 16777215)
    String layoutDataJson; // Stores detailed room specs, floorplan dimensions & elevation styling

    String notes;
    LocalDateTime createdAt;

    @PrePersist
    void create() {
        createdAt = LocalDateTime.now();
    }
}
