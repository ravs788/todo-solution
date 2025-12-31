package com.example.todobackend.controller;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.lang.reflect.Field;
import java.sql.Connection;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.*;

class DbHealthControllerTest {

    private JdbcTemplate jdbcTemplate;
    private DataSource dataSource;
    private Connection connection;
    private DbHealthController controller;

    @BeforeEach
    void setup() throws Exception {
        jdbcTemplate = mock(JdbcTemplate.class);
        dataSource = mock(DataSource.class);
        connection = mock(Connection.class);

        when(jdbcTemplate.getDataSource()).thenReturn(dataSource);
        controller = new DbHealthController(jdbcTemplate);
    }

    @Test
    void checkDbConnection_returns_success_when_connection_valid() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(5)).thenReturn(true);

        String result = controller.checkDbConnection();
        assertEquals("Database connection is successful!", result);

        verify(connection).isValid(5);
        verify(connection).close();
    }

    @Test
    void checkDbConnection_returns_not_valid_when_isValid_false() throws Exception {
        when(dataSource.getConnection()).thenReturn(connection);
        when(connection.isValid(5)).thenReturn(false);

        String result = controller.checkDbConnection();
        assertEquals("Database connection is NOT valid!", result);

        verify(connection).isValid(5);
        verify(connection).close();
    }

    @Test
    void checkDbConnection_returns_failure_on_exception() throws Exception {
        when(dataSource.getConnection()).thenThrow(new RuntimeException("boom"));

        String result = controller.checkDbConnection();
        // Starts with failure message and includes exception message
        // Exact message includes the exception text
        assertEquals("Failed to connect to database: boom", result);
    }
}
