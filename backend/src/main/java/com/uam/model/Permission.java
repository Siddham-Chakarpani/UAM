package com.uam.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "permissions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 80)
    private String name;        // e.g. USER_CREATE

    @Column(length = 60)
    private String resource;    // e.g. users

    @Column(length = 30)
    private String action;      // read | create | update | delete | manage | export

    @Column(length = 255)
    private String description;
}
