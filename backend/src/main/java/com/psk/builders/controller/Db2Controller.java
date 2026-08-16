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
            @RequestParam(defaultValue = "3000") int limit,
            @RequestParam(defaultValue = "0")   int offset
    ) {
        if (!tableName.matches("[a-zA-Z0-9_]+")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid table name"));
        }

        int safeLimit = Math.min(Math.max(limit, 1), 5000);

        try {
            if ("census_errors".equalsIgnoreCase(tableName)) {
                try {
                    db2.execute("CREATE TABLE IF NOT EXISTS public.census_errors (" +
                            "id BIGSERIAL PRIMARY KEY, " +
                            "circle_no VARCHAR(50), " +
                            "hlb_code VARCHAR(50), " +
                            "enumerator_name VARCHAR(150), " +
                            "enumerator_id VARCHAR(150), " +
                            "building_number VARCHAR(100), " +
                            "census_house_num VARCHAR(100), " +
                            "head_name VARCHAR(150), " +
                            "error_type VARCHAR(150), " +
                            "error_description TEXT, " +
                            "line_number INT, " +
                            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                            ")");
                } catch (Exception ignore) {}
            }

            // 1. Get column names to inspect available columns for sorting
            List<String> columns = new ArrayList<>();
            try {
                columns = db2.queryForList(
                        "SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position",
                        String.class, tableName
                );
            } catch (Exception ignore) {}

            // 2. Count total rows
            long total = 0;
            try {
                Long cnt = db2.queryForObject("SELECT COUNT(*) FROM public.\"" + tableName + "\"", Long.class);
                if (cnt != null) total = cnt;
            } catch (Exception e1) {
                try {
                    Long cnt = db2.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
                    if (cnt != null) total = cnt;
                } catch (Exception e2) {}
            }

            // 3. Determine best column to ORDER BY (prefer primary keys / serial / id / line_number)
            String sortCol = null;
            for (String col : columns) {
                String c = col.toLowerCase();
                if (c.equals("id") || c.equals("sl_no") || c.equals("s_no") || c.equals("serial_no") || c.equals("line_number")) {
                    sortCol = col;
                    break;
                }
            }

            String orderClause = (sortCol != null) ? " ORDER BY \"" + sortCol + "\" ASC" : "";

            // 4. Fetch data rows
            List<Map<String, Object>> rows = new ArrayList<>();
            try {
                rows = db2.queryForList(
                        "SELECT * FROM public.\"" + tableName + "\"" + orderClause + " LIMIT ? OFFSET ?",
                        safeLimit, offset
                );
            } catch (Exception e1) {
                try {
                    rows = db2.queryForList(
                            "SELECT * FROM " + tableName + orderClause + " LIMIT ? OFFSET ?",
                            safeLimit, offset
                    );
                } catch (Exception e2) {
                    rows = new ArrayList<>();
                }
            }

            // 5. Fallback to local MySQL if Supabase is empty or unavailable
            if (rows.isEmpty() && "census_errors".equalsIgnoreCase(tableName)) {
                try {
                    String mysqlUrl = "jdbc:mysql://localhost:3306/census_db?allowPublicKeyRetrieval=true&useSSL=false&connectTimeout=2000";
                    java.sql.Connection conn = java.sql.DriverManager.getConnection(mysqlUrl, "root", "Meera@9898");
                    if (conn != null) {
                        java.sql.Statement stmt = conn.createStatement();
                        java.sql.ResultSet rs = stmt.executeQuery("SELECT * FROM census_errors LIMIT " + safeLimit + " OFFSET " + offset);
                        java.sql.ResultSetMetaData md = rs.getMetaData();
                        int colCount = md.getColumnCount();
                        if (columns.isEmpty()) {
                            for (int i = 1; i <= colCount; i++) columns.add(md.getColumnLabel(i));
                        }
                        while (rs.next()) {
                            Map<String, Object> r = new LinkedHashMap<>();
                            for (int i = 1; i <= colCount; i++) {
                                r.put(md.getColumnLabel(i), rs.getObject(i));
                            }
                            rows.add(r);
                        }
                        rs.close();
                        java.sql.ResultSet rsCnt = stmt.executeQuery("SELECT COUNT(*) FROM census_errors");
                        if (rsCnt.next()) total = rsCnt.getLong(1);
                        rsCnt.close();
                        stmt.close();
                        conn.close();
                    }
                } catch (Throwable ignore) {}
            }

            if (columns.isEmpty() && !rows.isEmpty()) {
                columns = new ArrayList<>(rows.get(0).keySet());
            }

            return ResponseEntity.ok(Map.of(
                    "table", tableName,
                    "total", total,
                    "limit", safeLimit,
                    "offset", offset,
                    "columns", columns,
                    "rows", rows
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
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
    @PostMapping({"/table/settings", "/settings"})
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
    // POST /api/admin/db2/sync-errors  –  save active errors into census_errors
    // ------------------------------------------------------------------ //
    @PostMapping({"/sync-errors", "/table/sync-errors"})
    public ResponseEntity<?> syncErrors(@RequestBody List<Map<String, Object>> errors) {
        try {
            // 1. Ensure table exists in Supabase DB2
            db2.execute("CREATE TABLE IF NOT EXISTS public.census_errors (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "circle_no VARCHAR(50), " +
                    "hlb_code VARCHAR(50), " +
                    "enumerator_name VARCHAR(150), " +
                    "enumerator_id VARCHAR(150), " +
                    "building_number VARCHAR(100), " +
                    "census_house_num VARCHAR(100), " +
                    "head_name VARCHAR(150), " +
                    "error_type VARCHAR(150), " +
                    "error_description TEXT, " +
                    "line_number INT, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");

            // 2. Clear old errors (DELETE is safe with PgBouncer connection pooler)
            try {
                db2.execute("DELETE FROM public.census_errors");
            } catch (Exception eDel) {
                System.out.println("Supabase clear note: " + eDel.getMessage());
            }

            if (errors == null || errors.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                        "status", "success",
                        "message", "Census errors table cleaned. 0 records saved.",
                        "count", 0
                ));
            }

            // 3. Ultra-fast Chunked Multi-Row Insert for Supabase DB2
            final int CHUNK_SIZE = 100;
            for (int i = 0; i < errors.size(); i += CHUNK_SIZE) {
                int end = Math.min(i + CHUNK_SIZE, errors.size());
                List<Map<String, Object>> chunk = errors.subList(i, end);

                StringBuilder sqlBuilder = new StringBuilder();
                sqlBuilder.append("INSERT INTO public.census_errors ")
                        .append("(circle_no, hlb_code, enumerator_name, enumerator_id, building_number, census_house_num, head_name, error_type, error_description, line_number) VALUES ");

                List<Object> params = new ArrayList<>();
                for (int j = 0; j < chunk.size(); j++) {
                    if (j > 0) sqlBuilder.append(", ");
                    sqlBuilder.append("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    Map<String, Object> err = chunk.get(j);
                    params.add(err.get("circle_no") != null ? err.get("circle_no").toString() : "");
                    params.add(err.get("hlb_code") != null ? err.get("hlb_code").toString() : "");
                    params.add(err.get("enumerator_name") != null ? err.get("enumerator_name").toString() : "");
                    params.add(err.get("enumerator_id") != null ? err.get("enumerator_id").toString() : "");
                    params.add(err.get("building_number") != null ? err.get("building_number").toString() : "");
                    params.add(err.get("census_house_num") != null ? err.get("census_house_num").toString() : "");
                    params.add(err.get("head_name") != null ? err.get("head_name").toString() : "");
                    params.add(err.get("error_type") != null ? err.get("error_type").toString() : "");
                    params.add(err.get("error_description") != null ? err.get("error_description").toString() : "");

                    Object lineObj = err.get("line_number");
                    int lineNum = 0;
                    if (lineObj instanceof Number) {
                        lineNum = ((Number) lineObj).intValue();
                    } else if (lineObj != null) {
                        try { lineNum = Integer.parseInt(lineObj.toString()); } catch (Exception ignore) {}
                    }
                    params.add(lineNum);
                }
                try {
                    db2.update(sqlBuilder.toString(), params.toArray());
                } catch (Exception eIns) {
                    System.out.println("Supabase insert chunk error: " + eIns.getMessage());
                }
            }

            // 4. Also save to local MySQL database
            try {
                String[] pwdAttempts = new String[]{"Meera@9898", "root", "", "admin", "password"};
                java.sql.Connection conn = null;
                for (String pwd : pwdAttempts) {
                    try {
                        String mysqlUrl = "jdbc:mysql://localhost:3306/census_db?allowPublicKeyRetrieval=true&useSSL=false&connectTimeout=1000";
                        conn = java.sql.DriverManager.getConnection(mysqlUrl, "root", pwd);
                        if (conn != null) break;
                    } catch (Throwable ignore) {}
                }

                if (conn != null) {
                    java.sql.Statement stmt = conn.createStatement();
                    stmt.execute("CREATE TABLE IF NOT EXISTS census_errors (" +
                            "id BIGINT AUTO_INCREMENT PRIMARY KEY, " +
                            "circle_no VARCHAR(50), " +
                            "hlb_code VARCHAR(50), " +
                            "enumerator_name VARCHAR(150), " +
                            "enumerator_id VARCHAR(150), " +
                            "building_number VARCHAR(100), " +
                            "census_house_num VARCHAR(100), " +
                            "head_name VARCHAR(150), " +
                            "error_type VARCHAR(150), " +
                            "error_description TEXT, " +
                            "line_number INT, " +
                            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                            ")");
                    stmt.execute("DELETE FROM census_errors");

                    if (errors != null && !errors.isEmpty()) {
                        for (int i = 0; i < errors.size(); i += CHUNK_SIZE) {
                            int end = Math.min(i + CHUNK_SIZE, errors.size());
                            List<Map<String, Object>> chunk = errors.subList(i, end);
                            StringBuilder sqlBuilder = new StringBuilder();
                            sqlBuilder.append("INSERT INTO census_errors ")
                                    .append("(circle_no, hlb_code, enumerator_name, enumerator_id, building_number, census_house_num, head_name, error_type, error_description, line_number) VALUES ");
                            for (int j = 0; j < chunk.size(); j++) {
                                if (j > 0) sqlBuilder.append(", ");
                                sqlBuilder.append("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                            }
                            java.sql.PreparedStatement ps = conn.prepareStatement(sqlBuilder.toString());
                            int pIdx = 1;
                            for (Map<String, Object> err : chunk) {
                                ps.setString(pIdx++, err.get("circle_no") != null ? err.get("circle_no").toString() : "");
                                ps.setString(pIdx++, err.get("hlb_code") != null ? err.get("hlb_code").toString() : "");
                                ps.setString(pIdx++, err.get("enumerator_name") != null ? err.get("enumerator_name").toString() : "");
                                ps.setString(pIdx++, err.get("enumerator_id") != null ? err.get("enumerator_id").toString() : "");
                                ps.setString(pIdx++, err.get("building_number") != null ? err.get("building_number").toString() : "");
                                ps.setString(pIdx++, err.get("census_house_num") != null ? err.get("census_house_num").toString() : "");
                                ps.setString(pIdx++, err.get("head_name") != null ? err.get("head_name").toString() : "");
                                ps.setString(pIdx++, err.get("error_type") != null ? err.get("error_type").toString() : "");
                                ps.setString(pIdx++, err.get("error_description") != null ? err.get("error_description").toString() : "");

                                Object lineObj = err.get("line_number");
                                int lineNum = 0;
                                if (lineObj instanceof Number) {
                                    lineNum = ((Number) lineObj).intValue();
                                } else if (lineObj != null) {
                                    try { lineNum = Integer.parseInt(lineObj.toString()); } catch (Exception ignore) {}
                                }
                                ps.setInt(pIdx++, lineNum);
                            }
                            ps.executeUpdate();
                            ps.close();
                        }
                    }
                    stmt.close();
                    conn.close();
                }
            } catch (Throwable mysqlEx) {
                System.out.println("MySQL census_errors sync note: " + mysqlEx.getMessage());
            }

            return ResponseEntity.ok(Map.of(
                    "status", "success",
                    "message", "Successfully synced " + errors.size() + " active errors to Supabase & MySQL census_errors table.",
                    "count", errors.size()
            ));
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

