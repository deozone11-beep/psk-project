package com.psk.builders.controller;

import com.psk.builders.model.AppUser;
import com.psk.builders.model.SavedPlan;
import com.psk.builders.repository.AppUserRepository;
import com.psk.builders.repository.SavedPlanRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final SavedPlanRepository planRepo;
    private final AppUserRepository userRepo;

    public PlanController(SavedPlanRepository planRepo, AppUserRepository userRepo) {
        this.planRepo = planRepo;
        this.userRepo = userRepo;
    }

    private AppUser getCurrentUser(Authentication auth) {
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getName())) {
            return null;
        }
        return userRepo.findByUsername(auth.getName()).orElse(null);
    }

    // Save a favorite 2D floor plan & elevation
    @PostMapping("/save")
    public ResponseEntity<?> savePlan(@RequestBody Map<String, Object> req, Authentication auth) {
        AppUser user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to save your favorite design plan."));
        }

        try {
            Double length = Double.parseDouble(req.getOrDefault("plotLength", 30).toString());
            Double width = Double.parseDouble(req.getOrDefault("plotWidth", 40).toString());
            Double sqft = Double.parseDouble(req.getOrDefault("totalSqft", length * width).toString());
            String facing = req.getOrDefault("facingDirection", "East").toString();
            String floors = req.getOrDefault("floors", "Ground Floor").toString();
            Integer optionIndex = Integer.parseInt(req.getOrDefault("designOptionIndex", 0).toString());
            String optionName = req.getOrDefault("designOptionName", "Modern Open Floor Plan").toString();
            Double cost = Double.parseDouble(req.getOrDefault("estimatedCost", 0).toString());
            String layoutJson = req.getOrDefault("layoutDataJson", "{}").toString();
            String notes = req.getOrDefault("notes", "").toString();

            SavedPlan plan = new SavedPlan();
            plan.setCustomer(user);
            plan.setPlotLength(length);
            plan.setPlotWidth(width);
            plan.setTotalSqft(sqft);
            plan.setFacingDirection(facing);
            plan.setFloors(floors);
            plan.setDesignOptionIndex(optionIndex);
            plan.setDesignOptionName(optionName);
            plan.setEstimatedCost(cost);
            plan.setLayoutDataJson(layoutJson);
            plan.setNotes(notes);

            SavedPlan saved = planRepo.save(plan);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error saving plan: " + e.getMessage()));
        }
    }

    // Fetch saved plans for logged-in Customer
    @GetMapping("/my-saved")
    public ResponseEntity<?> getMySavedPlans(Authentication auth) {
        AppUser user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }
        return ResponseEntity.ok(planRepo.findByCustomer_IdOrderByCreatedAtDesc(user.getId()));
    }

    // Delete a saved plan
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteSavedPlan(@PathVariable("id") Long id, Authentication auth) {
        try {
            AppUser user = getCurrentUser(auth);
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
            }

            SavedPlan plan = planRepo.findById(id).orElse(null);
            if (plan == null) {
                return ResponseEntity.ok(Map.of("message", "Plan deleted or not found"));
            }

            boolean isAdmin = user.getRole() == AppUser.Role.ADMIN || user.getRole() == AppUser.Role.ENGINEER;
            boolean isOwner = plan.getCustomer() == null || plan.getCustomer().getId() == null || plan.getCustomer().getId().equals(user.getId());

            if (isAdmin || isOwner) {
                planRepo.delete(plan);
                return ResponseEntity.ok(Map.of("message", "Plan deleted successfully"));
            }

            return ResponseEntity.status(403).body(Map.of("message", "Access denied"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).body(Map.of("message", "Error deleting plan: " + e.getMessage()));
        }
    }

    // Role-based view of customer saved plans
    // ADMIN / Owner: sees ALL customer plans
    // ENGINEER: sees ONLY plans for customers assigned to this engineer
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllSavedPlans(Authentication auth) {
        AppUser user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Unauthorized"));
        }

        if (user.getRole() == AppUser.Role.ADMIN) {
            return ResponseEntity.ok(planRepo.findAllByOrderByCreatedAtDesc());
        } else if (user.getRole() == AppUser.Role.ENGINEER) {
            return ResponseEntity.ok(planRepo.findByCustomer_AssignedEngineerUsernameOrderByCreatedAtDesc(user.getUsername()));
        } else {
            return ResponseEntity.ok(planRepo.findByCustomer_IdOrderByCreatedAtDesc(user.getId()));
        }
    }

    // Assign engineer to customer
    @PutMapping("/assign-engineer")
    public ResponseEntity<?> assignEngineerToCustomer(@RequestBody Map<String, Object> req, Authentication auth) {
        AppUser user = getCurrentUser(auth);
        if (user == null || user.getRole() != AppUser.Role.ADMIN) {
            return ResponseEntity.status(403).body(Map.of("message", "Only Admin/Owner can assign engineers"));
        }

        Long customerId = Long.parseLong(req.get("customerId").toString());
        String engineerUsername = req.get("engineerUsername") != null ? req.get("engineerUsername").toString() : null;

        AppUser customer = userRepo.findById(customerId).orElse(null);
        if (customer == null) {
            return ResponseEntity.notFound().build();
        }

        customer.setAssignedEngineerUsername(engineerUsername);
        userRepo.save(customer);

        return ResponseEntity.ok(Map.of("message", "Engineer assigned successfully", "customer", customer));
    }

    // 1-Click Consultation Request for a Plan
    @PostMapping("/request-consultation")
    public ResponseEntity<?> requestConsultation(@RequestBody Map<String, Object> req, Authentication auth) {
        AppUser user = getCurrentUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("message", "Please log in to request an engineering consultation."));
        }

        try {
            Long planId = req.get("planId") != null ? Long.parseLong(req.get("planId").toString()) : null;
            if (planId != null) {
                SavedPlan plan = planRepo.findById(planId).orElse(null);
                if (plan != null) {
                    plan.setNotes((plan.getNotes() != null ? plan.getNotes() : "") + " | [CONSULTATION REQUESTED by " + user.getDisplayName() + "]");
                    planRepo.save(plan);
                }
            }
            return ResponseEntity.ok(Map.of(
                "message", "Consultation request received! A PSK Structural Engineer will review your 2D/3D plan and contact you shortly.",
                "assignedEngineer", user.getAssignedEngineerUsername() != null ? user.getAssignedEngineerUsername() : "Head Engineer"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("message", "Error submitting consultation request: " + e.getMessage()));
        }
    }
}
