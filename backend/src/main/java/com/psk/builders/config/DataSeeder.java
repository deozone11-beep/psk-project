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
                    } catch (Exception ex) {
                        System.err.println("Could not drop PostgreSQL check constraint: " + ex.getMessage());
                    }
                }
            } catch (Exception e) {
                System.err.println("Database metadata fetch failed: " + e.getMessage());
            }
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
            if (projects.count() == 0) {
                projects.saveAll(List.of(
                    new Project(null, "Modern Family Residence", "Coimbatore", "Completed", List.of("https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Premium Villa", "Erode", "Completed", List.of("https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80")),
                    new Project(null, "Urban Business Centre", "Tiruppur", "Ongoing", List.of("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80"))
                ));
            }
            if (testimonials.count() == 0) {
                testimonials.saveAll(List.of(
                    new Testimonial(null, "Ramesh Kumar", "Coimbatore", "PSK Brothers built our home on time and exactly as planned. Clear communication throughout.", 5),
                    new Testimonial(null, "Priya Selvam", "Erode", "Professional team, honest pricing, and the finish quality was excellent.", 5),
                    new Testimonial(null, "Arun Prakash", "Tiruppur", "They handled our office renovation smoothly with minimal disruption to work.", 4)
                ));
            }
            if (settings.count() == 0) {
                settings.save(new Settings(1L, 1650.0, 1980.0));
            }

            // Staff logins: owner + admin/employee — both get full ADMIN access.
            if (users.findByUsername("owner").isEmpty()) {
                users.save(new AppUser(null, "owner", encoder.encode(ownerPassword), AppUser.Role.ADMIN, "Owner", null, null, null, "owner@psk.com"));
            }
            if (users.findByUsername("admin").isEmpty()) {
                users.save(new AppUser(null, "admin", encoder.encode(adminPassword), AppUser.Role.ADMIN, "Admin / Staff", null, null, null, "admin@psk.com"));
            }
            if (users.findByUsername("engineer").isEmpty()) {
                users.save(new AppUser(null, "engineer", encoder.encode("psk@engineer123"), AppUser.Role.ENGINEER, "Site Engineer", null, null, null, "engineer@psk.com"));
            }

            // Demo customer login, so the customer portal can be tested immediately.
            if (users.findByUsername("customer1").isEmpty()) {
                AppUser demo = users.save(new AppUser(null, "customer1", encoder.encode(demoCustomerPassword),
                        AppUser.Role.CUSTOMER, "Ramesh Kumar", "9876543210", "Modern Family Residence", 1800.0, "customer1@gmail.com"));

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