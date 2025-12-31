package com.example.todobackend.controller;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.sql.Connection;

@RestController
@RequestMapping("/api")
public class DbHealthController {

    private final JdbcTemplate jdbcTemplate;

    public DbHealthController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @GetMapping("/db-health")
    public String checkDbConnection() {
        try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
            if (conn.isValid(5)) {
                return "Database connection is successful!";
            } else {
                return "Database connection is NOT valid!";
            }
        } catch (Exception ex) {
            return "Failed to connect to database: " + ex.getMessage();
        }
    }
}
