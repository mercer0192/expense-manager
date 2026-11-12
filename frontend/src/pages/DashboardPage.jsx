import { useEffect, useRef, useState } from 'react'

const getCurrentDateTime = () => {
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localTime.toISOString().slice(0, 16)
}

const createEmptyForm = () => ({
  description: '',
  amount: '',
  currencyCode: 'MYR',
  category: 'Other',
  date: getCurrentDateTime(),
})

const formatAmount = (amount) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

const loadExpenses = async (currencyCode) => {
  const response = await fetch(`/api/expenses?currency=${encodeURIComponent(currencyCode)}`)
  if (!response.ok) throw new Error(`Request failed: ${response.status}`)
  return response.json()
}

const parseExpenseDate = (date) => new Date(String(date).replace(' ', 'T'))

const formatDate = (date) =>
  parseExpenseDate(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

const toDateTimeLocal = (date) => String(date).replace(' ', 'T').slice(0, 16)

const getMonthKey = (date) => String(date).slice(0, 7)

const formatMonth = (monthKey) =>
  new Date(`${monthKey}-01T00:00:00`).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })

function DashboardPage() {
  const [expenses, setExpenses] = useState([])
  const [currencies, setCurrencies] = useState([])
  const [displayCurrencyCode, setDisplayCurrencyCode] = useState('MYR')
  const [form, setForm] = useState(createEmptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [editingExpenseId, setEditingExpenseId] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [expenseSort, setExpenseSort] = useState({ key: 'date', direction: 'desc' })
  const [monthFilterOpen, setMonthFilterOpen] = useState(false)
  const [currencyFilterOpen, setCurrencyFilterOpen] = useState(false)
  const [expenseCurrencyOpen, setExpenseCurrencyOpen] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const monthFilterRef = useRef(null)
  const currencyFilterRef = useRef(null)
  const expenseCurrencyRef = useRef(null)

  useEffect(() => {
    fetch('/api/currencies')
      .then((response) => {
        if (!response.ok) throw new Error(`Request failed: ${response.status}`)
        return response.json()
      })
      .then(setCurrencies)
      .catch((error) => console.error('Could not load currencies:', error))
  }, [])

  useEffect(() => {
    loadExpenses(displayCurrencyCode)
      .then(setExpenses)
      .catch((error) => console.error('Could not load expenses:', error))
  }, [displayCurrencyCode])

  useEffect(() => {
    if (!monthFilterOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!monthFilterRef.current?.contains(event.target)) {
        setMonthFilterOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setMonthFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [monthFilterOpen])

  useEffect(() => {
    if (!currencyFilterOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!currencyFilterRef.current?.contains(event.target)) {
        setCurrencyFilterOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setCurrencyFilterOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [currencyFilterOpen])

  useEffect(() => {
    if (!expenseCurrencyOpen) return undefined

    const closeOnOutsideClick = (event) => {
      if (!expenseCurrencyRef.current?.contains(event.target)) {
        setExpenseCurrencyOpen(false)
      }
    }
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') {
        setExpenseCurrencyOpen(false)
      }
    }

    document.addEventListener('mousedown', closeOnOutsideClick)
    document.addEventListener('keydown', closeOnEscape)

    return () => {
      document.removeEventListener('mousedown', closeOnOutsideClick)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [expenseCurrencyOpen])

  const availableMonths = [
    ...new Set(expenses.map((expense) => getMonthKey(expense.date))),
  ].sort().reverse()
  const filteredExpenses = expenses
    .filter(
      (expense) =>
        selectedMonth === 'all' || getMonthKey(expense.date) === selectedMonth,
    )
  const displayedExpenses = [...filteredExpenses].sort((first, second) => {
    let comparison = 0
    if (expenseSort.key === 'date') {
      comparison = parseExpenseDate(first.date) - parseExpenseDate(second.date)
    } else if (expenseSort.key === 'description' || expenseSort.key === 'category') {
      comparison = String(first[expenseSort.key] ?? '').localeCompare(
        String(second[expenseSort.key] ?? ''),
      )
    } else if (expenseSort.key === 'amount') {
      comparison = Number(first.convertedAmount ?? first.amount)
        - Number(second.convertedAmount ?? second.amount)
    }
    return expenseSort.direction === 'asc' ? comparison : -comparison
  })
  const expensesForSelectedMonth = displayedExpenses

  const selectedPeriodLabel =
    selectedMonth === 'all' ? 'ALL TIME' : formatMonth(selectedMonth).toUpperCase()

  const totalAmount = expensesForSelectedMonth.reduce(
    (sum, expense) => sum + Number(expense.convertedAmount ?? expense.amount),
    0,
  )

  const largestAmount = expensesForSelectedMonth.reduce(
    (largest, expense) => Math.max(largest, Number(expense.convertedAmount ?? expense.amount)),
    0,
  )

  const changeExpenseSort = (key) => {
    setExpenseSort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const expenseSortOrder = (key) =>
    expenseSort.key !== key ? 'none' : expenseSort.direction === 'asc' ? 'ascending' : 'descending'

  const expenseSortLabel = (key) => {
    if (expenseSort.key !== key) return '↕'
    return expenseSort.direction === 'asc' ? '↑' : '↓'
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    const expenseToSave = {
      description: form.description.trim(),
      amount: Number(form.amount),
      currencyCode: form.currencyCode,
      category: form.category,
      date: `${form.date.replace('T', ' ')}:00`,
    }

    try {
      const isEditing = editingExpenseId !== null
      const response = await fetch(
        isEditing ? `/api/expenses/update/${editingExpenseId}` : '/api/expenses',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(expenseToSave),
        },
      )

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      await loadExpenses(displayCurrencyCode).then(setExpenses)

      closeForm()
    } catch (error) {
      console.error('Could not save expense:', error)
      setErrorMessage('Could not save the expense. Please try again.')
    }
  }

  const openNewExpenseForm = () => {
    setEditingExpenseId(null)
    setForm(createEmptyForm())
    setErrorMessage('')
    setFormOpen(true)
  }

  const openEditForm = (expense) => {
    setEditingExpenseId(expense.id)
    setForm({
      description: expense.description,
      amount: String(expense.amount),
      currencyCode: expense.currencyCode ?? 'MYR',
      category: expense.category,
      date: toDateTimeLocal(expense.date),
    })
    setErrorMessage('')
    setFormOpen(true)
  }

  const handleDelete = async (expense) => {
    const confirmed = window.confirm(`Delete "${expense.description}"?`)
    if (!confirmed) return

    setErrorMessage('')

    try {
      const response = await fetch(`/api/expenses/delete/${expense.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      await loadExpenses(displayCurrencyCode).then(setExpenses)

      if (editingExpenseId === expense.id) {
        closeForm()
      }
    } catch (error) {
      console.error('Could not delete expense:', error)
      setErrorMessage('Could not delete the expense. Please try again.')
    }
  }

  const closeForm = () => {
    setFormOpen(false)
    setExpenseCurrencyOpen(false)
    setEditingExpenseId(null)
    setForm(createEmptyForm())
    setErrorMessage('')
  }

  return (
      <main className="dashboard">
        <section className="page-heading" aria-labelledby="page-title">
          <div>
            <p className="eyebrow">YOUR FINANCES</p>
            <h1 id="page-title">Expense overview</h1>
            <p className="page-subtitle">
              Keep track of your spending, one expense at a time.
            </p>
          </div>
          <button
            className="button button-primary"
            type="button"
            onClick={() => {
              if (formOpen && editingExpenseId === null) {
                closeForm()
              } else {
                openNewExpenseForm()
              }
            }}
            aria-expanded={formOpen}
            aria-controls="expense-form-panel"
          >
            <span className="button-plus" aria-hidden="true">+</span>
            Add expense
          </button>
        </section>

        {formOpen && (
          <section
            className="form-card"
            id="expense-form-panel"
            aria-labelledby="form-title"
          >
            <div className="card-heading">
              <div>
                <p className="eyebrow">
                  {editingExpenseId === null ? 'NEW TRANSACTION' : 'EDIT TRANSACTION'}
                </p>
                <h2 id="form-title">
                  {editingExpenseId === null ? 'Add an expense' : 'Edit expense'}
                </h2>
              </div>
              <button
                className="close-button"
                type="button"
                onClick={closeForm}
                aria-label="Close form"
              >
                ×
              </button>
            </div>

            <form className="expense-form" onSubmit={handleSubmit}>
              <label className="field field-description">
                <span>Description</span>
                <input
                  autoFocus
                  name="description"
                  type="text"
                  placeholder="e.g. Lunch with friends"
                  value={form.description}
                  onChange={handleChange}
                  maxLength="255"
                  required
                />
              </label>

              <label className="field">
                <span>Amount</span>
                <input
                  name="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  placeholder="0.00"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="field">
                <span>Currency</span>
                <div className="month-filter-dropdown expense-currency-dropdown" ref={expenseCurrencyRef}>
                  <button
                    className="month-filter expense-currency-filter"
                    type="button"
                    aria-label="Expense currency"
                    aria-expanded={expenseCurrencyOpen}
                    aria-controls="expense-currency-menu"
                    onClick={() => setExpenseCurrencyOpen((isOpen) => !isOpen)}
                  >
                    <span>{form.currencyCode}</span>
                    <span className="month-filter-chevron" aria-hidden="true" />
                  </button>
                  {expenseCurrencyOpen && (
                    <div className="month-filter-menu expense-currency-menu" id="expense-currency-menu">
                      {currencies.map((currency) => (
                        <button
                          className="month-filter-option"
                          key={currency.id}
                          type="button"
                          aria-pressed={form.currencyCode === currency.currencyCode}
                          onClick={() => {
                            setForm((currentForm) => ({
                              ...currentForm,
                              currencyCode: currency.currencyCode,
                            }))
                            setExpenseCurrencyOpen(false)
                          }}
                        >
                          {currency.currencyCode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <label className="field">
                <span>Category</span>
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                >
                  <option>Food</option>
                  <option>Transport</option>
                  <option>Housing</option>
                  <option>Shopping</option>
                  <option>Utilities</option>
                  <option>Other</option>
                </select>
              </label>

              <label className="field">
                <span>Date and time</span>
                <input
                  name="date"
                  type="datetime-local"
                  value={form.date}
                  onChange={handleChange}
                  required
                />
              </label>

              <div className="form-actions">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={closeForm}
                >
                  Cancel
                </button>
                <button className="button button-primary" type="submit">
                  {editingExpenseId === null ? 'Save expense' : 'Save changes'}
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="summary-grid" aria-label="Expense summary">
          <article className="summary-card summary-card-featured">
            <div className="summary-card-top">
              <span className="summary-icon" aria-hidden="true">↗</span>
              <span className="summary-period">{selectedPeriodLabel}</span>
            </div>
            <p>Total expenses</p>
            <strong>{displayCurrencyCode} {formatAmount(totalAmount)}</strong>
            <span className="summary-caption">
              {expensesForSelectedMonth.length} expense
              {expensesForSelectedMonth.length === 1 ? '' : 's'} recorded
            </span>
          </article>

          <article className="summary-card">
            <div className="summary-card-top">
              <span className="summary-icon summary-icon-soft" aria-hidden="true">#</span>
              <span className="summary-period">{selectedPeriodLabel}</span>
            </div>
            <p>Transactions</p>
            <strong>{expensesForSelectedMonth.length}</strong>
            <span className="summary-caption">Expenses in this period</span>
          </article>

          <article className="summary-card">
            <div className="summary-card-top">
              <span className="summary-icon summary-icon-soft" aria-hidden="true">↑</span>
              <span className="summary-period">{selectedPeriodLabel}</span>
            </div>
            <p>Largest expense</p>
            <strong>{displayCurrencyCode} {formatAmount(largestAmount)}</strong>
            <span className="summary-caption">Your highest single amount</span>
          </article>
        </section>

        <section className="transactions-card" aria-labelledby="transactions-title">
          <div className="transactions-heading">
            <div>
              <p className="eyebrow">ACTIVITY</p>
              <h2 id="transactions-title">Expenses</h2>
            </div>
            <div className="transactions-tools">
              <div className="month-filter-label">
                <span>Month</span>
                <div className="month-filter-dropdown" ref={monthFilterRef}>
                  <button
                    className="month-filter"
                    type="button"
                    aria-expanded={monthFilterOpen}
                    aria-controls="month-filter-menu"
                    onClick={() => setMonthFilterOpen((isOpen) => !isOpen)}
                  >
                    <span>
                      {selectedMonth === 'all' ? 'All months' : formatMonth(selectedMonth)}
                    </span>
                    <span className="month-filter-chevron" aria-hidden="true" />
                  </button>
                  {monthFilterOpen && (
                    <div className="month-filter-menu" id="month-filter-menu">
                      <button
                        className="month-filter-option"
                        type="button"
                        aria-pressed={selectedMonth === 'all'}
                        onClick={() => {
                          setSelectedMonth('all')
                          setMonthFilterOpen(false)
                        }}
                      >
                        All months
                      </button>
                      {availableMonths.map((month) => (
                        <button
                          className="month-filter-option"
                          key={month}
                          type="button"
                          aria-pressed={selectedMonth === month}
                          onClick={() => {
                            setSelectedMonth(month)
                            setMonthFilterOpen(false)
                          }}
                        >
                          {formatMonth(month)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="month-filter-label">
                <span>Currency</span>
                <div className="month-filter-dropdown" ref={currencyFilterRef}>
                  <button
                    className="month-filter currency-filter"
                    type="button"
                    aria-label="Dashboard display currency"
                    aria-expanded={currencyFilterOpen}
                    aria-controls="currency-filter-menu"
                    onClick={() => setCurrencyFilterOpen((isOpen) => !isOpen)}
                  >
                    <span>{displayCurrencyCode}</span>
                    <span className="month-filter-chevron" aria-hidden="true" />
                  </button>
                  {currencyFilterOpen && (
                    <div className="month-filter-menu" id="currency-filter-menu">
                      {currencies.map((currency) => (
                        <button
                          className="month-filter-option"
                          key={currency.id}
                          type="button"
                          aria-pressed={displayCurrencyCode === currency.currencyCode}
                          onClick={() => {
                            setDisplayCurrencyCode(currency.currencyCode)
                            setCurrencyFilterOpen(false)
                          }}
                        >
                          {currency.currencyCode}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <span className="transaction-count">
                {displayedExpenses.length} shown
              </span>
            </div>
          </div>

          {errorMessage && (
            <p className="action-error" role="alert">
              {errorMessage}
            </p>
          )}

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">＋</div>
              <h3>No expenses yet</h3>
              <p>Add your first expense to start tracking your spending.</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={openNewExpenseForm}
              >
                Add your first expense
              </button>
            </div>
          ) : displayedExpenses.length === 0 ? (
            <div className="empty-state">
              <h3>No expenses for {formatMonth(selectedMonth)}</h3>
              <p>Choose another month to see its expenses.</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setSelectedMonth('all')}
              >
                Show all months
              </button>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th scope="col" aria-sort={expenseSortOrder('description')}>
                      <button className="table-sort-button" type="button" onClick={() => changeExpenseSort('description')}>
                        Description <span aria-hidden="true">{expenseSortLabel('description')}</span>
                      </button>
                    </th>
                    <th scope="col" aria-sort={expenseSortOrder('category')}>
                      <button className="table-sort-button" type="button" onClick={() => changeExpenseSort('category')}>
                        Category <span aria-hidden="true">{expenseSortLabel('category')}</span>
                      </button>
                    </th>
                    <th scope="col" aria-sort={expenseSortOrder('date')}>
                      <button className="table-sort-button" type="button" onClick={() => changeExpenseSort('date')}>
                        Date <span aria-hidden="true">{expenseSortLabel('date')}</span>
                      </button>
                    </th>
                    <th scope="col" className="amount-column" aria-sort={expenseSortOrder('amount')}>
                      <button className="table-sort-button" type="button" onClick={() => changeExpenseSort('amount')}>
                        Amount ({displayCurrencyCode}) <span aria-hidden="true">{expenseSortLabel('amount')}</span>
                      </button>
                    </th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedExpenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="description-cell">{expense.description}</td>
                      <td><span className="category-tag">{expense.category}</span></td>
                      <td className="date-cell">{formatDate(expense.date)}</td>
                      <td className="amount-cell">
                        {displayCurrencyCode} {formatAmount(expense.convertedAmount ?? expense.amount)}
                      </td>
                      <td>
                        <div className="expense-actions">
                          <button
                            className="row-action-button"
                            type="button"
                            onClick={() => openEditForm(expense)}
                            aria-label={`Edit ${expense.description}`}
                          >
                            Edit
                          </button>
                          <button
                            className="row-action-button row-action-delete"
                            type="button"
                            onClick={() => handleDelete(expense)}
                            aria-label={`Delete ${expense.description}`}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
  )
}

export default DashboardPage
