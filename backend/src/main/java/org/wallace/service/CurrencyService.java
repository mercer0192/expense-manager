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
    private final String baseCurrencyCode;

    public CurrencyService(CurrencyRepository currencyRepository,
                           ExpenseRepository expenseRepository,
                           @Value("${expense.currency.base-code:MYR}") String baseCurrencyCode) {
        this.currencyRepository = currencyRepository;
        this.expenseRepository = expenseRepository;
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
        return currencyRepository.save(currency);
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
                    existingCurrency.setCurrencyCode(updatedCurrency.getCurrencyCode());
                    existingCurrency.setRateToBase(updatedCurrency.getRateToBase());
                    existingCurrency.setUpdateAt(LocalDateTime.now());

                    return currencyRepository.save(existingCurrency);
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
        return true;
    }


}
