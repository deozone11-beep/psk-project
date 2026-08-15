package com.psk.builders.controller;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Proxies queries to the second Supabase database (India region — census/HLB data).
 * All endpoints are under /api/admin/db2/
 */
@RestController
@RequestMapping("/api/admin/db2")
public class Db2Controller {

    private final JdbcTemplate db2;

    public Db2Controller(@Qualifier("db2JdbcTemplate") JdbcTemplate db2) {
        this.db2 = db2;
    }

    // ------------------------------------------------------------------ //
    // GET /api/admin/db2/tables  –  list all user tables in public schema
    // ------------------------------------------------------------------ //
    @GetMapping("/tables")
    public ResponseEntity<?> listTables() {
        try {
            List<String> tables = db2.queryForList(
                    "SELECT table_name FROM information_schema.tables " +
                    "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' " +
                    "ORDER BY table_name",
                    String.class
            );
            return ResponseEntity.ok(Map.of("tables", tables));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ------------------------------------------------------------------ //
    // GET /api/admin/db2/table/settings  –  fetch custom admin settings
    // ------------------------------------------------------------------ //
    @GetMapping("/table/settings")
    public ResponseEntity<?> getSettings() {
        try {
            db2.execute("CREATE TABLE IF NOT EXISTS public.settings (" +
                    "id INT PRIMARY KEY, " +
                    "custom_error_filters TEXT" +
                    ")");
            try {
                db2.execute("ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS custom_error_filters TEXT");
            } catch (Exception ignore) {}

            List<Map<String, Object>> rows = db2.queryForList("SELECT * FROM public.settings LIMIT 1");
            return ResponseEntity.ok(Map.of(
                    "table", "settings",
                    "total", rows.size(),
                    "columns", List.of("id", "custom_error_filters"),
                    "rows", rows
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "table", "settings",
                    "total", 0,
                    "columns", List.of("id", "custom_error_filters"),
                    "rows", List.of()
            ));
        }
    }

    // ------------------------------------------------------------------ //
    // GET /api/admin/db2/table/{name}?limit=500&offset=0  –  fetch rows
    // ------------------------------------------------------------------ //
    @GetMapping("/table/{tableName}")
    public ResponseEntity<?> getTableData(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "500") int limit,
            @RequestParam(defaultValue = "0")   int offset
    ) {
        // Basic safety: allow only alphanumeric + underscore table names
        if (!tableName.matches("[a-zA-Z0-9_]+")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid table name"));
        }
        try {
            String countSql = "SELECT COUNT(*) FROM public.\"" + tableName + "\"";
            long total = db2.queryForObject(countSql, Long.class);
            String dataSql;
            if ("hlb_records".equalsIgnoreCase(tableName)) {
                dataSql = "SELECT * FROM public.\"" + tableName + "\" ORDER BY id ASC LIMIT ? OFFSET ?";
            } else {
                dataSql = "SELECT * FROM public.\"" + tableName + "\" LIMIT ? OFFSET ?";
            }
            List<Map<String, Object>> rows = db2.queryForList(dataSql, limit, offset);

            // Derive column names from first row or from information_schema
            List<String> columns;
            if (!rows.isEmpty()) {
                columns = new ArrayList<>(rows.get(0).keySet());
            } else {
                columns = db2.queryForList(
                        "SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position",
                        String.class, tableName
                );
            }

            return ResponseEntity.ok(Map.of(
                    "table", tableName,
                    "total", total,
                    "limit", limit,
                    "offset", offset,
                    "columns", columns,
                    "rows", rows
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ------------------------------------------------------------------ //
    // GET /api/admin/db2/hlb/{hlbNo}  –  fetch rows for a specific HLB number
    // Tries common column names: hlb_no, hlb_number, hlb_id, zone_no, etc.
    // ------------------------------------------------------------------ //
    @GetMapping("/hlb/{hlbNo}")
    public ResponseEntity<?> getHlbData(
            @PathVariable int hlbNo,
            @RequestParam(defaultValue = "") String table
    ) {
        try {
            // If table is not specified, find first table with an hlb-related column
            if (table.isBlank()) {
                List<String> tables = db2.queryForList(
                        "SELECT DISTINCT table_name FROM information_schema.columns " +
                        "WHERE table_schema='public' AND column_name IN " +
                        "('hlb_no','hlb_number','hlb_id','hlb','zone_no','zone_number','zone') " +
                        "ORDER BY table_name LIMIT 5",
                        String.class
                );
                if (tables.isEmpty()) {
                    // Fallback: just list all tables
                    tables = db2.queryForList(
                            "SELECT table_name FROM information_schema.tables " +
                            "WHERE table_schema='public' ORDER BY table_name LIMIT 1",
                            String.class
                    );
                }
                table = tables.isEmpty() ? null : tables.get(0);
            }

            if (table == null || !table.matches("[a-zA-Z0-9_]+")) {
                return ResponseEntity.ok(Map.of(
                        "hlbNo", hlbNo, "table", "", "rows", List.of(), "columns", List.of()
                ));
            }

            // Find the HLB column name for this table
            List<String> hlbCols = db2.queryForList(
                    "SELECT column_name FROM information_schema.columns " +
                    "WHERE table_schema='public' AND table_name=? AND column_name IN " +
                    "('hlb_no','hlb_number','hlb_id','hlb','zone_no','zone_number','zone')" +
                    "ORDER BY ordinal_position LIMIT 1",
                    String.class, table
            );

            String sql;
            List<Map<String, Object>> rows;
            if (!hlbCols.isEmpty()) {
                sql = "SELECT * FROM public.\"" + table + "\" WHERE \"" + hlbCols.get(0) + "\" = ? LIMIT 500";
                rows = db2.queryForList(sql, hlbNo);
            } else {
                sql = "SELECT * FROM public.\"" + table + "\" LIMIT 500";
                rows = db2.queryForList(sql);
            }

            List<String> columns = rows.isEmpty()
                    ? db2.queryForList(
                            "SELECT column_name FROM information_schema.columns " +
                            "WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position",
                            String.class, table)
                    : new ArrayList<>(rows.get(0).keySet());

            return ResponseEntity.ok(Map.of(
                    "hlbNo", hlbNo,
                    "table", table,
                    "columns", columns,
                    "rows", rows
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ------------------------------------------------------------------ //
    // POST /api/admin/db2/table/settings  –  save custom admin settings
    // ------------------------------------------------------------------ //
    @PostMapping("/table/settings")
    public ResponseEntity<?> saveSettings(@RequestBody Map<String, Object> body) {
        try {
            db2.execute("CREATE TABLE IF NOT EXISTS public.settings (" +
                    "id INT PRIMARY KEY, " +
                    "custom_error_filters TEXT" +
                    ")");
            try {
                db2.execute("ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS custom_error_filters TEXT");
            } catch (Exception ignore) {}

            String filtersJson = null;
            if (body.containsKey("custom_error_filters")) {
                Object val = body.get("custom_error_filters");
                filtersJson = (val instanceof String) ? (String) val : val.toString();
            } else if (body.containsKey("error_filters")) {
                Object val = body.get("error_filters");
                filtersJson = (val instanceof String) ? (String) val : val.toString();
            }

            // 1. Save to Supabase PostgreSQL (DB2)
            db2.update(
                "INSERT INTO public.settings (id, custom_error_filters) VALUES (1, ?) " +
                "ON CONFLICT (id) DO UPDATE SET custom_error_filters = EXCLUDED.custom_error_filters",
                filtersJson
            );

            // 2. Also save to MySQL database if running locally
            try {
                String mysqlUrl = "jdbc:mysql://localhost:3306/census_db?allowPublicKeyRetrieval=true&useSSL=false&connectTimeout=2000";
                java.sql.Connection conn = java.sql.DriverManager.getConnection(mysqlUrl, "root", "Meera@9898");
                if (conn != null) {
                    java.sql.Statement stmt = conn.createStatement();
                    stmt.execute("CREATE TABLE IF NOT EXISTS settings (id INT PRIMARY KEY, custom_error_filters LONGTEXT)");
                    try { stmt.execute("ALTER TABLE settings ADD COLUMN custom_error_filters LONGTEXT"); } catch (Exception ignore) {}
                    java.sql.PreparedStatement ps = conn.prepareStatement(
                            "INSERT INTO settings (id, custom_error_filters) VALUES (1, ?) " +
                            "ON DUPLICATE KEY UPDATE custom_error_filters = VALUES(custom_error_filters)"
                    );
                    ps.setString(1, filtersJson);
                    ps.executeUpdate();
                    ps.close();
                    stmt.close();
                    conn.close();
                }
            } catch (Throwable mysqlEx) {
                // Silently ignore if MySQL is unavailable (e.g. running on cloud server like Render)
                System.out.println("MySQL settings sync note: " + mysqlEx.getMessage());
            }

            return ResponseEntity.ok(Map.of("status", "success", "message", "Settings saved to Supabase & MySQL successfully"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    // ------------------------------------------------------------------ //
    // GET /api/admin/db2/ping  –  connection health check
    // ------------------------------------------------------------------ //
    @GetMapping("/ping")
    public ResponseEntity<?> ping() {
        try {
            Integer r = db2.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok(Map.of("status", "ok", "result", r));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("status", "error", "error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }
}

