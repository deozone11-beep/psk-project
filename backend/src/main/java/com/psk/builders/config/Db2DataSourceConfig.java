package com.psk.builders.config;

import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

/**
 * Second Supabase database configuration.
 * DB: aws-0-ap-south-1 (India region) – census / HLB data
 */
@Configuration
public class Db2DataSourceConfig {

    private static final String DB2_URL =
            "jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres" +
            "?prepareThreshold=0&preferQueryMode=simple&sslmode=require";
    private static final String DB2_USER     = "postgres.bvdkmygolyygkouwikto";
    private static final String DB2_PASSWORD = "Preethakumar@9898";

    @Bean(name = "db2DataSource")
    public DataSource db2DataSource() {
        return DataSourceBuilder.create()
                .driverClassName("org.postgresql.Driver")
                .url(DB2_URL)
                .username(DB2_USER)
                .password(DB2_PASSWORD)
                .build();
    }

    @Bean(name = "db2JdbcTemplate")
    public JdbcTemplate db2JdbcTemplate() {
        return new JdbcTemplate(db2DataSource());
    }
}
