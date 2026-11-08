package org.wallace.service;

import org.springframework.stereotype.Service;
import org.wallace.model.Expense;
import org.wallace.repository.ExpenseRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {
    private final ExpenseRepository expenseRepository;

    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    public List<Expense> getAllExpenses() {
        return expenseRepository.findAll();
    }

    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findById(id);
    }

    public Expense createExpense(Expense expense) {
        expense.setId(null);
        return expenseRepository.save(expense);
    }

    public Optional<Expense> updateExpense(Long id, Expense updatedExpense) {
        return expenseRepository.findById(id)
                .map(existingExpense -> {
                    existingExpense.setDescription(updatedExpense.getDescription());
                    existingExpense.setAmount(updatedExpense.getAmount());
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
