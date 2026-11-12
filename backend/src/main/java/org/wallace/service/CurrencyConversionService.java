package org.wallace.service;

import org.springframework.stereotype.Service;
import org.wallace.model.Currency;
import org.wallace.repository.CurrencyRepository;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
public class CurrencyConversionService {

    private final CurrencyRepository currencyRepository;

    public CurrencyConversionService(CurrencyRepository currencyRepository) {
        this.currencyRepository = currencyRepository;
    }

    public BigDecimal convert(BigDecimal amount, String sourceCode, String targetCode) {
        BigDecimal sourceRate = findRate(sourceCode);
        BigDecimal targetRate = findRate(targetCode);

        // Rates express MYR for one unit of that currency.
        return amount.multiply(sourceRate)
                .divide(targetRate, 2, RoundingMode.HALF_UP);
    }

    public void ensureCurrencyExists(String currencyCode) {
        findRate(currencyCode);
    }

    private BigDecimal findRate(String currencyCode) {
        return currencyRepository.findByCurrencyCode(currencyCode)
                .map(Currency::getRateToBase)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Currency '" + currencyCode + "' is not configured."));
    }
}
