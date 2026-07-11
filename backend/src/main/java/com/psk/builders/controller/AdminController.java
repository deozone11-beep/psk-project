package com.psk.builders.controller;

import com.psk.builders.model.*;
import com.psk.builders.repository.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDate;
import java.util.*;

// Everything here is protected by SecurityConfig — requires a login with ROLE_ADMIN
// (the "owner" and "admin" accounts seeded in DataSeeder both qualify).
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    final EnquiryRepository enquiries;
    final SettingsRepository settings;
    final EmployeeRepository employees;
    final AttendanceRepository attendance;
    final PaymentRepository payments;
    final AppUserRepository users;
    final ProjectUpdateRepository updates;
    final ProjectRepository projects;
    final PasswordEncoder encoder;

    AdminController(EnquiryRepository enquiries, SettingsRepository settings, EmployeeRepository employees,
                     AttendanceRepository attendance, PaymentRepository payments, AppUserRepository users,
                     ProjectUpdateRepository updates, ProjectRepository projects, PasswordEncoder encoder) {
        this.enquiries = enquiries;
        this.settings = settings;
        this.employees = employees;
        this.attendance = attendance;
        this.payments = payments;
        this.users = users;
        this.updates = updates;
        this.projects = projects;
        this.encoder = encoder;
    }

    @GetMapping("/whoami")
    Map<String, String> whoami() { return Map.of("status", "ok"); }

    // ---------- Enquiries ----------
    @GetMapping("/enquiries")
    List<Enquiry> listEnquiries() { return enquiries.findAllByOrderByCreatedAtDesc(); }

    @DeleteMapping("/enquiries/{id}")
    ResponseEntity<?> deleteEnquiry(@PathVariable Long id) {
        if (!enquiries.existsById(id)) return ResponseEntity.notFound().build();
        enquiries.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Portfolio Projects (public "Selected Projects" gallery) ----------
    @GetMapping("/projects")
    List<Project> listProjects() { return projects.findAll(); }

    @PostMapping(value = "/projects", consumes = "multipart/form-data")
    ResponseEntity<?> createProject(@RequestParam String title, @RequestParam String location,
                                     @RequestParam String status, @RequestParam MultipartFile[] photos) throws IOException {
        if (title.isBlank() || location.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Title and location are required"));
        if (photos == null || photos.length == 0)
            return ResponseEntity.badRequest().body(Map.of("message", "At least one project photo is required"));
        List<String> imageUrls = new ArrayList<>();
        for (MultipartFile photo : photos) {
            String url = saveProjectPhoto(photo);
            if (url == null)
                return ResponseEntity.badRequest().body(Map.of("message", "Every photo must be JPEG/PNG/WEBP/GIF and under 3MB"));
            imageUrls.add(url);
        }
        Project p = new Project(null, title, location, status, imageUrls);
        return ResponseEntity.ok(projects.save(p));
    }

    @PutMapping("/projects/{id}")
    ResponseEntity<?> updateProject(@PathVariable Long id, @RequestBody ProjectTextUpdate body) {
        return projects.findById(id).map(p -> {
            p.setTitle(body.title());
            p.setLocation(body.location());
            p.setStatus(body.status());
            return ResponseEntity.ok(projects.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }
    record ProjectTextUpdate(String title, String location, String status) {}

    // Add one or more additional photos to an existing project's slideshow.
    @PostMapping(value = "/projects/{id}/images", consumes = "multipart/form-data")
    ResponseEntity<?> addProjectImages(@PathVariable Long id, @RequestParam MultipartFile[] photos) throws IOException {
        Project p = projects.findById(id).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        if (photos == null || photos.length == 0)
            return ResponseEntity.badRequest().body(Map.of("message", "No photos provided"));
        List<String> imgs = p.getImageUrls();
        for (MultipartFile photo : photos) {
            String url = saveProjectPhoto(photo);
            if (url == null)
                return ResponseEntity.badRequest().body(Map.of("message", "Every photo must be JPEG/PNG/WEBP/GIF and under 3MB"));
            imgs.add(url);
        }
        p.setImageUrls(imgs);
        return ResponseEntity.ok(projects.save(p));
    }

    // Remove a single photo from a project's slideshow by its position.
    @DeleteMapping("/projects/{id}/images/{index}")
    ResponseEntity<?> deleteProjectImage(@PathVariable Long id, @PathVariable int index) {
        Project p = projects.findById(id).orElse(null);
        if (p == null) return ResponseEntity.notFound().build();
        List<String> imgs = p.getImageUrls();
        if (index < 0 || index >= imgs.size())
            return ResponseEntity.badRequest().body(Map.of("message", "No such photo"));
        if (imgs.size() == 1)
            return ResponseEntity.badRequest().body(Map.of("message", "A project needs at least one photo — add another before removing this one"));
        imgs.remove(index);
        p.setImageUrls(imgs);
        return ResponseEntity.ok(projects.save(p));
    }

    @DeleteMapping("/projects/{id}")
    ResponseEntity<?> deleteProject(@PathVariable Long id) {
        if (!projects.existsById(id)) return ResponseEntity.notFound().build();
        projects.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // Shared by both the Projects gallery and Site Updates uploads: only real, browser-renderable
    // image types are accepted. The photo is stored as a base64 data URI directly in the database
    // (not as a file on disk) so it never depends on a static-file route or upload folder being
    // configured/persisted correctly on the server — the browser can render a data: URI directly.
    private static final long MAX_PHOTO_BYTES = 3 * 1024 * 1024; // 3MB, before base64 inflation

    private String saveProjectPhoto(MultipartFile photo) throws IOException {
        if (photo == null || photo.isEmpty()) return null;
        String contentType = photo.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) return null;
        if (photo.getSize() > MAX_PHOTO_BYTES) return null;
        String base64 = Base64.getEncoder().encodeToString(photo.getBytes());
        return "data:" + contentType.toLowerCase() + ";base64," + base64;
    }

    // ---------- Rate / Settings ----------
    record RateUpdate(@NotNull @Positive Double ratePerSqft) {}

    @PutMapping("/settings")
    Settings updateRate(@Valid @RequestBody RateUpdate body) {
        Settings s = settings.findById(1L).orElse(new Settings(1L, 1650.0));
        s.setRatePerSqft(body.ratePerSqft());
        return settings.save(s);
    }

    // ---------- Employees ----------
    @GetMapping("/employees")
    List<Employee> listEmployees() { return employees.findAllByOrderByName(); }

    @PostMapping("/employees")
    Employee createEmployee(@Valid @RequestBody Employee e) {
        e.setId(null);
        if (e.getActive() == null) e.setActive(true);
        return employees.save(e);
    }

    @PutMapping("/employees/{id}")
    ResponseEntity<?> updateEmployee(@PathVariable Long id, @Valid @RequestBody Employee body) {
        return employees.findById(id).map(e -> {
            e.setName(body.getName());
            e.setRole(body.getRole());
            e.setPhone(body.getPhone());
            e.setDailyWage(body.getDailyWage());
            e.setActive(body.getActive());
            return ResponseEntity.ok(employees.save(e));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/employees/{id}")
    ResponseEntity<?> deleteEmployee(@PathVariable Long id) {
        if (!employees.existsById(id)) return ResponseEntity.notFound().build();
        employees.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Attendance ----------
    @GetMapping("/attendance")
    List<Attendance> listAttendance(@RequestParam(required = false) Long employeeId) {
        return employeeId != null
                ? attendance.findByEmployee_IdOrderByDateDesc(employeeId)
                : attendance.findAllByOrderByDateDesc();
    }

    record AttendanceRequest(@NotNull Long employeeId, @NotNull LocalDate date, @NotNull Boolean present,
                              @PositiveOrZero Double hoursWorked, String notes) {}

    @PostMapping("/attendance")
    ResponseEntity<?> markAttendance(@Valid @RequestBody AttendanceRequest r) {
        Employee emp = employees.findById(r.employeeId()).orElse(null);
        if (emp == null) return ResponseEntity.badRequest().body(Map.of("message", "Employee not found"));
        Attendance a = new Attendance(null, emp, r.date(), r.present(), r.hoursWorked(), r.notes());
        return ResponseEntity.ok(attendance.save(a));
    }

    @DeleteMapping("/attendance/{id}")
    ResponseEntity<?> deleteAttendance(@PathVariable Long id) {
        if (!attendance.existsById(id)) return ResponseEntity.notFound().build();
        attendance.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Payments ----------
    @GetMapping("/payments")
    List<Payment> listPayments(@RequestParam(required = false) Long employeeId) {
        return employeeId != null
                ? payments.findByEmployee_IdOrderByDateDesc(employeeId)
                : payments.findAllByOrderByDateDesc();
    }

    record PaymentRequest(@NotNull Long employeeId, @NotNull LocalDate date, @NotNull @Positive Double amount, String notes) {}

    @PostMapping("/payments")
    ResponseEntity<?> addPayment(@Valid @RequestBody PaymentRequest r) {
        Employee emp = employees.findById(r.employeeId()).orElse(null);
        if (emp == null) return ResponseEntity.badRequest().body(Map.of("message", "Employee not found"));
        Payment p = new Payment(null, emp, r.date(), r.amount(), r.notes());
        return ResponseEntity.ok(payments.save(p));
    }

    @DeleteMapping("/payments/{id}")
    ResponseEntity<?> deletePayment(@PathVariable Long id) {
        if (!payments.existsById(id)) return ResponseEntity.notFound().build();
        payments.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Customer accounts ----------
    @GetMapping("/customers")
    List<AppUser> listCustomers() { return users.findByRoleOrderByDisplayName(AppUser.Role.CUSTOMER); }

    record CustomerRequest(String username, String password, String displayName, String phone, String projectName, Double estimatedSqft) {}

    @PostMapping("/customers")
    ResponseEntity<?> createCustomer(@RequestBody CustomerRequest r) {
        if (r.username() == null || r.username().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        if (r.password() == null || r.password().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        if (users.findByUsername(r.username()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
        AppUser u = new AppUser(null, r.username(), encoder.encode(r.password()), AppUser.Role.CUSTOMER,
                r.displayName(), r.phone(), r.projectName(), r.estimatedSqft());
        return ResponseEntity.ok(users.save(u));
    }

    @PutMapping("/customers/{id}")
    ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody CustomerRequest r) {
        return users.findById(id).map(u -> {
            u.setDisplayName(r.displayName());
            u.setPhone(r.phone());
            u.setProjectName(r.projectName());
            u.setEstimatedSqft(r.estimatedSqft());
            if (r.password() != null && !r.password().isBlank()) u.setPasswordHash(encoder.encode(r.password()));
            return ResponseEntity.ok(users.save(u));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/customers/{id}")
    ResponseEntity<?> deleteCustomer(@PathVariable Long id) {
        if (!users.existsById(id)) return ResponseEntity.notFound().build();
        users.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Project updates (site progress, shown only to that customer) ----------
    @GetMapping("/updates")
    List<ProjectUpdate> listUpdates(@RequestParam(required = false) Long customerId) {
        return customerId != null
                ? updates.findByCustomer_IdOrderByWorkDateDesc(customerId)
                : updates.findAllByOrderByWorkDateDesc();
    }

    // Only real, browser-renderable image types are accepted for site progress photos.
    private static final Set<String> ALLOWED_IMAGE_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    @PostMapping(value = "/updates", consumes = "multipart/form-data")
    ResponseEntity<?> createUpdate(@RequestParam Long customerId, @RequestParam String title,
                                    @RequestParam(required = false) String description,
                                    @RequestParam(required = false) String workDate,
                                    @RequestParam(required = false) MultipartFile photo) throws IOException {
        if (title == null || title.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
        AppUser customer = users.findById(customerId).orElse(null);
        if (customer == null) return ResponseEntity.badRequest().body(Map.of("message", "Customer not found"));

        String photoUrl;
        try {
            photoUrl = saveProjectPhoto(photo);
        } catch (IOException ex) {
            return ResponseEntity.internalServerError().body(Map.of("message", "Could not save photo"));
        }
        if (photo != null && !photo.isEmpty() && photoUrl == null)
            return ResponseEntity.badRequest().body(Map.of("message", "Photo must be JPEG/PNG/WEBP/GIF and under 3MB"));

        LocalDate date;
        try {
            date = (workDate != null && !workDate.isBlank()) ? LocalDate.parse(workDate) : LocalDate.now();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid date"));
        }
        ProjectUpdate u = new ProjectUpdate(null, customer, title, description, photoUrl, date, null);
        return ResponseEntity.ok(updates.save(u));
    }

    @DeleteMapping("/updates/{id}")
    ResponseEntity<?> deleteUpdate(@PathVariable Long id) {
        if (!updates.existsById(id)) return ResponseEntity.notFound().build();
        updates.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}