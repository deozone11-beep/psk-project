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
    final ProjectFileRepository files;

    final EnquiryRepository enquiries;

    CustomerController(AppUserRepository users, ProjectUpdateRepository updates, SettingsRepository settings,
                       ProjectFileRepository files, EnquiryRepository enquiries) {
        this.users = users;
        this.updates = updates;
        this.settings = settings;
        this.files = files;
        this.enquiries = enquiries;
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

    // ---------- Customer Project Files ----------
    @GetMapping("/files")
    ResponseEntity<?> getMyFiles(Authentication auth) {
        AppUser u = currentUser(auth);
        if (u == null) return ResponseEntity.status(404).body(Map.of("message", "Account not found"));
        return ResponseEntity.ok(files.findByCustomer_IdOrderByCreatedAtDesc(u.getId()));
    }

    @PostMapping(value = "/files", consumes = "multipart/form-data")
    ResponseEntity<?> uploadMyFile(@RequestParam String fileName,
                                    @RequestParam String category,
                                    @RequestParam org.springframework.web.multipart.MultipartFile file,
                                    Authentication auth) throws java.io.IOException {
        AppUser u = currentUser(auth);
        if (u == null) return ResponseEntity.status(404).body(Map.of("message", "Account not found"));
        if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));

        String mimeType = file.getContentType();
        String base64 = java.util.Base64.getEncoder().encodeToString(file.getBytes());
        String dataUri = "data:" + (mimeType != null ? mimeType : "application/octet-stream") + ";base64," + base64;

        ProjectFile pf = new ProjectFile(null, u, fileName, category, dataUri, u.getUsername(), "CUSTOMER", null);
        return ResponseEntity.ok(files.save(pf));
    }

    @DeleteMapping("/files/{id}")
    ResponseEntity<?> deleteMyFile(@PathVariable Long id, Authentication auth) {
        AppUser u = currentUser(auth);
        if (u == null) return ResponseEntity.status(404).body(Map.of("message", "Account not found"));

        ProjectFile pf = files.findById(id).orElse(null);
        if (pf == null) return ResponseEntity.notFound().build();

        // Check if this file belongs to the logged-in customer
        if (!pf.getCustomer().getId().equals(u.getId())) {
            return ResponseEntity.status(403).body(Map.of("message", "You can only manage your own files"));
        }

        // Check uploader role. Customers CANNOT delete files uploaded by ADMIN or ENGINEER!
        if (!"CUSTOMER".equalsIgnoreCase(pf.getUploadedByRole())) {
            return ResponseEntity.status(403).body(Map.of("message", "Access denied: you cannot delete official files"));
        }

        files.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/past-enquiry")
    ResponseEntity<?> getPastEnquiry(org.springframework.security.core.Authentication auth) {
        AppUser u = currentUser(auth);
        if (u == null) return ResponseEntity.status(404).body(Map.of("message", "Account not found"));
        List<Enquiry> list = enquiries.findByConvertedCustomerId(u.getId());
        if (list.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasPastEnquiry", false));
        }
        return ResponseEntity.ok(Map.of("hasPastEnquiry", true, "enquiries", list));
    }
}
