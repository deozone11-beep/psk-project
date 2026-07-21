package com.psk.builders.controller;

import com.psk.builders.model.Settings;
import com.psk.builders.repository.SettingsRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api")
public class ChatController {

    private final SettingsRepository settingsRepository;

    public ChatController(SettingsRepository settingsRepository) {
        this.settingsRepository = settingsRepository;
    }

    @GetMapping("/transliterate")
    public ResponseEntity<?> transliterate(@RequestParam String text) {
        try {
            String encodedText = java.net.URLEncoder.encode(text, "UTF-8");
            String urlString = "https://inputtools.google.com/request?text=" + encodedText + "&itc=ta-t-i0-und&num=5";
            
            java.net.URL url = new java.net.URL(urlString);
            java.net.HttpURLConnection conn = (java.net.HttpURLConnection) url.openConnection();
            conn.setRequestMethod("GET");
            conn.setRequestProperty("User-Agent", "Mozilla/5.0");
            
            java.io.BufferedReader in = new java.io.BufferedReader(new java.io.InputStreamReader(conn.getInputStream(), "UTF-8"));
            String inputLine;
            StringBuilder content = new StringBuilder();
            while ((inputLine = in.readLine()) != null) {
                content.append(inputLine);
            }
            in.close();
            conn.disconnect();
            
            return ResponseEntity.ok()
                    .header("Content-Type", "application/json")
                    .body(content.toString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/chat")
    public ResponseEntity<?> handleChat(@RequestBody Map<String, String> request) {
        String message = request.getOrDefault("message", "").trim().toLowerCase();
        
        Settings settings = settingsRepository.findById(1L)
                .orElse(new Settings(1L, 1650.0, 1980.0));
        double rate = settings.getRatePerSqft();
        double otherRate = settings.getOtherBuilderRatePerSqft();
        int savingsPercent = otherRate > 0 ? (int) Math.round(((otherRate - rate) / otherRate) * 100) : 0;

        String response;

        // 1. Try to extract square footage (e.g., "250 sq ft", "1200sqft", "500 sft", "1000 square feet")
        Pattern sqftPattern = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:sq\\s*ft|sqft|square\\s*feet|square\\s*foot|sft|srf)");
        Matcher matcher = sqftPattern.matcher(message);
        
        // If not matched, try just a number when accompanied by price keywords
        if (!matcher.find()) {
            Pattern numPattern = Pattern.compile("(?:how\\s*much\\s*for|cost\\s*for|rate\\s*for|estimate\\s*for|for)\\s*(\\d+(?:\\.\\d+)?)");
            matcher = numPattern.matcher(message);
        }

        if (matcher.find()) {
            try {
                double sqftVal = Double.parseDouble(matcher.group(1));
                if (sqftVal >= 10 && sqftVal <= 1000000) {
                    double pskTotal = sqftVal * rate;
                    double otherTotal = sqftVal * otherRate;
                    double savings = otherTotal - pskTotal;
                    
                    response = String.format("For a **%,.0f sq ft** project, here is the cost estimation comparison:\n" +
                            "- **PSK Brothers Cost**: ₹%,.0f (at ₹%,.0f / sqft)\n" +
                            "- **Other Builders Cost**: ₹%,.0f (at ₹%,.0f / sqft)\n" +
                            "- **You Save**: **₹%,.0f**! (%d%% cheaper!)\n\n" +
                            "Would you like us to schedule a site visit or prepare a formal quote for this size? Please submit an enquiry form on the page!",
                            sqftVal, pskTotal, rate, otherTotal, otherRate, savings, savingsPercent);
                    return ResponseEntity.ok(Map.of("reply", response));
                }
            } catch (Exception e) {
                // fallback to general keyword matching
            }
        }

        if (message.contains("price") || message.contains("rate") || message.contains("cost") || message.contains("charge") || message.contains("budget") || message.contains("estimation")) {
            response = String.format("Our current construction rate is **₹%,.0f / sqft**, while typical market rates from other builders stand at **₹%,.0f / sqft**. By building with PSK Brothers, you save approximately **%d%%** on your project! Feel free to adjust the cost calculator on our homepage to see your estimated savings.", rate, otherRate, savingsPercent);
        } else if (message.contains("service") || message.contains("offer") || message.contains("do you build") || message.contains("work you do")) {
            response = "We provide comprehensive construction solutions including:\n" +
                    "- **Residential Construction**: Custom-designed, premium homes.\n" +
                    "- **Commercial Buildings**: Offices & commercial structures built for value.\n" +
                    "- **Renovation & Remodeling**: Modern styling upgrades for existing structures.\n" +
                    "- **Planning & Approval**: Structural plans and regulatory clearances.\n" +
                    "- **Interior Works**: Practical and elegant interior execution.\n" +
                    "- **Turnkey Projects**: Full lifecycle handling from concept to handover.";
        } else if (message.contains("contact") || message.contains("phone") || message.contains("call") || message.contains("email") || message.contains("address") || message.contains("location") || message.contains("office")) {
            response = "You can reach PSK Brothers Builders & Constructions through the following channels:\n" +
                    "- **Phone**: +91 90031 77934 or +91 99414 26479\n" +
                    "- **Email**: pskbrothers1991@gmail.com\n" +
                    "- **Office**: Choolaimedu, Chennai, Tamil Nadu - 600094\n" +
                    "Alternatively, click **GET A QUOTE** or use the **Send Enquiry** button at the bottom of the page, and our team will call you back!";
        } else if (message.contains("project") || message.contains("portfolio") || message.contains("completed") || message.contains("ongoing") || message.contains("experience") || message.contains("show work")) {
            response = "With over **24+ years of experience**, we have completed **75+ projects** across Tamil Nadu, including Coimbatore, Chennai, Erode, and Tiruppur. Some of our selected works are displayed in the 'Selected Projects' gallery on our homepage. We use only premium materials and guarantee on-time delivery.";
        } else if (message.contains("process") || message.contains("step") || message.contains("how it works") || message.contains("flow")) {
            response = "Our streamlined process ensures transparency and quality:\n" +
                    "1. **Enquiry**: Tell us about your residential or commercial requirements.\n" +
                    "2. **Site Visit**: Our experts visit your plot to evaluate technical parameters.\n" +
                    "3. **Estimate & Plan**: We provide a clear, itemized quote detailing the Bill of Quantities (BOQ).\n" +
                    "4. **Execution & Handover**: We build with daily photo updates and hand over on schedule.";
        } else if (message.contains("why choose") || message.contains("trust") || message.contains("guarantee") || message.contains("advantage") || message.contains("quality")) {
            response = "PSK Brothers is built on trust and a strict process. Key advantages include:\n" +
                    "- **Zero surprise bills** (itemized cost estimate agreed upfront).\n" +
                    "- **No delay handovers** (schedule penalty clauses).\n" +
                    "- **Daily site tracking** (photo progress updates in your customer portal).\n" +
                    "- **100% in-house skilled masons** (no third-party subcontracts).";
        } else if (message.contains("hello") || message.contains("hi") || message.contains("hey") || message.contains("hola") || message.contains("assistant") || message.contains("bot") || message.contains("who are you")) {
            response = "Hello! I am the PSK Construction AI assistant. I can guide you regarding our construction rates, project experiences, services, office location, or our delivery process. How can I help you today?";
        } else {
            response = "I'm here to help you build your dream project! Ask me about:\n" +
                    "- **Rates**: Current per sqft rates and savings.\n" +
                    "- **Services**: What construction solutions we offer.\n" +
                    "- **Projects**: Completed and ongoing landmarks.\n" +
                    "- **Process**: How we transition from enquiry to handover.\n" +
                    "- **Contact**: Phone, email, and office address details.\n" +
                    "If you want to initiate a project, click the **Send Enquiry** button at the bottom of the page, and our managers will contact you!";
        }

        return ResponseEntity.ok(Map.of("reply", response));
    }
}
