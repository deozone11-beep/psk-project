package com.psk.builders.controller;

import com.psk.builders.model.Enquiry;
import com.psk.builders.repository.EnquiryRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.security.Principal;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/temp-enquiry")
public class TempEnquiryController {

    final EnquiryRepository enquiries;
    final ObjectMapper mapper = new ObjectMapper();

    public TempEnquiryController(EnquiryRepository enquiries) {
        this.enquiries = enquiries;
    }

    @GetMapping("/my-tracking")
    public ResponseEntity<?> getMyTracking(Principal principal) {
        if (principal == null) return ResponseEntity.status(401).build();
        return enquiries.findByTrackId(principal.getName())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/message")
    public ResponseEntity<?> sendMessage(Principal principal, @RequestBody Map<String, String> body) {
        if (principal == null) return ResponseEntity.status(401).build();
        String msg = body.get("message");
        if (msg == null || msg.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Message content is required"));
        }

        Enquiry enq = enquiries.findByTrackId(principal.getName()).orElse(null);
        if (enq == null) return ResponseEntity.notFound().build();

        if (enq.getConvertedCustomerId() != null) {
            return ResponseEntity.badRequest().body(Map.of("message", "This enquiry has been converted to a main customer account. Use main chat."));
        }

        List<Map<String, String>> chat = new ArrayList<>();
        if (enq.getConversationHistory() != null && !enq.getConversationHistory().trim().isEmpty()) {
            try {
                chat = mapper.readValue(enq.getConversationHistory(), new TypeReference<List<Map<String, String>>>() {});
            } catch (Exception e) {
                System.err.println("Error parsing conversation history: " + e.getMessage());
            }
        }

        String curTime = LocalTime.now().format(DateTimeFormatter.ofPattern("hh:mm a", Locale.ENGLISH));
        Map<String, String> entry = new HashMap<>();
        entry.put("sender", "USER");
        entry.put("text", msg.trim());
        entry.put("time", curTime);
        chat.add(entry);

        try {
            enq.setConversationHistory(mapper.writeValueAsString(chat));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("message", "Error saving conversation"));
        }

        return ResponseEntity.ok(enquiries.save(enq));
    }
}
