package com.psk.builders.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Settings {
    @Id
    Long id; // always 1 — single-row config table
    Double ratePerSqft;
}
