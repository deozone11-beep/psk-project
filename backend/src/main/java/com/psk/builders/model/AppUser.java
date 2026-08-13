package com.psk.builders.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppUser {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(unique = true, nullable = false)
    String username;

    @Column(nullable = false)
    String passwordHash;

    @Enumerated(EnumType.STRING)
    Role role; // ADMIN (owner + staff, full access), CUSTOMER (their own project only), or ENGINEER (daily updates, files, attendance)

    String displayName;   // customer's name, or staff member's name
    String phone;
    String projectName;   // customer only: e.g. "Modern Family Residence"
    Double estimatedSqft; // customer only: used to compute their estimate
    String email;         // used for forgot password recovery
    String assignedEngineerUsername; // customer only: engineer assigned to manage this customer

    public AppUser(Long id, String username, String passwordHash, Role role, String displayName, String phone, String projectName, Double estimatedSqft, String email) {
        this.id = id;
        this.username = username;
        this.passwordHash = passwordHash;
        this.role = role;
        this.displayName = displayName;
        this.phone = phone;
        this.projectName = projectName;
        this.estimatedSqft = estimatedSqft;
        this.email = email;
    }

    public enum Role { ADMIN, CUSTOMER, ENGINEER, CENSUS_USER }

}
