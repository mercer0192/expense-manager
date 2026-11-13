package org.wallace.service;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.CachePut;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.wallace.model.Currency;
import org.wallace.repository.CurrencyRepository;

import java.math.BigDecimal;

@Service
public class CurrencyRateCacheService {

    private static final String CACHE_NAME = "currencyRates";

    private final CurrencyRepository currencyRepository;

    public CurrencyRateCacheService(CurrencyRepository currencyRepository) {
        this.currencyRepository = currencyRepository;
    }

    @Cacheable(cacheNames = CACHE_NAME, key = "#p0")
    public BigDecimal getRateToBase(String currencyCode) {
        return currencyRepository.findByCurrencyCode(currencyCode)
                .map(Currency::getRateToBase)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Currency '" + currencyCode + "' is not configured."));
    }

    @CachePut(cacheNames = CACHE_NAME, key = "#p0")
    public BigDecimal cacheRate(String currencyCode, BigDecimal rateToBase) {
        return rateToBase;
    }

    @CacheEvict(cacheNames = CACHE_NAME, key = "#p0")
    public void evictRate(String currencyCode) {
        // Remove the stale rate after its currency is deleted or renamed.
    }
}
