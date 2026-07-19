package com.psk.builders.model;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Data
@NoArgsConstructor
public class Settings {
    @Id
    Long id; // always 1 — single-row config table
    Double ratePerSqft;
    Double otherBuilderRatePerSqft;

    public Settings(Long id, Double ratePerSqft) {
        this.id = id;
        this.ratePerSqft = ratePerSqft;
        this.otherBuilderRatePerSqft = ratePerSqft != null ? ratePerSqft * 1.2 : 1980.0;
    }

    public Settings(Long id, Double ratePerSqft, Double otherBuilderRatePerSqft) {
        this.id = id;
        this.ratePerSqft = ratePerSqft;
        this.otherBuilderRatePerSqft = otherBuilderRatePerSqft;
    }

    public Double getOtherBuilderRatePerSqft() {
        if (otherBuilderRatePerSqft == null) {
            return ratePerSqft != null ? ratePerSqft * 1.2 : 1980.0;
        }
        return otherBuilderRatePerSqft;
    }
}
