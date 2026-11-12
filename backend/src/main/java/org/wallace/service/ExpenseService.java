package org.wallace.service;

import org.springframework.stereotype.Service;
import org.wallace.model.Expense;
import org.wallace.repository.ExpenseRepository;
import org.wallace.dto.ExpenseDisplayDto;
import org.springframework.beans.factory.annotation.Value;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;
    private final CurrencyConversionService currencyConversionService;
    private final String baseCurrencyCode;

    public ExpenseService(ExpenseRepository expenseRepository,
                          CurrencyConversionService currencyConversionService,
                          @Value("${expense.currency.base-code:MYR}") String baseCurrencyCode) {
        this.expenseRepository = expenseRepository;
        this.currencyConversionService = currencyConversionService;
        this.baseCurrencyCode = baseCurrencyCode;
    }

    public List<ExpenseDisplayDto> getAllExpenses(String displayCurrencyCode) {
        String targetCurrency = displayCurrencyCode == null || displayCurrencyCode.isBlank()
                ? baseCurrencyCode : displayCurrencyCode.toUpperCase();
        currencyConversionService.ensureCurrencyExists(targetCurrency);

        return expenseRepository.findAll().stream()
                .map(expense -> new ExpenseDisplayDto(
                        expense.getId(),
                        expense.getDescription(),
                        expense.getAmount(),
                        expense.getCurrencyCode(),
                        currencyConversionService.convert(
                                expense.getAmount(), expense.getCurrencyCode(), targetCurrency),
                        targetCurrency,
                        expense.getCategory(),
                        expense.getDate()))
                .toList();
    }

    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findById(id);
    }

    public Expense createExpense(Expense expense) {
        expense.setId(null);
        if (expense.getCurrencyCode() == null || expense.getCurrencyCode().isBlank()) {
            expense.setCurrencyCode(baseCurrencyCode);
        }
        currencyConversionService.ensureCurrencyExists(expense.getCurrencyCode());
        return expenseRepository.save(expense);
    }

    public Optional<Expense> updateExpense(Long id, Expense updatedExpense) {
        return expenseRepository.findById(id)
                .map(existingExpense -> {
                    String expenseCurrencyCode = updatedExpense.getCurrencyCode();
                    if (expenseCurrencyCode == null || expenseCurrencyCode.isBlank()) {
                        expenseCurrencyCode = baseCurrencyCode;
                    }
                    currencyConversionService.ensureCurrencyExists(expenseCurrencyCode);
                    existingExpense.setDescription(updatedExpense.getDescription());
                    existingExpense.setAmount(updatedExpense.getAmount());
                    existingExpense.setCurrencyCode(expenseCurrencyCode);
                    existingExpense.setCategory(updatedExpense.getCategory());
                    existingExpense.setDate(updatedExpense.getDate());

                    return expenseRepository.save(existingExpense);
                });
    }

    public boolean deleteExpense(Long id) {
        if (!expenseRepository.existsById(id)) {
            return false;
        }

        expenseRepository.deleteById(id);
        return true;
    }
}
