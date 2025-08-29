package com.example.todobackend.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Table(
    name = "tag",
    uniqueConstraints = @UniqueConstraint(columnNames = "name")
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, unique = true)
    private String name;

    // For bi-directional mapping if needed in the future:
    @ManyToMany(mappedBy = "tags")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<Todo> todos;
}
