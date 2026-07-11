package com.psk.builders.model;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter @Setter
@NoArgsConstructor
public class Project {
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    String title;
    String location;
    String status;

    // Photos are stored as a single JSON array inside one LONGTEXT column — this is the
    // exact same proven pattern as ProjectUpdate.photoUrl (@Lob LONGTEXT), instead of a
    // separate @ElementCollection table, which can hit MySQL "BLOB/TEXT column used in
    // key" errors on some setups. get/setImageUrls() below convert to/from a real List.
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    @Getter(AccessLevel.NONE) @Setter(AccessLevel.NONE)
    String imageUrlsJson;

    public Project(Long id, String title, String location, String status, List<String> imageUrls) {
        this.id = id;
        this.title = title;
        this.location = location;
        this.status = status;
        setImageUrls(imageUrls);
    }

    public List<String> getImageUrls() {
        if (imageUrlsJson == null || imageUrlsJson.isBlank()) return new ArrayList<>();
        try {
            return MAPPER.readValue(imageUrlsJson, MAPPER.getTypeFactory().constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    public void setImageUrls(List<String> imageUrls) {
        try {
            this.imageUrlsJson = MAPPER.writeValueAsString(imageUrls != null ? imageUrls : new ArrayList<>());
        } catch (Exception e) {
            this.imageUrlsJson = "[]";
        }
    }
}