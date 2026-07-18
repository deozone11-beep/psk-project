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

    public enum Role { ADMIN, CUSTOMER, ENGINEER }
}
