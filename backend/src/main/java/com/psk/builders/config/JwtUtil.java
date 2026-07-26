package com.psk.builders.config;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

// Issues and validates JWTs for the "owner", "admin"/staff, and "customer" logins.
// The role is embedded as a claim, so the auth filter can build the Spring Security
// authority straight from the token without hitting the database on every request.
@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expiryMs;

    public JwtUtil(
            @Value("${app.jwt.secret:}") String secret,
            @Value("${app.jwt.expiry-hours:12}") long expiryHours) {
        // A secret must be at least 256 bits for HS256. If none is configured we generate one
        // for local dev only — this means tokens won't survive a restart. Always set JWT_SECRET
        // (a long random string) via env var before deploying live.
        this.key = (secret != null && secret.length() >= 32)
                ? Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8))
                : Jwts.SIG.HS256.key().build();
        this.expiryMs = expiryHours * 60 * 60 * 1000;
    }

    public String generateToken(String username, String role, String displayName) {
        Date now = new Date();
        return Jwts.builder()
                .subject(username)
                .claim("role", role)
                .claim("displayName", displayName)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expiryMs))
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser().verifyWith(key).build().parseSignedClaims(token).getPayload();
    }
}