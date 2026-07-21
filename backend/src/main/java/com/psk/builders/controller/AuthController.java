package com.psk.builders.controller;

import com.psk.builders.config.JwtUtil;
import com.psk.builders.model.AppUser;
import com.psk.builders.model.Enquiry;
import com.psk.builders.repository.AppUserRepository;
import com.psk.builders.repository.EnquiryRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    final AuthenticationManager authManager;
    final JwtUtil jwtUtil;
    final AppUserRepository users;
    final PasswordEncoder encoder;
    final EnquiryRepository enquiries;

    public AuthController(AuthenticationManager authManager, JwtUtil jwtUtil, AppUserRepository users,
            PasswordEncoder encoder, EnquiryRepository enquiries) {
        this.authManager = authManager;
        this.jwtUtil = jwtUtil;
        this.users = users;
        this.encoder = encoder;
        this.enquiries = enquiries;
    }

    record LoginRequest(String username, String password) {
    }

    record LoginResponse(String token, String role, String username, String displayName) {
    }

    @PostMapping("/login")
    ResponseEntity<?> login(@RequestBody LoginRequest req) {
        if (req.username() == null || req.password() == null || req.username().isBlank() || req.password().isBlank())
            return ResponseEntity.status(401).body(Map.of("message", "Username and password are required"));
        try {
            authManager.authenticate(new UsernamePasswordAuthenticationToken(req.username(), req.password()));
        } catch (AuthenticationException e) {
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
        }
        AppUser u = users.findByUsername(req.username()).orElse(null);
        if (u == null)
            return ResponseEntity.status(401).body(Map.of("message", "Invalid username or password"));
        String token = jwtUtil.generateToken(u.getUsername(), u.getRole().name(), u.getDisplayName());
        return ResponseEntity.ok(new LoginResponse(token, u.getRole().name(), u.getUsername(), u.getDisplayName()));
    }

    @PostMapping("/forgot-password")
    ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String email = body.get("email");
        String newPassword = body.get("newPassword");
        if (username == null || email == null || newPassword == null || username.isBlank() || email.isBlank()
                || newPassword.isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "Username, email and new password are required"));
        AppUser u = users.findByUsername(username).orElse(null);
        if (u == null || u.getEmail() == null || !u.getEmail().equalsIgnoreCase(email.trim())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Invalid username or email"));
        }
        u.setPasswordHash(encoder.encode(newPassword));
        users.save(u);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully"));
    }

    @PostMapping("/temp-login")
    ResponseEntity<?> tempLogin(@RequestBody Map<String, String> body) {
        String identifier = body.get("identifier");
        if (identifier == null || identifier.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Mobile number or email is required"));
        }

        List<Enquiry> list = enquiries.findByPhoneOrEmail(identifier.trim(), identifier.trim());
        if (list.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "No active enquiry found with this phone number or email"));
        }

        Enquiry match = list.stream()
                .filter(e -> e.getConvertedCustomerId() == null)
                .findFirst()
                .orElse(list.get(0));

        if (match.getConvertedCustomerId() != null) {
            return ResponseEntity.badRequest().body(Map.of("message",
                    "This enquiry has been converted to a main customer account. Please log in using your main account."));
        }

        String token = jwtUtil.generateToken(match.getTrackId(), "TEMP_ENQUIRY", match.getName());
        return ResponseEntity.ok(Map.of(
                "token", token,
                "role", "TEMP_ENQUIRY",
                "username", match.getTrackId(),
                "displayName", match.getName(),
                "enquiryId", match.getId()));
    }
}