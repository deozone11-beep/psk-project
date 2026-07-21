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
    final ProjectFileRepository files;

    AdminController(EnquiryRepository enquiries, SettingsRepository settings, EmployeeRepository employees,
                     AttendanceRepository attendance, PaymentRepository payments, AppUserRepository users,
                     ProjectUpdateRepository updates, ProjectRepository projects, PasswordEncoder encoder,
                     ProjectFileRepository files) {
        this.enquiries = enquiries;
        this.settings = settings;
        this.employees = employees;
        this.attendance = attendance;
        this.payments = payments;
        this.users = users;
        this.updates = updates;
        this.projects = projects;
        this.encoder = encoder;
        this.files = files;
    }

    @GetMapping("/whoami")
    Map<String, String> whoami() { return Map.of("status", "ok"); }

    // ---------- Enquiries ----------
    @GetMapping("/enquiries")
    List<Enquiry> listEnquiries() { return enquiries.findAllByOrderByCreatedAtDesc(); }

    @GetMapping("/enquiries/assigned")
    List<Enquiry> listAssignedEnquiries(java.security.Principal principal) {
        if (principal == null) return List.of();
        return enquiries.findByAssignedEngineerUsernameOrderByCreatedAtDesc(principal.getName());
    }

    @PutMapping("/enquiries/{id}")
    ResponseEntity<?> updateEnquiry(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return enquiries.findById(id).map(q -> {
            if (body.containsKey("status")) q.setStatus(body.get("status"));
            if (body.containsKey("assignedEngineerUsername")) {
                String val = body.get("assignedEngineerUsername");
                q.setAssignedEngineerUsername("NONE".equalsIgnoreCase(val) || val.isBlank() ? null : val);
            }
            if (body.containsKey("engineerRemarks")) q.setEngineerRemarks(body.get("engineerRemarks"));
            return ResponseEntity.ok(enquiries.save(q));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/enquiries/{id}/reply")
    ResponseEntity<?> replyToEnquiry(@PathVariable Long id, java.security.Principal principal, @RequestBody Map<String, String> body) {
        if (principal == null) return ResponseEntity.status(401).build();
        String msg = body.get("message");
        if (msg == null || msg.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message content is required"));
        }
        return enquiries.findById(id).map(q -> {
            List<Map<String, String>> chat = new ArrayList<>();
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            if (q.getConversationHistory() != null && !q.getConversationHistory().trim().isEmpty()) {
                try {
                    chat = mapper.readValue(q.getConversationHistory(), new com.fasterxml.jackson.core.type.TypeReference<List<Map<String, String>>>() {});
                } catch (Exception e) {}
            }
            String curTime = java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
            Map<String, String> entry = new HashMap<>();
            entry.put("sender", "STAFF");
            entry.put("senderName", principal.getName());
            entry.put("text", msg.trim());
            entry.put("time", curTime);
            chat.add(entry);
            try {
                q.setConversationHistory(mapper.writeValueAsString(chat));
            } catch (Exception e) {
                return ResponseEntity.status(500).body(Map.of("message", "Error saving reply"));
            }
            return ResponseEntity.ok(enquiries.save(q));
        }).orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/enquiries/{id}/convert")
    ResponseEntity<?> convertEnquiryToCustomer(@PathVariable Long id, @RequestBody CustomerRequest r) {
        Enquiry q = enquiries.findById(id).orElse(null);
        if (q == null) return ResponseEntity.notFound().build();

        if (r.username() == null || r.username().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        if (r.password() == null || r.password().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        if (users.findByUsername(r.username()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));

        AppUser u = new AppUser(null, r.username(), encoder.encode(r.password()), AppUser.Role.CUSTOMER,
                r.displayName(), r.phone(), r.projectName(), r.estimatedSqft(), r.email());
        AppUser savedUser = users.save(u);

        q.setStatus("CONVERTED");
        q.setConvertedCustomerId(savedUser.getId());
        enquiries.save(q);

        return ResponseEntity.ok(savedUser);
    }

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
    record RateUpdate(
            @NotNull @Positive Double ratePerSqft,
            @NotNull @Positive Double otherBuilderRatePerSqft
    ) {}

    @PutMapping("/settings")
    ResponseEntity<?> updateRate(@Valid @RequestBody RateUpdate body, org.springframework.security.core.Authentication auth) {
        if (auth.getAuthorities().stream().noneMatch(a -> a.getAuthority().equals("ROLE_ADMIN"))) {
            return ResponseEntity.status(403).body(Map.of("message", "Only administrators can update settings"));
        }
        Settings s = settings.findById(1L).orElse(new Settings(1L, 1650.0, 1980.0));
        s.setRatePerSqft(body.ratePerSqft());
        s.setOtherBuilderRatePerSqft(body.otherBuilderRatePerSqft());
        return ResponseEntity.ok(settings.save(s));
    }

    // ---------- Employees ----------
    @GetMapping("/employees")
    List<Employee> listEmployees() { return employees.findAllByOrderByName(); }

    @PostMapping("/employees")
    ResponseEntity<?> createEmployee(@Valid @RequestBody Employee e) {
        e.setId(null);
        if (e.getActive() == null) e.setActive(true);

        if (e.getUsername() != null && !e.getUsername().trim().isEmpty()) {
            String uname = e.getUsername().trim();
            if (users.findByUsername(uname).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
            }
            if (e.getPassword() == null || e.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Password is required for logins"));
            }
            AppUser.Role uRole;
            try {
                uRole = AppUser.Role.valueOf(e.getLoginRole());
            } catch (Exception ex) {
                return ResponseEntity.badRequest().body(Map.of("message", "Invalid login role"));
            }
            AppUser user = new AppUser(null, uname, encoder.encode(e.getPassword().trim()), uRole,
                    e.getName(), e.getPhone(), null, null, null);
            users.save(user);
            e.setUsername(uname);
        } else {
            e.setUsername(null);
            e.setLoginRole("NONE");
        }
        return ResponseEntity.ok(employees.save(e));
    }

    @PutMapping("/employees/{id}")
    ResponseEntity<?> updateEmployee(@PathVariable Long id, @Valid @RequestBody Employee body) {
        return employees.findById(id).map(e -> {
            String oldUsername = e.getUsername();
            String newUsername = body.getUsername() != null ? body.getUsername().trim() : "";

            if (!newUsername.isEmpty()) {
                Optional<AppUser> existing = users.findByUsername(newUsername);
                if (existing.isPresent() && (oldUsername == null || !existing.get().getUsername().equalsIgnoreCase(oldUsername))) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
                }

                AppUser.Role uRole;
                try {
                    uRole = AppUser.Role.valueOf(body.getLoginRole());
                } catch (Exception ex) {
                    return ResponseEntity.badRequest().body(Map.of("message", "Invalid login role"));
                }

                if (oldUsername == null) {
                    if (body.getPassword() == null || body.getPassword().trim().isEmpty()) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Password is required to create login"));
                    }
                    AppUser newUser = new AppUser(null, newUsername, encoder.encode(body.getPassword().trim()), uRole,
                            body.getName(), body.getPhone(), null, null, null);
                    users.save(newUser);
                } else {
                    Optional<AppUser> optUser = users.findByUsername(oldUsername);
                    if (optUser.isPresent()) {
                        AppUser user = optUser.get();
                        user.setUsername(newUsername);
                        user.setDisplayName(body.getName());
                        user.setPhone(body.getPhone());
                        user.setRole(uRole);
                        if (body.getPassword() != null && !body.getPassword().trim().isEmpty()) {
                            user.setPasswordHash(encoder.encode(body.getPassword().trim()));
                        }
                        users.save(user);
                    } else {
                        if (body.getPassword() == null || body.getPassword().trim().isEmpty()) {
                            return ResponseEntity.badRequest().body(Map.of("message", "Password is required to restore login"));
                        }
                        AppUser newUser = new AppUser(null, newUsername, encoder.encode(body.getPassword().trim()), uRole,
                                body.getName(), body.getPhone(), null, null, null);
                        users.save(newUser);
                    }
                }
                e.setUsername(newUsername);
                e.setLoginRole(body.getLoginRole());
            } else {
                if (oldUsername != null) {
                    users.findByUsername(oldUsername).ifPresent(users::delete);
                }
                e.setUsername(null);
                e.setLoginRole("NONE");
            }

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
        return employees.findById(id).map(e -> {
            if (e.getUsername() != null) {
                users.findByUsername(e.getUsername()).ifPresent(users::delete);
            }
            employees.delete(e);
            return ResponseEntity.noContent().build();
        }).orElse(ResponseEntity.notFound().build());
    }

    // ---------- Attendance ----------
    @GetMapping("/attendance")
    List<Attendance> listAttendance(@RequestParam(required = false) Long employeeId) {
        return employeeId != null
                ? attendance.findByEmployee_IdOrderByDateDesc(employeeId)
                : attendance.findAllByOrderByDateDesc();
    }

    @GetMapping("/attendance/my-status")
    ResponseEntity<?> getMyAttendanceStatus(java.security.Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return employees.findByUsername(principal.getName()).map(emp -> {
            Optional<Attendance> todayAtt = attendance.findByEmployee_IdAndDate(emp.getId(), LocalDate.now());
            if (todayAtt.isPresent()) {
                return ResponseEntity.ok(Map.of(
                    "hasProfile", true,
                    "employee", emp,
                    "checkedIn", true,
                    "attendance", todayAtt.get()
                ));
            } else {
                return ResponseEntity.ok(Map.of(
                    "hasProfile", true,
                    "employee", emp,
                    "checkedIn", false
                ));
            }
        }).orElse(ResponseEntity.ok(Map.of("hasProfile", false)));
    }

    @PostMapping("/attendance/checkin")
    ResponseEntity<?> selfCheckIn(java.security.Principal principal, @RequestBody Map<String, String> body) {
        if (principal == null) return ResponseEntity.status(401).build();
        Employee emp = employees.findByUsername(principal.getName()).orElse(null);
        if (emp == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "No employee profile associated with this account. Contact admin."));
        }

        Optional<Attendance> todayAtt = attendance.findByEmployee_IdAndDate(emp.getId(), LocalDate.now());
        if (todayAtt.isPresent()) {
            return ResponseEntity.badRequest().body(Map.of("message", "You have already checked in for today"));
        }

        String time = body.get("time");
        if (time == null || time.trim().isEmpty()) {
            time = java.time.LocalTime.now().format(java.time.format.DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
        }

        String loc = body.get("location");
        if (body.containsKey("latitude") && body.containsKey("longitude")) {
            loc = "https://www.google.com/maps?q=" + body.get("latitude") + "," + body.get("longitude");
        }

        Attendance a = new Attendance();
        a.setEmployee(emp);
        a.setDate(LocalDate.now());
        a.setPresent(true);
        a.setHoursWorked(8.0);
        a.setNotes("Self Check-in");
        a.setDailyRate(emp.getDailyWage() != null ? emp.getDailyWage() : 0.0);
        a.setExtraDuty(0.0);
        a.setAdvancePaid(0.0);
        a.setCheckInTime(time);
        a.setCheckInLocation(loc);
        return ResponseEntity.ok(attendance.save(a));
    }

    record AttendanceRequest(
        @NotNull Long employeeId, 
        @NotNull LocalDate date, 
        @NotNull Boolean present,
        @PositiveOrZero Double hoursWorked, 
        String notes,
        Double dailyRate,
        Double extraDuty,
        Double advancePaid
    ) {}

    @PostMapping("/attendance")
    ResponseEntity<?> markAttendance(@Valid @RequestBody AttendanceRequest r) {
        Employee emp = employees.findById(r.employeeId()).orElse(null);
        if (emp == null) return ResponseEntity.badRequest().body(Map.of("message", "Employee not found"));
        
        Optional<Attendance> existing = attendance.findByEmployee_IdAndDate(r.employeeId(), r.date());
        Attendance a = existing.orElse(new Attendance());
        a.setEmployee(emp);
        a.setDate(r.date());
        a.setPresent(r.present());
        a.setHoursWorked(r.hoursWorked() != null ? r.hoursWorked() : 8.0);
        a.setNotes(r.notes());
        
        a.setDailyRate(r.dailyRate() != null ? r.dailyRate() : (emp.getDailyWage() != null ? emp.getDailyWage() : 0.0));
        a.setExtraDuty(r.extraDuty() != null ? r.extraDuty() : 0.0);
        a.setAdvancePaid(r.advancePaid() != null ? r.advancePaid() : 0.0);
        
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

    record CustomerRequest(String username, String password, String displayName, String phone, String projectName, Double estimatedSqft, String email) {}

    @PostMapping("/customers")
    ResponseEntity<?> createCustomer(@RequestBody CustomerRequest r) {
        if (r.username() == null || r.username().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Username is required"));
        if (r.password() == null || r.password().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Password is required"));
        if (users.findByUsername(r.username()).isPresent())
            return ResponseEntity.badRequest().body(Map.of("message", "Username already taken"));
        AppUser u = new AppUser(null, r.username(), encoder.encode(r.password()), AppUser.Role.CUSTOMER,
                r.displayName(), r.phone(), r.projectName(), r.estimatedSqft(), r.email());
        return ResponseEntity.ok(users.save(u));
    }

    @PutMapping("/customers/{id}")
    ResponseEntity<?> updateCustomer(@PathVariable Long id, @RequestBody CustomerRequest r) {
        return users.findById(id).map(u -> {
            u.setDisplayName(r.displayName());
            u.setPhone(r.phone());
            u.setProjectName(r.projectName());
            u.setEstimatedSqft(r.estimatedSqft());
            u.setEmail(r.email());
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
                                    @RequestParam(value = "photos", required = false) MultipartFile[] photos) throws IOException {
        if (title == null || title.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Title is required"));
        AppUser customer = users.findById(customerId).orElse(null);
        if (customer == null) return ResponseEntity.badRequest().body(Map.of("message", "Customer not found"));

        List<String> photoUrls = new ArrayList<>();
        if (photos != null && photos.length > 0) {
            for (MultipartFile photo : photos) {
                if (photo != null && !photo.isEmpty()) {
                    String photoUrl = saveProjectPhoto(photo);
                    if (photoUrl == null) {
                        return ResponseEntity.badRequest().body(Map.of("message", "Every photo must be JPEG/PNG/WEBP/GIF and under 3MB"));
                    }
                    photoUrls.add(photoUrl);
                }
            }
        }
        String joinedUrls = photoUrls.isEmpty() ? null : String.join("|||", photoUrls);

        LocalDate date;
        try {
            date = (workDate != null && !workDate.isBlank()) ? LocalDate.parse(workDate) : LocalDate.now();
        } catch (Exception ex) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid date"));
        }
        ProjectUpdate u = new ProjectUpdate(null, customer, title, description, joinedUrls, date, null);
        return ResponseEntity.ok(updates.save(u));
    }

    @DeleteMapping("/updates/{id}")
    ResponseEntity<?> deleteUpdate(@PathVariable Long id) {
        if (!updates.existsById(id)) return ResponseEntity.notFound().build();
        updates.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    // ---------- Project Files ----------
    @GetMapping("/files")
    List<ProjectFile> getFiles(@RequestParam Long customerId) {
        return files.findByCustomer_IdOrderByCreatedAtDesc(customerId);
    }

    @PostMapping(value = "/files", consumes = "multipart/form-data")
    ResponseEntity<?> uploadFile(@RequestParam Long customerId,
                                  @RequestParam String fileName,
                                  @RequestParam String category,
                                  @RequestParam MultipartFile file,
                                  org.springframework.security.core.Authentication auth) throws IOException {
        AppUser customer = users.findById(customerId).orElse(null);
        if (customer == null) return ResponseEntity.badRequest().body(Map.of("message", "Customer not found"));
        if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "File is empty"));

        String mimeType = file.getContentType();
        String base64 = Base64.getEncoder().encodeToString(file.getBytes());
        String dataUri = "data:" + (mimeType != null ? mimeType : "application/octet-stream") + ";base64," + base64;

        AppUser current = users.findByUsername(auth.getName()).orElse(null);
        String uploaderRole = current != null ? current.getRole().name() : "ADMIN";

        ProjectFile pf = new ProjectFile(null, customer, fileName, category, dataUri, auth.getName(), uploaderRole, null);
        return ResponseEntity.ok(files.save(pf));
    }

    @DeleteMapping("/files/{id}")
    ResponseEntity<?> deleteFile(@PathVariable Long id) {
        if (!files.existsById(id)) return ResponseEntity.notFound().build();
        files.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}