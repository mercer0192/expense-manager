package org.wallace.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ExpenseDisplayDto(
        Long id,
        String description,
        BigDecimal amount,
        String currencyCode,
        BigDecimal convertedAmount,
        String displayCurrencyCode,
        String category,
        LocalDateTime date) {
}
