package com.psk.builders.model;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Attendance {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    Employee employee;

    LocalDate date;
    Boolean present;
    Double hoursWorked;
    String notes;

    Double dailyRate;
    Double extraDuty;
    Double advancePaid;

    String checkInTime;
    String checkInLocation;
}
