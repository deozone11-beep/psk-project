package com.psk.builders.model;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Employee {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @NotBlank(message = "Name is required")
    String name;
    String role;      // e.g. Mason, Electrician, Supervisor
    String phone;

    @PositiveOrZero(message = "Daily wage can't be negative")
    Double dailyWage;
    Boolean active = true;

    String username;
    String loginRole; // "NONE", "ADMIN", "ENGINEER"

    @Transient
    String password;
}
