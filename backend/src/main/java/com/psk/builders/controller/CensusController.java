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
            // Seed 5 initial default cards
            List<CensusBlock> seedBlocks = Arrays.asList(
                new CensusBlock("TAMIL NADU", "CHENNAI", "MADURAVOYAL", "GREATER CHENNAI", "0144", "0079", 220),
                new CensusBlock("TAMIL NADU", "CHENNAI", "MADURAVOYAL", "GREATER CHENNAI", "0152", "0364", 185),
                new CensusBlock("TAMIL NADU", "CHENNAI", "KOYAMBEDU", "GREATER CHENNAI", "0128", "0112", 190),
                new CensusBlock("TAMIL NADU", "CHENNAI", "PORUR", "GREATER CHENNAI", "0156", "0045", 210),
                new CensusBlock("TAMIL NADU", "CHENNAI", "VIRUGAMBAKKAM", "GREATER CHENNAI", "0135", "0088", 175)
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
}
