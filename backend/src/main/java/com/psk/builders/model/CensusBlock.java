package com.psk.builders.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "census_blocks")
public class CensusBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String stateName;
    private String stateCode;
    private String districtName;
    private String districtCode;
    private String subDistrictName;
    private String subDistrictCode;
    private String townVillage;
    private String townVillageCode;
    private String wardNo;
    private String blockNo;

    private String dateOfMap;
    private String lastUpdatedDate;
    private Integer totalHouseholds;
    private String status; // "PENDING_UPLOAD", "PDF_UPLOADED", "COMPLETED"

    private String pdfUrl;
    private String pdfFileName;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String mapDataJson;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    public CensusBlock() {}

    public CensusBlock(String stateName, String districtName, String subDistrictName, String townVillage, String wardNo, String blockNo, Integer totalHouseholds) {
        this.stateName = stateName;
        this.districtName = districtName;
        this.subDistrictName = subDistrictName;
        this.townVillage = townVillage;
        this.wardNo = wardNo;
        this.blockNo = blockNo;
        this.totalHouseholds = totalHouseholds;
        this.status = "PENDING_UPLOAD";
        this.dateOfMap = "08-07-2026";
        this.lastUpdatedDate = "08-07-2026";
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getStateName() { return stateName; }
    public void setStateName(String stateName) { this.stateName = stateName; }

    public String getStateCode() { return stateCode; }
    public void setStateCode(String stateCode) { this.stateCode = stateCode; }

    public String getDistrictName() { return districtName; }
    public void setDistrictName(String districtName) { this.districtName = districtName; }

    public String getDistrictCode() { return districtCode; }
    public void setDistrictCode(String districtCode) { this.districtCode = districtCode; }

    public String getSubDistrictName() { return subDistrictName; }
    public void setSubDistrictName(String subDistrictName) { this.subDistrictName = subDistrictName; }

    public String getSubDistrictCode() { return subDistrictCode; }
    public void setSubDistrictCode(String subDistrictCode) { this.subDistrictCode = subDistrictCode; }

    public String getTownVillage() { return townVillage; }
    public void setTownVillage(String townVillage) { this.townVillage = townVillage; }

    public String getTownVillageCode() { return townVillageCode; }
    public void setTownVillageCode(String townVillageCode) { this.townVillageCode = townVillageCode; }

    public String getWardNo() { return wardNo; }
    public void setWardNo(String wardNo) { this.wardNo = wardNo; }

    public String getBlockNo() { return blockNo; }
    public void setBlockNo(String blockNo) { this.blockNo = blockNo; }

    public String getDateOfMap() { return dateOfMap; }
    public void setDateOfMap(String dateOfMap) { this.dateOfMap = dateOfMap; }

    public String getLastUpdatedDate() { return lastUpdatedDate; }
    public void setLastUpdatedDate(String lastUpdatedDate) { this.lastUpdatedDate = lastUpdatedDate; }

    public Integer getTotalHouseholds() { return totalHouseholds; }
    public void setTotalHouseholds(Integer totalHouseholds) { this.totalHouseholds = totalHouseholds; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPdfUrl() { return pdfUrl; }
    public void setPdfUrl(String pdfUrl) { this.pdfUrl = pdfUrl; }

    public String getPdfFileName() { return pdfFileName; }
    public void setPdfFileName(String pdfFileName) { this.pdfFileName = pdfFileName; }

    public String getMapDataJson() { return mapDataJson; }
    public void setMapDataJson(String mapDataJson) { this.mapDataJson = mapDataJson; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
