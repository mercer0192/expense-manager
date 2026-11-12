package org.wallace.model;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Pattern;

@Entity
@Table(name = "expenses")
@Setter
@Getter
public class Expense {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @NotBlank
    private String description;
    @NotNull
    @Positive
    private BigDecimal amount;
    @NotBlank
    @Pattern(regexp = "[A-Z]{3}", message = "must be a 3-letter uppercase currency code")
    @Column(name = "currency_code", nullable = false, length = 3)
    private String currencyCode = "MYR";
    private String category;
    @NotNull
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime date;

    public Expense() {
    }

    public Expense(Long id, String description, BigDecimal amount, String category, LocalDateTime date) {
        this.id = id;
        this.description = description;
        this.amount = amount;
        this.currencyCode = "MYR";
        this.category = category;
        this.date = date;
    }

}
