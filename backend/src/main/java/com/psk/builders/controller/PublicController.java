package com.psk.builders.controller;

import com.psk.builders.model.*;
import com.psk.builders.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController 
@RequestMapping("/api") 
public class PublicController {
    final ServiceRepository s;
    final ProjectRepository p;
    final EnquiryRepository e;
    final TestimonialRepository t;
    final SettingsRepository st;

    PublicController(ServiceRepository s, ProjectRepository p, EnquiryRepository e, TestimonialRepository t, SettingsRepository st) {
        this.s = s;
        this.p = p;
        this.e = e;
        this.t = t;
        this.st = st;
    }

    @GetMapping("/services") 
    List<ServiceItem> services() { return s.findAll(); }

    @GetMapping("/projects") 
    List<Project> projects() { return p.findAll(); }

    @GetMapping("/testimonials") 
    List<Testimonial> testimonials() { return t.findAll(); }

    @GetMapping("/settings") 
    Settings settings() { return st.findById(1L).orElse(new Settings(1L, 1650.0)); }

    record Request(
        @NotBlank String name,
        @NotBlank @Pattern(regexp = "^[0-9+ -]{10,16}$") String phone,
        @Email String email,
        @NotBlank String service,
        @NotBlank String message,
        String latitude,
        String longitude
    ) {}

    @PostMapping("/enquiries") 
    ResponseEntity<?> enquiry(@Valid @RequestBody Request r) {
        Enquiry q = new Enquiry();
        q.setName(r.name());
        q.setPhone(r.phone());
        q.setEmail(r.email());
        q.setService(r.service());
        q.setMessage(r.message());
        
        long count = e.count();
        String trackId = "PSK-ENQ-" + (1000 + count + 1);
        q.setTrackId(trackId);

        if (r.latitude() != null && r.longitude() != null && !r.latitude().isBlank() && !r.longitude().isBlank()) {
            q.setLocation("https://www.google.com/maps?q=" + r.latitude().trim() + "," + r.longitude().trim());
        }

        e.save(q);

        System.out.println("=================================================");
        System.out.println("MOCK EMAIL SENT TO: " + r.email());
        System.out.println("SUBJECT: PSK Builders - Enquiry Registered [" + trackId + "]");
        System.out.println("Dear " + r.name() + ",\nThank you for reaching out to PSK Brothers Builders!");
        System.out.println("Your enquiry for '" + r.service() + "' has been successfully registered.");
        System.out.println("You can track your enquiry progress online using your Mobile Number / Email.");
        System.out.println("Tracking ID: " + trackId);
        System.out.println("=================================================");

        return ResponseEntity.status(201).body(Map.of(
            "message", "Thank you! Your enquiry has been registered successfully.",
            "trackId", trackId
        ));
    }
}
