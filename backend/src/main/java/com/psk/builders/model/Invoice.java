package com.psk.builders.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String invoiceNumber; // e.g. PSK-INV-2026-001

    private LocalDate invoiceDate;
    private LocalDate dueDate;

    @ManyToOne
    private AppUser customer; // Target customer account

    private String billType; // ESTIMATE, RA_STAGE, EXTRA_WORK, PAYMENT_RECEIPT
    private String stageName; // e.g., "Basement & Foundation", "Roof Slab"

    private Double builtUpArea; // sqft
    private Double ratePerSqft; // ₹/sqft

    @Column(length = 65535)
    private String lineItemsJson; // JSON array of items [{ description, qty, unit, rate, amount }]

    private Double subTotal;
    private Double gstPercentage; // e.g. 0 or 18
    private Double taxAmount;
    private Double discountAmount;
    private Double totalAmount;

    private Double amountPaidSoFar;
    private Double balanceDue;

    @Column(length = 1000)
    private String amountInWords;

    private String status; // DRAFT, SENT, PAID, PARTIALLY_PAID

    @Column(length = 2000)
    private String notes;

    private String createdByRole; // ADMIN, ENGINEER

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
