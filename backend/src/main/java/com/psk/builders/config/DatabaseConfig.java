package com.psk.builders.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.jdbc.DataSourceBuilder;
import javax.sql.DataSource;
import java.net.URI;

@Configuration
public class DatabaseConfig {

    @Bean
    @Primary
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl == null || databaseUrl.isBlank()) {
            databaseUrl = System.getProperty("DATABASE_URL");
        }
        if (databaseUrl == null || databaseUrl.isBlank()) {
            databaseUrl = "jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres?prepareThreshold=0&preferQueryMode=simple&sslmode=require";
        }
        try {
            if (databaseUrl.startsWith("jdbc:postgresql://")) {
                if (!databaseUrl.contains("prepareThreshold")) {
                    databaseUrl += (databaseUrl.contains("?") ? "&" : "?") + "prepareThreshold=0";
                }
                String username = System.getenv("SPRING_DATASOURCE_USERNAME");
                if (username == null || username.isBlank()) username = System.getenv("DB_USERNAME");
                if (username == null || username.isBlank()) username = "postgres.jlebdbvbakvxaivjnhgj";

                String password = System.getenv("SPRING_DATASOURCE_PASSWORD");
                if (password == null || password.isBlank()) password = System.getenv("DB_PASSWORD");
                if (password == null || password.isBlank()) password = "Meeerakumar@9898";

                return DataSourceBuilder.create()
                        .driverClassName("org.postgresql.Driver")
                        .url(databaseUrl)
                        .username(username)
                        .password(password)
                        .build();
            } else if (databaseUrl.startsWith("jdbc:mysql://")) {
                String username = System.getenv("SPRING_DATASOURCE_USERNAME");
                if (username == null || username.isBlank()) username = System.getenv("DB_USERNAME");
                if (username == null || username.isBlank()) username = "root";

                String password = System.getenv("SPRING_DATASOURCE_PASSWORD");
                if (password == null || password.isBlank()) password = System.getenv("DB_PASSWORD");

                return DataSourceBuilder.create()
                        .driverClassName("com.mysql.cj.jdbc.Driver")
                        .url(databaseUrl)
                        .username(username)
                        .password(password)
                        .build();
            } else if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
                URI dbUri = new URI(databaseUrl);
                String userInfo = dbUri.getUserInfo();
                String username = "";
                String password = "";
                if (userInfo != null) {
                    int colonIndex = userInfo.indexOf(':');
                    if (colonIndex != -1) {
                        username = userInfo.substring(0, colonIndex);
                        password = userInfo.substring(colonIndex + 1);
                    } else {
                        username = userInfo;
                    }
                }
                String portPart = dbUri.getPort() == -1 ? "" : ":" + dbUri.getPort();
                String queryPart = dbUri.getRawQuery() != null ? "?" + dbUri.getRawQuery() : "";
                if (!queryPart.contains("prepareThreshold")) {
                    queryPart += (queryPart.isEmpty() ? "?prepareThreshold=0" : "&prepareThreshold=0");
                }
                String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + portPart + dbUri.getPath() + queryPart;
                
                return DataSourceBuilder.create()
                        .driverClassName("org.postgresql.Driver")
                        .url(dbUrl)
                        .username(username)
                        .password(password)
                        .build();
            } else if (databaseUrl.startsWith("mysql://")) {
                URI dbUri = new URI(databaseUrl);
                String userInfo = dbUri.getUserInfo();
                String username = "";
                String password = "";
                if (userInfo != null) {
                    int colonIndex = userInfo.indexOf(':');
                    if (colonIndex != -1) {
                        username = userInfo.substring(0, colonIndex);
                        password = userInfo.substring(colonIndex + 1);
                    } else {
                        username = userInfo;
                    }
                }
                String portPart = dbUri.getPort() == -1 ? "" : ":" + dbUri.getPort();
                String queryPart = dbUri.getRawQuery() != null ? "?" + dbUri.getRawQuery() : "";
                String dbUrl = "jdbc:mysql://" + dbUri.getHost() + portPart + dbUri.getPath() + queryPart;
                
                return DataSourceBuilder.create()
                        .driverClassName("com.mysql.cj.jdbc.Driver")
                        .url(dbUrl)
                        .username(username)
                        .password(password)
                        .build();
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to parse DATABASE_URL: " + databaseUrl, e);
        }
        throw new IllegalStateException("Unsupported database scheme in DATABASE_URL: " + databaseUrl);
    }
}
