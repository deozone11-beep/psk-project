package com.psk.builders.config;

import com.psk.builders.model.*;
import com.psk.builders.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.time.LocalDate;
import java.util.List;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seed(
            ServiceRepository services,
            ProjectRepository projects,
            TestimonialRepository testimonials,
            SettingsRepository settings,
            AppUserRepository users,
            ProjectUpdateRepository updates,
            PasswordEncoder encoder,
            DataSource dataSource,
            @Value("${owner.password:psk@owner123}") String ownerPassword,
            @Value("${admin.password:psk@admin123}") String adminPassword,
            @Value("${demo.customer.password:customer123}") String demoCustomerPassword
    ) {
        return args -> {
            // Fix role column constraint if running on MySQL or PostgreSQL
            try (Connection conn = dataSource.getConnection()) {
                String dbProduct = conn.getMetaData().getDatabaseProductName();
                if (dbProduct != null && dbProduct.toLowerCase().contains("mysql")) {
                    try (Statement stmt = conn.createStatement()) {
                        stmt.executeUpdate("ALTER TABLE app_user MODIFY COLUMN role VARCHAR(50)");
                        stmt.executeUpdate("ALTER TABLE project_file MODIFY COLUMN file_data LONGTEXT");
                        stmt.executeUpdate("ALTER TABLE project_update MODIFY COLUMN photo_url LONGTEXT");
                    } catch (Exception ex) {
                        System.err.println("Could not alter columns: " + ex.getMessage());
                    }
                } else if (dbProduct != null && dbProduct.toLowerCase().contains("postgresql")) {
                    try (Statement stmt = conn.createStatement()) {
                        stmt.executeUpdate("ALTER TABLE app_user DROP CONSTRAINT IF EXISTS app_user_role_check");
                        stmt.executeUpdate("ALTER TABLE testimonial ADD COLUMN IF NOT EXISTS phone VARCHAR(255)");
                        stmt.executeUpdate("ALTER TABLE testimonial ADD COLUMN IF NOT EXISTS email VARCHAR(255)");
                        stmt.executeUpdate("ALTER TABLE testimonial ADD COLUMN IF NOT EXISTS status VARCHAR(255) DEFAULT 'APPROVED'");
                        stmt.executeUpdate("ALTER TABLE testimonial ADD COLUMN IF NOT EXISTS created_at TIMESTAMP");
                    } catch (Exception ex) {
                        System.err.println("Could not update PostgreSQL testimonial schema: " + ex.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("Database metadata fetch failed: " + e.getMessage());
            }

            try {
                if (services.count() == 0) {
                    services.saveAll(List.of(
                        new ServiceItem(null, "Residential Construction", "Beautiful, durable homes with transparent estimates."),
                        new ServiceItem(null, "Commercial Buildings", "Professional spaces built for long-term value."),
                        new ServiceItem(null, "Renovation & Remodeling", "Modern upgrades for existing buildings."),
                        new ServiceItem(null, "Planning & Approval", "Plans, estimates and approval guidance."),
                        new ServiceItem(null, "Interior Works", "Elegant and practical interior execution."),
                        new ServiceItem(null, "Turnkey Projects", "One team from concept through handover.")
                    ));
                }
            } catch (Exception ex) { System.err.println("Services seed error: " + ex.getMessage()); }

            try {
                List<Project> defaultProjects = List.of(
                    new Project(null, "Modern Family Residence", "Porur, Chennai", "Completed", "Residential", "2,800 Sq.Ft.", "10 Months", "Karthik & Family", "2024", "Ultra-modern 3-story luxury residential home built with RCC framed structure, Italian marble flooring, teakwood joinery, and custom glass elevation.", List.of("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Premium Contemporary Villa", "Perundurai, Erode", "Completed", "Villa", "4,500 Sq.Ft.", "12 Months", "Senthil Kumar", "2024", "Spacious 4BHK architectural masterpiece with indoor courtyard, private swimming pool, home automation, and solar roofing system.", List.of("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Urban Business Centre & Complex", "Tiruppur", "Ongoing", "Commercial", "14,000 Sq.Ft.", "14 Months", "Apex Garment Exports", "2025", "5-story commercial corporate headquarters with glass curtain wall facade, basement parking, high-speed elevator shafts, and fire safety systems.", List.of("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Grand Horizon Luxury Apartments", "R.S. Puram, Coimbatore", "Completed", "Residential", "18,500 Sq.Ft.", "18 Months", "Horizon Realty Group", "2023", "Boutique multi-family residential complex featuring 12 luxury 3BHK apartments with underground parking, gym, and rooftop garden.", List.of("https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Heritage Villa Structural Renovation", "Choolaimedu, Chennai", "Completed", "Renovation", "3,200 Sq.Ft.", "6 Months", "Dr. V. Natarajan", "2023", "Complete modern structural overhaul of a 35-year-old traditional home, adding a modern floor, new RCC beams, updated plumbing, and contemporary interiors.", List.of("https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Eco-Green Gated Community", "Saravanampatti, Coimbatore", "Ongoing", "Residential", "22,000 Sq.Ft.", "20 Months", "PSK Green Enclave", "2025", "Gated community featuring 8 eco-friendly smart villas with rainwater harvesting, solar integration, and landscaped private gardens.", List.of("https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Imperial Plaza Commercial Retail Hub", "Fairlands, Salem", "Completed", "Commercial", "9,800 Sq.Ft.", "11 Months", "Imperial Retails Ltd", "2024", "Modern multi-retail shopping plaza with structural steel glass front, high durability epoxy flooring, and centralized air conditioning ducting.", List.of("https://images.unsplash.com/photo-1555636222-cae831e670b3?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Skyline Duplex Villa", "Thillai Nagar, Trichy", "Ongoing", "Villa", "3,600 Sq.Ft.", "10 Months", "Anand Kumar", "2025", "Duplex villa featuring double-height ceiling living hall, modern cantilevered staircase, master bedroom balconies, and exterior wood louvers.", List.of("https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1200&q=80", "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80"))
                );

                List<Project> existingList = projects.findAll();
                for (Project dp : defaultProjects) {
                    if (existingList.stream().noneMatch(existing -> existing.getTitle().equalsIgnoreCase(dp.getTitle()))) {
                        projects.save(dp);
                    }
                }
            } catch (Exception ex) { System.err.println("Projects seed error: " + ex.getMessage()); }

            try {
                if (testimonials.count() == 0) {
                    testimonials.saveAll(List.of(
                        new Testimonial(null, "Ramesh Kumar", "Coimbatore", "PSK Brothers built our home on time and exactly as planned. Clear communication throughout.", 5, "+91 98421 12345", "ramesh@gmail.com", "APPROVED", java.time.LocalDateTime.now()),
                        new Testimonial(null, "Priya Selvam", "Erode", "Professional team, honest pricing, and the finish quality was excellent.", 5, "+91 97890 23456", "priya@gmail.com", "APPROVED", java.time.LocalDateTime.now()),
                        new Testimonial(null, "Arun Prakash", "Tiruppur", "They handled our office renovation smoothly with minimal disruption to work.", 4, "+91 99440 34567", "arun@gmail.com", "APPROVED", java.time.LocalDateTime.now())
                    ));
                }
            } catch (Exception ex) { System.err.println("Testimonials seed error: " + ex.getMessage()); }

            try {
                if (settings.count() == 0) {
                    settings.save(new Settings(1L, 1650.0, 1980.0));
                }
            } catch (Exception ex) { System.err.println("Settings seed error: " + ex.getMessage()); }

            // Staff logins: owner + admin/employee — both get full ADMIN access.
            if (users.findByUsername("owner").isEmpty()) {
                users.save(new AppUser(null, "owner", encoder.encode(ownerPassword), AppUser.Role.ADMIN, "Owner", null, null, null, "owner@psk.com", null));
            }
            if (users.findByUsername("admin").isEmpty()) {
                users.save(new AppUser(null, "admin", encoder.encode(adminPassword), AppUser.Role.ADMIN, "Admin / Staff", null, null, null, "admin@psk.com", null));
            }
            if (users.findByUsername("engineer").isEmpty()) {
                users.save(new AppUser(null, "engineer", encoder.encode("psk@engineer123"), AppUser.Role.ENGINEER, "Site Engineer", null, null, null, "engineer@psk.com", null));
            }

            // Demo customer login, so the customer portal can be tested immediately.
            if (users.findByUsername("customer1").isEmpty()) {
                AppUser demo = users.save(new AppUser(null, "customer1", encoder.encode(demoCustomerPassword),
                        AppUser.Role.CUSTOMER, "Ramesh Kumar", "9876543210", "Modern Family Residence", 1800.0, "customer1@gmail.com", "engineer"));

                updates.save(new ProjectUpdate(null, demo, "Foundation completed",
                        "Foundation work finished and approved by our site engineer. Moving to structure work next.",
                        null, LocalDate.now().minusDays(10), "Er. Dinesh Kumar (Site Engineer)", "Murugan (Mason), Selvam (Helper), Karthi (Bar Bender)", null));
                updates.save(new ProjectUpdate(null, demo, "Structure work in progress",
                        "Ground floor columns and slab work underway. On schedule.",
                        null, LocalDate.now().minusDays(3), "Er. Dinesh Kumar (Site Engineer)", "Murugan (Mason), Selvam (Helper), Vijay (Electrician)", null));
            }
        };
    }
}