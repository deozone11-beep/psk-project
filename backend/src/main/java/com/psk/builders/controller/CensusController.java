package com.psk.builders.controller;

import com.psk.builders.model.CensusBlock;
import com.psk.builders.repository.CensusBlockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/census")
public class CensusController {

    @Autowired
    private CensusBlockRepository censusBlockRepository;

    // Seed default cards if table is empty
    @GetMapping("/blocks")
    public List<CensusBlock> getAllBlocks() {
        List<CensusBlock> blocks = censusBlockRepository.findAllByOrderByCreatedAtDesc();
        if (blocks.isEmpty()) {
            List<CensusBlock> seedBlocks = Arrays.asList(
                new CensusBlock("TAMIL NADU", "CHENNAI", "MADURAVOYAL", "GREATER CHENNAI", "0144", "0079", 220),
                new CensusBlock("TAMIL NADU", "CHENNAI", "MADURAVOYAL", "GREATER CHENNAI", "0145", "0080", 215),
                new CensusBlock("TAMIL NADU", "CHENNAI", "MADURAVOYAL", "GREATER CHENNAI", "0148", "0083", 195),
                new CensusBlock("TAMIL NADU", "CHENNAI", "MADURAVOYAL", "GREATER CHENNAI", "0152", "0364", 185),
                new CensusBlock("TAMIL NADU", "CHENNAI", "KOYAMBEDU", "GREATER CHENNAI", "0128", "0112", 190),
                new CensusBlock("TAMIL NADU", "CHENNAI", "PORUR", "GREATER CHENNAI", "0156", "0045", 210),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0135", "0088", 175),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0130", "0130", 245),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0131", "0131", 175),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0132", "0132", 200),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0133", "0133", 195),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0134", "0134", 220),
                new CensusBlock("TAMIL NADU", "CHENNAI", "ALAPAKKAM", "GREATER CHENNAI", "0215", "0215", 160),
                new CensusBlock("TAMIL NADU", "CHENNAI", "ALAPAKKAM", "GREATER CHENNAI", "0216", "0216", 180),
                new CensusBlock("TAMIL NADU", "CHENNAI", "KARAMBAKKAM", "GREATER CHENNAI", "0218", "0218", 170),
                new CensusBlock("TAMIL NADU", "CHENNAI", "KARAMBAKKAM", "GREATER CHENNAI", "0219", "0219", 205),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0220", "0220", 190),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0221", "0221", 215),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0222", "0222", 180)
            );
            censusBlockRepository.saveAll(seedBlocks);
            return censusBlockRepository.findAllByOrderByCreatedAtDesc();
        }
        return blocks;
    }

    @PostMapping("/blocks")
    public ResponseEntity<CensusBlock> createBlock(@RequestBody CensusBlock block) {
        if (block.getStatus() == null) block.setStatus("PENDING_UPLOAD");
        if (block.getDateOfMap() == null) block.setDateOfMap("08-07-2026");
        if (block.getLastUpdatedDate() == null) block.setLastUpdatedDate("08-07-2026");
        CensusBlock saved = censusBlockRepository.save(block);
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/blocks/{id}")
    public ResponseEntity<CensusBlock> updateBlock(@PathVariable Long id, @RequestBody CensusBlock details) {
        Optional<CensusBlock> opt = censusBlockRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        CensusBlock block = opt.get();
        if (details.getStateName() != null) block.setStateName(details.getStateName());
        if (details.getDistrictName() != null) block.setDistrictName(details.getDistrictName());
        if (details.getSubDistrictName() != null) block.setSubDistrictName(details.getSubDistrictName());
        if (details.getTownVillage() != null) block.setTownVillage(details.getTownVillage());
        if (details.getWardNo() != null) block.setWardNo(details.getWardNo());
        if (details.getBlockNo() != null) block.setBlockNo(details.getBlockNo());
        if (details.getTotalHouseholds() != null) block.setTotalHouseholds(details.getTotalHouseholds());
        if (details.getStatus() != null) block.setStatus(details.getStatus());
        if (details.getPdfUrl() != null) block.setPdfUrl(details.getPdfUrl());
        if (details.getPdfFileName() != null) block.setPdfFileName(details.getPdfFileName());
        if (details.getMapDataJson() != null) block.setMapDataJson(details.getMapDataJson());
        block.setLastUpdatedDate(java.time.LocalDate.now().toString());

        CensusBlock updated = censusBlockRepository.save(block);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/blocks/{id}")
    public ResponseEntity<Map<String, String>> deleteBlock(@PathVariable Long id) {
        if (!censusBlockRepository.existsById(id)) return ResponseEntity.notFound().build();
        censusBlockRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("message", "Census Block deleted successfully"));
    }

    @PostMapping("/blocks/{id}/upload")
    public ResponseEntity<CensusBlock> uploadMapPdf(@PathVariable Long id, @RequestParam("file") MultipartFile file) throws IOException {
        Optional<CensusBlock> opt = censusBlockRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        CensusBlock block = opt.get();
        String uploadDir = "uploads/census/";
        Files.createDirectories(Paths.get(uploadDir));

        String fileName = System.currentTimeMillis() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir + fileName);
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);

        block.setPdfFileName(file.getOriginalFilename());
        block.setPdfUrl("/uploads/census/" + fileName);
        block.setStatus("PDF_UPLOADED");
        block.setLastUpdatedDate(java.time.LocalDate.now().toString());

        CensusBlock saved = censusBlockRepository.save(block);
        return ResponseEntity.ok(saved);
    }

    // Bulk import from GDB extraction (ward_census_import.json)
    @PostMapping("/blocks/bulk-import")
    public ResponseEntity<Map<String, Object>> bulkImport(
            @RequestBody List<Map<String, Object>> wardData,
            @RequestParam(value = "clearExisting", defaultValue = "false") boolean clearExisting) {

        if (clearExisting) {
            censusBlockRepository.deleteAll();
        }

        List<CensusBlock> toSave = wardData.stream().map(w -> {
            CensusBlock b = new CensusBlock();
            b.setStateName(str(w, "stateName"));
            b.setStateCode(str(w, "stateCode"));
            b.setDistrictName(str(w, "districtName"));
            b.setDistrictCode(str(w, "districtCode"));
            b.setSubDistrictName(str(w, "subDistrictName"));
            b.setTownVillage(str(w, "townVillage"));
            b.setWardNo(str(w, "wardNo"));
            b.setBlockNo(str(w, "blockNo"));
            b.setStatus(str(w, "status") != null ? str(w, "status") : "PENDING_UPLOAD");
            b.setDateOfMap(str(w, "dateOfMap") != null ? str(w, "dateOfMap") : "08-07-2026");
            b.setLastUpdatedDate(str(w, "lastUpdatedDate") != null ? str(w, "lastUpdatedDate") : java.time.LocalDate.now().toString());
            b.setCorporationName(str(w, "corporationName"));

            if (w.get("totalHouseholds") instanceof Number)
                b.setTotalHouseholds(((Number) w.get("totalHouseholds")).intValue());
            if (w.get("buildingCount") instanceof Number)
                b.setBuildingCount(((Number) w.get("buildingCount")).intValue());
            if (w.get("commercialCount") instanceof Number)
                b.setCommercialCount(((Number) w.get("commercialCount")).intValue());
            if (w.get("totalAreaSqft") instanceof Number)
                b.setTotalAreaSqft(((Number) w.get("totalAreaSqft")).doubleValue());
            if (w.get("matchedCount") instanceof Number)
                b.setMatchedCount(((Number) w.get("matchedCount")).intValue());

            // Store areaNames list as JSON string
            Object names = w.get("areaNames");
            if (names instanceof List) {
                b.setAreaNames(names.toString());
            }
            if (w.get("lat") instanceof Number)
                b.setLat(((Number) w.get("lat")).doubleValue());
            if (w.get("lng") instanceof Number)
                b.setLng(((Number) w.get("lng")).doubleValue());
            return b;
        }).collect(Collectors.toList());

        List<CensusBlock> saved = censusBlockRepository.saveAll(toSave);

        Map<String, Object> result = new HashMap<>();
        result.put("imported", saved.size());
        result.put("message", "Successfully imported " + saved.size() + " ward census blocks from GCC GDB data");
        return ResponseEntity.ok(result);
    }

    private String str(Map<String, Object> map, String key) {
        Object v = map.get(key);
        return v != null ? v.toString() : null;
    }

    // ------------------------------------------------------------------ //
    // Secondary Supabase DB2 proxy endpoints under /api/admin/census/db2/
    // ------------------------------------------------------------------ //
    @Autowired(required = false)
    @org.springframework.beans.factory.annotation.Qualifier("db2JdbcTemplate")
    private org.springframework.jdbc.core.JdbcTemplate db2;

    private synchronized org.springframework.jdbc.core.JdbcTemplate getDb2() {
        if (db2 != null) return db2;
        try {
            org.springframework.jdbc.datasource.DriverManagerDataSource ds = new org.springframework.jdbc.datasource.DriverManagerDataSource();
            ds.setDriverClassName("org.postgresql.Driver");
            ds.setUrl("jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres?prepareThreshold=0&preferQueryMode=simple&sslmode=require");
            ds.setUsername("postgres.bvdkmygolyygkouwikto");
            ds.setPassword("Preethakumar@9898");
            db2 = new org.springframework.jdbc.core.JdbcTemplate(ds);
        } catch (Exception e) {
            e.printStackTrace();
        }
        return db2;
    }

    @GetMapping("/db2/ping")
    public ResponseEntity<?> pingDb2() {
        try {
            org.springframework.jdbc.core.JdbcTemplate jt = getDb2();
            if (jt == null) return ResponseEntity.ok(Map.of("status", "error", "error", "Could not initialize DB2 connection"));
            Integer r = jt.queryForObject("SELECT 1", Integer.class);
            return ResponseEntity.ok(Map.of("status", "ok", "result", r));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("status", "error", "error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }

    @GetMapping("/db2/tables")
    public ResponseEntity<?> listDb2Tables() {
        try {
            org.springframework.jdbc.core.JdbcTemplate jt = getDb2();
            List<String> tables = jt.queryForList(
                    "SELECT table_name FROM information_schema.tables " +
                    "WHERE table_schema = 'public' AND table_type = 'BASE TABLE' " +
                    "ORDER BY table_name",
                    String.class
            );
            return ResponseEntity.ok(Map.of("tables", tables));
        } catch (Exception e) {
            return ResponseEntity.ok(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/db2/table/{tableName}")
    public ResponseEntity<?> getDb2TableData(
            @PathVariable String tableName,
            @RequestParam(defaultValue = "500") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        if (!tableName.matches("[a-zA-Z0-9_]+")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid table name"));
        }
        int safeLimit = Math.min(Math.max(limit, 1), 3000);
        try {
            org.springframework.jdbc.core.JdbcTemplate jt = getDb2();
            if (jt == null) {
                return ResponseEntity.ok(Map.of("error", "Could not initialize DB2 datasource"));
            }

            List<String> columns = new ArrayList<>();
            try {
                columns = jt.queryForList(
                        "SELECT column_name FROM information_schema.columns " +
                        "WHERE table_schema='public' AND table_name=? ORDER BY ordinal_position",
                        String.class, tableName
                );
            } catch (Exception ignore) {}

            long total = 0;
            try {
                Long cnt = jt.queryForObject("SELECT COUNT(*) FROM public.\"" + tableName + "\"", Long.class);
                if (cnt != null) total = cnt;
            } catch (Exception e1) {
                try {
                    Long cnt = jt.queryForObject("SELECT COUNT(*) FROM " + tableName, Long.class);
                    if (cnt != null) total = cnt;
                } catch (Exception e2) {}
            }

            String orderClause = columns.contains("id") ? " ORDER BY id ASC" : "";

            List<Map<String, Object>> rows = new ArrayList<>();
            try {
                rows = jt.queryForList("SELECT * FROM public.\"" + tableName + "\"" + orderClause + " LIMIT ? OFFSET ?", safeLimit, offset);
            } catch (Exception e1) {
                try {
                    rows = jt.queryForList("SELECT * FROM public.\"" + tableName + "\" LIMIT ? OFFSET ?", safeLimit, offset);
                } catch (Exception e2) {
                    try {
                        rows = jt.queryForList("SELECT * FROM " + tableName + " LIMIT ? OFFSET ?", safeLimit, offset);
                    } catch (Exception e3) {}
                }
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
            return ResponseEntity.ok(Map.of("error", e.getMessage() != null ? e.getMessage() : e.toString()));
        }
    }
}
