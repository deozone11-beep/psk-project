package com.psk.builders.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.jdbc.DataSourceBuilder;
import javax.sql.DataSource;
import java.net.URI;

@Configuration
@ConditionalOnProperty(name = "DATABASE_URL")
public class DatabaseConfig {

    @Bean
    public DataSource dataSource() {
        String databaseUrl = System.getenv("DATABASE_URL");
        try {
            if (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) {
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
