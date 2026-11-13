package org.wallace.service;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.wallace.model.Currency;
import org.wallace.repository.CurrencyRepository;
import org.wallace.repository.ExpenseRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CurrencyService {

    private final CurrencyRepository currencyRepository;
    private final ExpenseRepository expenseRepository;
    private final CurrencyRateCacheService currencyRateCacheService;
    private final String baseCurrencyCode;

    public CurrencyService(CurrencyRepository currencyRepository,
                           ExpenseRepository expenseRepository,
                           CurrencyRateCacheService currencyRateCacheService,
                           @Value("${expense.currency.base-code:MYR}") String baseCurrencyCode) {
        this.currencyRepository = currencyRepository;
        this.expenseRepository = expenseRepository;
        this.currencyRateCacheService = currencyRateCacheService;
        this.baseCurrencyCode = baseCurrencyCode;
    }

    public List<Currency> getAllCurrencies() {
        return currencyRepository.findAll();
    }

    public Optional<Currency> getCurrencyById(Long id) {
        return currencyRepository.findById(id);
    }

    public Currency createCurrency(Currency currency) {
        if (baseCurrencyCode.equals(currency.getCurrencyCode())) {
            throw new IllegalArgumentException("The base currency already exists and cannot be recreated.");
        }
        currency.setId(null);
        currency.setUpdateAt(LocalDateTime.now());
        Currency savedCurrency = currencyRepository.save(currency);
        currencyRateCacheService.cacheRate(
                savedCurrency.getCurrencyCode(), savedCurrency.getRateToBase());
        return savedCurrency;
    }

    public Optional<Currency> updateCurrency(Long id, Currency updatedCurrency) {
        return currencyRepository.findById(id)
                .map(existingCurrency -> {
                    if (existingCurrency.getCurrencyCode().equals(baseCurrencyCode)) {
                        throw new IllegalArgumentException("The base currency cannot be edited.");
                    }
                    if (baseCurrencyCode.equals(updatedCurrency.getCurrencyCode())) {
                        throw new IllegalArgumentException("The base currency already exists.");
                    }
                    if (!existingCurrency.getCurrencyCode().equals(updatedCurrency.getCurrencyCode())
                            && expenseRepository.existsByCurrencyCode(existingCurrency.getCurrencyCode())) {
                        throw new IllegalArgumentException(
                                "This currency code is used by expenses, so it cannot be changed.");
                    }
                    String previousCurrencyCode = existingCurrency.getCurrencyCode();
                    existingCurrency.setCurrencyCode(updatedCurrency.getCurrencyCode());
                    existingCurrency.setRateToBase(updatedCurrency.getRateToBase());
                    existingCurrency.setUpdateAt(LocalDateTime.now());

                    Currency savedCurrency = currencyRepository.save(existingCurrency);
                    if (!previousCurrencyCode.equals(savedCurrency.getCurrencyCode())) {
                        currencyRateCacheService.evictRate(previousCurrencyCode);
                    }
                    currencyRateCacheService.cacheRate(
                            savedCurrency.getCurrencyCode(), savedCurrency.getRateToBase());
                    return savedCurrency;
                });
    }

    public boolean deleteCurrency(Long id) {
        Optional<Currency> currency = currencyRepository.findById(id);
        if (currency.isEmpty()) {
            return false;
        }

        if (currency.get().getCurrencyCode().equals(baseCurrencyCode)) {
            throw new IllegalArgumentException("The base currency cannot be deleted.");
        }
        if (expenseRepository.existsByCurrencyCode(currency.get().getCurrencyCode())) {
            throw new IllegalArgumentException("This currency is used by expenses, so it cannot be deleted.");
        }

        currencyRepository.deleteById(id);
        currencyRateCacheService.evictRate(currency.get().getCurrencyCode());
        return true;
    }


}
