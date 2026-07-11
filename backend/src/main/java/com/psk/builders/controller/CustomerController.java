package com.psk.builders.controller;

import com.psk.builders.model.*;
import com.psk.builders.repository.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

// Protected by SecurityConfig — requires login with ROLE_CUSTOMER (or ROLE_ADMIN).
// A customer only ever sees data tied to their own account — never other customers'.
@RestController
@RequestMapping("/api/customer")
public class CustomerController {

    final AppUserRepository users;
    final ProjectUpdateRepository updates;
    final SettingsRepository settings;

    CustomerController(AppUserRepository users, ProjectUpdateRepository updates, SettingsRepository settings) {
        this.users = users;
        this.updates = updates;
        this.settings = settings;
    }

    private AppUser currentUser(Authentication auth) {
        return users.findByUsername(auth.getName()).orElse(null);
    }

    @GetMapping("/me")
    ResponseEntity<?> me(Authentication auth) {
        AppUser u = currentUser(auth);
        if (u == null) return ResponseEntity.status(404).body(Map.of("message", "Account not found"));
        double rate = settings.findById(1L).map(Settings::getRatePerSqft).orElse(1650.0);
        double sqft = u.getEstimatedSqft() != null ? u.getEstimatedSqft() : 0;
        return ResponseEntity.ok(Map.of(
                "displayName", u.getDisplayName() == null ? "" : u.getDisplayName(),
                "projectName", u.getProjectName() == null ? "" : u.getProjectName(),
                "estimatedSqft", sqft,
                "ratePerSqft", rate,
                "estimatedCost", Math.round(rate * sqft)
        ));
    }

    @GetMapping("/updates")
    List<ProjectUpdate> myUpdates(Authentication auth) {
        AppUser u = currentUser(auth);
        if (u == null) return List.of();
        return updates.findByCustomer_IdOrderByWorkDateDesc(u.getId());
    }
}
