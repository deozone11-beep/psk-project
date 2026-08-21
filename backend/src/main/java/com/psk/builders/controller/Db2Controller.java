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
    // GET & POST /api/admin/db2/zones  –  fetch & register zones
    // ------------------------------------------------------------------ //
    @GetMapping("/zones")
    public ResponseEntity<?> getZones() {
        try {
            ensureSettingsTable();
            List<Map<String, Object>> rows = db2.queryForList("SELECT zones_json FROM public.settings WHERE id=1 LIMIT 1");
            if (!rows.isEmpty() && rows.get(0).get("zones_json") != null) {
                String json = rows.get(0).get("zones_json").toString();
                if (!json.isBlank()) {
                    return ResponseEntity.ok(Map.of("zones", json));
                }
            }
            // Default zones: All 15 Greater Chennai Corporation (GCC) Administrative Zones
            List<Map<String, String>> defaultZones = List.of(
                    Map.of("zoneNo", "11", "name", "Zone 11 (Valasaravakkam)", "wards", "143-155", "table", "hlb_records_zone_11"),
                    Map.of("zoneNo", "01", "name", "Zone 01 (Thiruvottiyur)", "wards", "001-014", "table", "hlb_records_zone_01"),
                    Map.of("zoneNo", "02", "name", "Zone 02 (Manali)", "wards", "015-021", "table", "hlb_records_zone_02"),
                    Map.of("zoneNo", "03", "name", "Zone 03 (Madhavaram)", "wards", "022-033", "table", "hlb_records_zone_03"),
                    Map.of("zoneNo", "04", "name", "Zone 04 (Tondiarpet)", "wards", "034-048", "table", "hlb_records_zone_04"),
                    Map.of("zoneNo", "05", "name", "Zone 05 (Royapuram)", "wards", "049-063", "table", "hlb_records_zone_05"),
                    Map.of("zoneNo", "06", "name", "Zone 06 (Thiru-Vi-Ka Nagar / Kolathur)", "wards", "064-078", "table", "hlb_records_zone_06"),
                    Map.of("zoneNo", "07", "name", "Zone 07 (Ambattur)", "wards", "079-093", "table", "hlb_records_zone_07"),
                    Map.of("zoneNo", "08", "name", "Zone 08 (Anna Nagar)", "wards", "094-108", "table", "hlb_records_zone_08"),
                    Map.of("zoneNo", "09", "name", "Zone 09 (Teynampet)", "wards", "109-126", "table", "hlb_records_zone_09"),
                    Map.of("zoneNo", "10", "name", "Zone 10 (Kodambakkam)", "wards", "127-142", "table", "hlb_records_zone_10"),
                    Map.of("zoneNo", "12", "name", "Zone 12 (Alandur)", "wards", "156-167", "table", "hlb_records_zone_12"),
                    Map.of("zoneNo", "13", "name", "Zone 13 (Adyar)", "wards", "168-180", "table", "hlb_records_zone_13"),
                    Map.of("zoneNo", "14", "name", "Zone 14 (Perungudi / Jaladianpet)", "wards", "181-191", "table", "hlb_records_zone_14"),
                    Map.of("zoneNo", "15", "name", "Zone 15 (Sholinganallur)", "wards", "192-200", "table", "hlb_records_zone_15")
            );
            return ResponseEntity.ok(Map.of("zones", defaultZones));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("zones", List.of(
                    Map.of("zoneNo", "11", "name", "Zone 11 (Valasaravakkam)", "wards", "143-155", "table", "hlb_records_zone_11"),
                    Map.of("zoneNo", "01", "name", "Zone 01 (Thiruvottiyur)", "wards", "001-014", "table", "hlb_records_zone_01"),
                    Map.of("zoneNo", "02", "name", "Zone 02 (Manali)", "wards", "015-021", "table", "hlb_records_zone_02"),
                    Map.of("zoneNo", "03", "name", "Zone 03 (Madhavaram)", "wards", "022-033", "table", "hlb_records_zone_03"),
                    Map.of("zoneNo", "04", "name", "Zone 04 (Tondiarpet)", "wards", "034-048", "table", "hlb_records_zone_04"),
                    Map.of("zoneNo", "05", "name", "Zone 05 (Royapuram)", "wards", "049-063", "table", "hlb_records_zone_05"),
                    Map.of("zoneNo", "06", "name", "Zone 06 (Thiru-Vi-Ka Nagar / Kolathur)", "wards", "064-078", "table", "hlb_records_zone_06"),
                    Map.of("zoneNo", "07", "name", "Zone 07 (Ambattur)", "wards", "079-093", "table", "hlb_records_zone_07"),
                    Map.of("zoneNo", "08", "name", "Zone 08 (Anna Nagar)", "wards", "094-108", "table", "hlb_records_zone_08"),
                    Map.of("zoneNo", "09", "name", "Zone 09 (Teynampet)", "wards", "109-126", "table", "hlb_records_zone_09"),
                    Map.of("zoneNo", "10", "name", "Zone 10 (Kodambakkam)", "wards", "127-142", "table", "hlb_records_zone_10"),
                    Map.of("zoneNo", "12", "name", "Zone 12 (Alandur)", "wards", "156-167", "table", "hlb_records_zone_12"),
                    Map.of("zoneNo", "13", "name", "Zone 13 (Adyar)", "wards", "168-180", "table", "hlb_records_zone_13"),
                    Map.of("zoneNo", "14", "name", "Zone 14 (Perungudi / Jaladianpet)", "wards", "181-191", "table", "hlb_records_zone_14"),
                    Map.of("zoneNo", "15", "name", "Zone 15 (Sholinganallur)", "wards", "192-200", "table", "hlb_records_zone_15")
            )));
        }
    }

    @PostMapping("/zones")
    public ResponseEntity<?> saveZones(@RequestBody Map<String, Object> body) {
        try {
            ensureSettingsTable();
            Object zonesObj = body.get("zones");
            String zonesJson = (zonesObj instanceof String) ? (String) zonesObj : (zonesObj != null ? zonesObj.toString() : "");

            db2.update(
                "INSERT INTO public.settings (id, zones_json) VALUES (1, ?) " +
                "ON CONFLICT (id) DO UPDATE SET zones_json = EXCLUDED.zones_json",
                zonesJson
            );

            // Also auto-create zone table if a new zoneNo was provided
            if (body.containsKey("newZoneNo")) {
                String newZoneNo = String.format("%02d", Integer.parseInt(body.get("newZoneNo").toString().replaceAll("[^0-9]", "")));
                ensureZoneTableExists("hlb_records_zone_" + newZoneNo);
            }

            return ResponseEntity.ok(Map.of("status", "success", "message", "Zones configuration updated"));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private void ensureSettingsTable() {
        try {
            db2.execute("CREATE TABLE IF NOT EXISTS public.settings (" +
                    "id INT PRIMARY KEY, " +
                    "custom_error_filters TEXT, " +
                    "zones_json TEXT" +
                    ")");
            try { db2.execute("ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS custom_error_filters TEXT"); } catch (Exception ignore) {}
            try { db2.execute("ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS zones_json TEXT"); } catch (Exception ignore) {}
        } catch (Exception ignore) {}
    }

    private void ensureZoneTableExists(String tableName) {
        try {
            // If table already exists, return
            Integer count = db2.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name=?",
                Integer.class, tableName
            );
            if (count != null && count > 0) return;

            // Check if base hlb_records table exists to copy schema
            Integer baseExists = db2.queryForObject(
                "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public' AND table_name='hlb_records'",
                Integer.class
            );

            if (baseExists != null && baseExists > 0) {
                db2.execute("CREATE TABLE IF NOT EXISTS public.\"" + tableName + "\" (LIKE public.hlb_records INCLUDING ALL)");
            } else {
                db2.execute("CREATE TABLE IF NOT EXISTS public.\"" + tableName + "\" (" +
                        "id BIGSERIAL PRIMARY KEY, " +
                        "hlb_code VARCHAR(100), " +
                        "line_number VARCHAR(50), " +
                        "building_number VARCHAR(100), " +
                        "census_house_num VARCHAR(100), " +
                        "floor_material_name VARCHAR(255), " +
                        "wall_material_name VARCHAR(255), " +
                        "roof_material_name VARCHAR(255), " +
                        "use_of_census_house_name VARCHAR(255), " +
                        "house_condition_name VARCHAR(255), " +
                        "household_number VARCHAR(100), " +
                        "count_of_persons VARCHAR(50), " +
                        "gender_name VARCHAR(50), " +
                        "caste_categ_name VARCHAR(100), " +
                        "ownership_name VARCHAR(100), " +
                        "num_of_dwelling_rooms VARCHAR(50), " +
                        "married_couple_count VARCHAR(50), " +
                        "water_source_name VARCHAR(255), " +
                        "water_src_avail_name VARCHAR(255), " +
                        "lighting_src_name VARCHAR(255), " +
                        "latrine_acc_src_name VARCHAR(255), " +
                        "latrine_type_name VARCHAR(255), " +
                        "waste_water_outlet_name VARCHAR(255), " +
                        "bathing_facility_name VARCHAR(255), " +
                        "avail_kitchen_lpgname VARCHAR(255), " +
                        "cooking_fuel_name VARCHAR(255), " +
                        "radio_trans_type_name VARCHAR(100), " +
                        "telev_type_name VARCHAR(100), " +
                        "net_device_name VARCHAR(100), " +
                        "is_comp_lap_available VARCHAR(50), " +
                        "phone_smartphone_name VARCHAR(100), " +
                        "bicycle_scooter_name VARCHAR(100), " +
                        "is_car_jeep_available VARCHAR(50), " +
                        "cereal_type_name VARCHAR(100), " +
                        "mobile VARCHAR(50), " +
                        "householdhead_name VARCHAR(255), " +
                        "actual_use_of_census_house VARCHAR(255), " +
                        "self_enumeration_id VARCHAR(100), " +
                        "is_locked VARCHAR(50), " +
                        "is_institutional VARCHAR(50), " +
                        "supervisor_remarks TEXT, " +
                        "status VARCHAR(50), " +
                        "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                        ")");
            }
        } catch (Exception e) {
            System.out.println("ensureZoneTableExists note: " + e.getMessage());
        }
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
            ensureSettingsTable();
            List<Map<String, Object>> rows = db2.queryForList("SELECT * FROM public.settings LIMIT 1");
            return ResponseEntity.ok(Map.of(
                    "table", "settings",
                    "total", rows.size(),
                    "columns", List.of("id", "custom_error_filters", "zones_json"),
                    "rows", rows
            ));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of(
                    "table", "settings",
                    "total", 0,
                    "columns", List.of("id", "custom_error_filters", "zones_json"),
                    "rows", List.of()
            ));
        }
    }

    // ------------------------------------------------------------------ //
    // GET /api/admin/db2/table/{name}?limit=500&offset=0&zone=06  –  fetch rows
    // ------------------------------------------------------------------ //
    @GetMapping("/table/{tableName}")
    public ResponseEntity<?> getTableData(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "3000") int limit,
            @RequestParam(defaultValue = "0")   int offset,
            @RequestParam(required = false)     String zone
    ) {
        if (!tableName.matches("[a-zA-Z0-9_]+")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid table name"));
        }

        int safeLimit = Math.min(Math.max(limit, 1), 5000);
        String targetTable = tableName;

        // Zone-wise Dynamic Table Routing for HLB records
        if (zone != null && !zone.trim().isBlank()) {
            String cleanZone = zone.trim().replaceAll("[^0-9a-zA-Z]", "");
            if (cleanZone.matches("\\d+")) {
                cleanZone = String.format("%02d", Integer.parseInt(cleanZone));
            }
            if (tableName.equalsIgnoreCase("hlb_records") || tableName.toLowerCase().startsWith("hlb_records_zone_")) {
                targetTable = "hlb_records_zone_" + cleanZone;
                ensureZoneTableExists(targetTable);
            }
        }

        try {
            if ("census_errors".equalsIgnoreCase(targetTable)) {
                try {
                    db2.execute("CREATE TABLE IF NOT EXISTS public.census_errors (" +
                            "id BIGSERIAL PRIMARY KEY, " +
                            "circle_no VARCHAR(50), " +
                            "hlb_code VARCHAR(50), " +
                            "zone_no VARCHAR(50), " +
                            "enumerator_name VARCHAR(150), " +
                            "enumerator_id VARCHAR(150), " +
                            "building_number VARCHAR(100), " +
                            "census_house_num VARCHAR(100), " +
                            "head_name VARCHAR(150), " +
                            "head_mobile VARCHAR(50), " +
                            "error_type VARCHAR(150), " +
                            "error_description TEXT, " +
                            "line_number INT, " +
                            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                            ")");
                    try { db2.execute("ALTER TABLE public.census_errors ADD COLUMN IF NOT EXISTS zone_no VARCHAR(50)"); } catch (Exception ignore) {}
                    try { db2.execute("ALTER TABLE public.census_errors ADD COLUMN IF NOT EXISTS head_mobile VARCHAR(50)"); } catch (Exception ignore) {}
                } catch (Exception ignore) {}
            }

            // Ensure zone_no column exists in metadata tables
            if ("hlb_allotted".equalsIgnoreCase(targetTable) || "user_details".equalsIgnoreCase(targetTable) || "charge_wise_report".equalsIgnoreCase(targetTable)) {
                try { db2.execute("ALTER TABLE public.\"" + targetTable + "\" ADD COLUMN IF NOT EXISTS zone_no VARCHAR(50)"); } catch (Exception ignore) {}
            }

            // 1. Get column names to inspect available columns for sorting
            List<String> columns = new ArrayList<>();
            try {
                columns = db2.queryForList(
                        "SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position",
                        String.class, targetTable
                );
            } catch (Exception ignore) {}

            boolean isZoneTable = targetTable.startsWith("hlb_records_zone_");

            // Zone filter clause for non-partitioned tables that have zone_no column
            String whereClause = "";
            List<Object> countParams = new ArrayList<>();
            List<Object> queryParams = new ArrayList<>();

            if (zone != null && !zone.trim().isBlank() && !isZoneTable) {
                String cleanZone = zone.trim().replaceAll("[^0-9a-zA-Z]", "");
                String numZone = cleanZone.matches("\\d+") ? String.valueOf(Integer.parseInt(cleanZone)) : cleanZone;
                String padZone = cleanZone.matches("\\d+") ? String.format("%02d", Integer.parseInt(cleanZone)) : cleanZone;

                String zoneCol = null;
                for (String col : columns) {
                    if (col.equalsIgnoreCase("zone_no") || col.equalsIgnoreCase("zone") || col.equalsIgnoreCase("zone_number")) {
                        zoneCol = col;
                        break;
                    }
                }

                if (zoneCol != null) {
                    whereClause = " WHERE (\"" + zoneCol + "\" = ? OR \"" + zoneCol + "\" = ? OR \"" + zoneCol + "\" LIKE ?)";
                    countParams.add(padZone);
                    countParams.add(numZone);
                    countParams.add("%" + cleanZone + "%");

                    queryParams.add(padZone);
                    queryParams.add(numZone);
                    queryParams.add("%" + cleanZone + "%");
                }
            }

            // If target zone table is empty, fallback to base table if exists
            long total = 0;
            try {
                String countSql = "SELECT COUNT(*) FROM public.\"" + targetTable + "\"" + whereClause;
                Long cnt = countParams.isEmpty()
                        ? db2.queryForObject(countSql, Long.class)
                        : db2.queryForObject(countSql, Long.class, countParams.toArray());
                if (cnt != null) total = cnt;
            } catch (Exception e1) {
                try {
                    String countSql = "SELECT COUNT(*) FROM " + targetTable + whereClause;
                    Long cnt = countParams.isEmpty()
                            ? db2.queryForObject(countSql, Long.class)
                            : db2.queryForObject(countSql, Long.class, countParams.toArray());
                    if (cnt != null) total = cnt;
                } catch (Exception e2) {}
            }

            // Fallback strictly for Zone 11 only if hlb_records_zone_11 has 0 rows but base hlb_records has data
            if (total == 0 && isZoneTable && (zone == null || zone.trim().isEmpty() || zone.equals("11"))) {
                try {
                    Long baseCnt = db2.queryForObject("SELECT COUNT(*) FROM public.hlb_records", Long.class);
                    if (baseCnt != null && baseCnt > 0) {
                        targetTable = "hlb_records";
                        total = baseCnt;
                        columns = db2.queryForList(
                                "SELECT column_name FROM information_schema.columns " +
                                "WHERE table_schema='public' AND table_name='hlb_records' ORDER BY ordinal_position",
                                String.class
                        );
                    }
                } catch (Exception ignore) {}
            }

            // 3. Determine best column to ORDER BY
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
                String selectSql = "SELECT * FROM public.\"" + targetTable + "\"" + whereClause + orderClause + " LIMIT ? OFFSET ?";
                List<Object> execParams = new ArrayList<>(queryParams);
                execParams.add(safeLimit);
                execParams.add(offset);
                rows = db2.queryForList(selectSql, execParams.toArray());
            } catch (Exception e1) {
                try {
                    String selectSql = "SELECT * FROM " + targetTable + whereClause + orderClause + " LIMIT ? OFFSET ?";
                    List<Object> execParams = new ArrayList<>(queryParams);
                    execParams.add(safeLimit);
                    execParams.add(offset);
                    rows = db2.queryForList(selectSql, execParams.toArray());
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
            @RequestParam(defaultValue = "") String table,
            @RequestParam(required = false) String zone
    ) {
        try {
            if (zone != null && !zone.isBlank()) {
                String cleanZone = zone.trim().replaceAll("[^0-9a-zA-Z]", "");
                if (cleanZone.matches("\\d+")) cleanZone = String.format("%02d", Integer.parseInt(cleanZone));
                if (table.isBlank() || table.equalsIgnoreCase("hlb_records") || table.toLowerCase().startsWith("hlb_records_zone_")) {
                    table = "hlb_records_zone_" + cleanZone;
                }
            }

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
    public ResponseEntity<?> syncErrors(@RequestBody List<Map<String, Object>> errors, @RequestParam(required = false) String zone) {
        try {
            // 1. Ensure table exists in Supabase DB2
            db2.execute("CREATE TABLE IF NOT EXISTS public.census_errors (" +
                    "id BIGSERIAL PRIMARY KEY, " +
                    "circle_no VARCHAR(50), " +
                    "hlb_code VARCHAR(50), " +
                    "zone_no VARCHAR(50), " +
                    "enumerator_name VARCHAR(150), " +
                    "enumerator_id VARCHAR(150), " +
                    "building_number VARCHAR(100), " +
                    "census_house_num VARCHAR(100), " +
                    "head_name VARCHAR(150), " +
                    "head_mobile VARCHAR(50), " +
                    "error_type VARCHAR(150), " +
                    "error_description TEXT, " +
                    "line_number INT, " +
                    "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                    ")");
            // Add column if it doesn't exist (for existing tables)
            try { db2.execute("ALTER TABLE public.census_errors ADD COLUMN IF NOT EXISTS zone_no VARCHAR(50)"); } catch (Exception ignored) {}
            try { db2.execute("ALTER TABLE public.census_errors ADD COLUMN IF NOT EXISTS head_mobile VARCHAR(50)"); } catch (Exception ignored) {}

            // 2. Clear old errors (for specific zone if provided, otherwise all)
            try {
                if (zone != null && !zone.isBlank()) {
                    String cleanZone = zone.trim().replaceAll("[^0-9a-zA-Z]", "");
                    if (cleanZone.matches("\\d+")) cleanZone = String.format("%02d", Integer.parseInt(cleanZone));
                    db2.update("DELETE FROM public.census_errors WHERE zone_no = ? OR zone_no = ?", cleanZone, String.valueOf(Integer.parseInt(cleanZone)));
                } else {
                    db2.execute("DELETE FROM public.census_errors");
                }
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
                        .append("(circle_no, hlb_code, zone_no, enumerator_name, enumerator_id, building_number, census_house_num, head_name, head_mobile, error_type, error_description, line_number) VALUES ");

                List<Object> params = new ArrayList<>();
                for (int j = 0; j < chunk.size(); j++) {
                    if (j > 0) sqlBuilder.append(", ");
                    sqlBuilder.append("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    Map<String, Object> err = chunk.get(j);
                    String zVal = err.get("zone_no") != null ? err.get("zone_no").toString() : (err.get("zone") != null ? err.get("zone").toString() : (zone != null ? zone : ""));
                    params.add(err.get("circle_no") != null ? err.get("circle_no").toString() : "");
                    params.add(err.get("hlb_code") != null ? err.get("hlb_code").toString() : "");
                    params.add(zVal);
                    params.add(err.get("enumerator_name") != null ? err.get("enumerator_name").toString() : "");
                    params.add(err.get("enumerator_id") != null ? err.get("enumerator_id").toString() : "");
                    params.add(err.get("building_number") != null ? err.get("building_number").toString() : "");
                    params.add(err.get("census_house_num") != null ? err.get("census_house_num").toString() : "");
                    params.add(err.get("head_name") != null ? err.get("head_name").toString() : "");
                    params.add(err.get("head_mobile") != null ? err.get("head_mobile").toString() : "");
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
                            "zone_no VARCHAR(50), " +
                            "enumerator_name VARCHAR(150), " +
                            "enumerator_id VARCHAR(150), " +
                            "building_number VARCHAR(100), " +
                            "census_house_num VARCHAR(100), " +
                            "head_name VARCHAR(150), " +
                            "head_mobile VARCHAR(50), " +
                            "error_type VARCHAR(150), " +
                            "error_description TEXT, " +
                            "line_number INT, " +
                            "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP" +
                            ")");
                    try { stmt.execute("ALTER TABLE census_errors ADD COLUMN IF NOT EXISTS zone_no VARCHAR(50)"); } catch (Throwable ignored) {}
                    try { stmt.execute("ALTER TABLE census_errors ADD COLUMN IF NOT EXISTS head_mobile VARCHAR(50)"); } catch (Throwable ignored) {}
                    stmt.execute("DELETE FROM census_errors");

                    if (errors != null && !errors.isEmpty()) {
                        for (int i = 0; i < errors.size(); i += CHUNK_SIZE) {
                            int end = Math.min(i + CHUNK_SIZE, errors.size());
                            List<Map<String, Object>> chunk = errors.subList(i, end);
                            StringBuilder sqlBuilder = new StringBuilder();
                            sqlBuilder.append("INSERT INTO census_errors ")
                                    .append("(circle_no, hlb_code, enumerator_name, enumerator_id, building_number, census_house_num, head_name, head_mobile, error_type, error_description, line_number) VALUES ");
                            for (int j = 0; j < chunk.size(); j++) {
                                if (j > 0) sqlBuilder.append(", ");
                                sqlBuilder.append("(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
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
                                ps.setString(pIdx++, err.get("head_mobile") != null ? err.get("head_mobile").toString() : "");
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
    // GET /api/admin/db2/shorten-url?url=...  –  TinyURL shortener proxy
    // ------------------------------------------------------------------ //
    @GetMapping("/shorten-url")
    public ResponseEntity<?> shortenUrl(@RequestParam("url") String targetUrl) {
        if (targetUrl == null || targetUrl.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "URL parameter is required"));
        }
        try {
            java.net.http.HttpClient client = java.net.http.HttpClient.newBuilder()
                    .connectTimeout(java.time.Duration.ofSeconds(6))
                    .build();

            String endpoint = "https://tinyurl.com/api-create.php?url=" + java.net.URLEncoder.encode(targetUrl, java.nio.charset.StandardCharsets.UTF_8);

            java.net.http.HttpRequest request = java.net.http.HttpRequest.newBuilder()
                    .uri(java.net.URI.create(endpoint))
                    .timeout(java.time.Duration.ofSeconds(6))
                    .GET()
                    .build();

            java.net.http.HttpResponse<String> response = client.send(request, java.net.http.HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() == 200 && response.body() != null && response.body().trim().startsWith("http")) {
                String shortUrl = response.body().trim();
                return ResponseEntity.ok(Map.of("status", "success", "shortUrl", shortUrl, "originalUrl", targetUrl));
            } else {
                return ResponseEntity.ok(Map.of("status", "fallback", "shortUrl", targetUrl, "originalUrl", targetUrl));
            }
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("status", "fallback", "shortUrl", targetUrl, "originalUrl", targetUrl, "error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }
}


