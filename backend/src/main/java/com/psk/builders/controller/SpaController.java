package com.psk.builders.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

// The React app is a client-side-routed single-page app. Once its build output is served as
// Spring Boot static content, a direct visit or hard refresh on a route like /admin has no
// matching physical file, so it would 404. This forwards those routes to index.html instead,
// letting the React router (main.jsx, which checks window.location.pathname) take over.
// API paths (/api/**) and static assets are untouched since they don't match these patterns.
@Controller
public class SpaController {
    @GetMapping({"/", "/admin", "/admin/**", "/portal", "/portal/**", "/login", "/login/**"})
    public String index() {
        return "forward:/index.html";
    }
}
