import { useEffect, useState } from 'react'
import './App.css'

const getCurrentDateTime = () => {
  const now = new Date()
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return localTime.toISOString().slice(0, 16)
}

const createEmptyForm = () => ({
  description: '',
  amount: '',
  category: 'Other',
  date: getCurrentDateTime(),
})

const formatAmount = (amount) =>
  new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

const formatDate = (date) =>
  new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

function App() {
  const [expenses, setExpenses] = useState([])
  const [form, setForm] = useState(createEmptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [totalPeriod, setTotalPeriod] = useState('month')
  const [largestPeriod, setLargestPeriod] = useState('month')

  useEffect(() => {
    fetch('/api/expenses')
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Request failed: ${response.status}`)
          }

          return response.json()
        })
        .then((data) => {
          setExpenses(data)
        })
        .catch((error) => {
          console.error('Could not load expenses:', error)
        })
  }, [])

  const now = new Date()
  const thisMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return (
      expenseDate.getMonth() === now.getMonth() &&
      expenseDate.getFullYear() === now.getFullYear()
    )
  })

  const expensesForTotal =
      totalPeriod === 'month' ? thisMonthExpenses : expenses

  const totalAmount = expensesForTotal.reduce(
      (sum, expense) => sum + Number(expense.amount),
      0,
  )

  const expensesForLargest =
      largestPeriod === 'month' ? thisMonthExpenses : expenses

  const largestAmount = expensesForLargest.reduce(
      (largest, expense) => Math.max(largest, Number(expense.amount)),
      0,
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const newExpense = {
      id: Date.now(),
      description: form.description.trim(),
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
    }

    setExpenses((currentExpenses) => [newExpense, ...currentExpenses])
    setForm(createEmptyForm())
    setFormOpen(false)
  }

  const closeForm = () => {
    setFormOpen(false)
    setForm(createEmptyForm())
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="Expense Manager home">
          <span className="brand-mark">W</span>
          <span className="brand-name">
            wallace<span className="brand-divider"> / </span>expenses
          </span>
        </a>
        <div className="account-label">
          <span className="account-avatar">W</span>
          <span>Personal account</span>
        </div>
      </header>

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
            onClick={() => setFormOpen((isOpen) => !isOpen)}
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
                <p className="eyebrow">NEW TRANSACTION</p>
                <h2 id="form-title">Add an expense</h2>
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
                  Save expense
                </button>
              </div>
            </form>
          </section>
        )}

        <section className="summary-grid" aria-label="Expense summary">
          <article className="summary-card summary-card-featured">
            <div className="summary-card-top">
              <span className="summary-icon" aria-hidden="true">↗</span>
              <button
                  className="summary-period summary-period-toggle"
                  type="button"
                  onClick={() =>
                      setTotalPeriod(totalPeriod === 'month' ? 'all' : 'month')
                  }
              >
                {totalPeriod === 'month' ? 'THIS MONTH' : 'ALL TIME'}
              </button>
            </div>
            <p>Total expenses</p>
            <strong>{formatAmount(totalAmount)}</strong>
            <span className="summary-caption">
              {expensesForTotal.length} expense
              {expensesForTotal.length === 1 ? '' : 's'} recorded
            </span>
          </article>

          <article className="summary-card">
            <div className="summary-card-top">
              <span className="summary-icon summary-icon-soft" aria-hidden="true">#</span>
              <span className="summary-period">ALL TIME</span>
            </div>
            <p>Transactions</p>
            <strong>{expenses.length}</strong>
            <span className="summary-caption">Expenses you have added</span>
          </article>

          <article className="summary-card">
            <div className="summary-card-top">
              <span className="summary-icon summary-icon-soft" aria-hidden="true">↑</span>
              <button
                  className="summary-period summary-period-toggle"
                  type="button"
                  onClick={() =>
                      setLargestPeriod(largestPeriod === 'month' ? 'all' : 'month')
                  }
              >
                {largestPeriod === 'month' ? 'THIS MONTH' : 'ALL TIME'}
              </button>
            </div>
            <p>Largest expense</p>
            <strong>{formatAmount(largestAmount)}</strong>
            <span className="summary-caption">Your highest single amount</span>
          </article>
        </section>

        <section className="transactions-card" aria-labelledby="transactions-title">
          <div className="transactions-heading">
            <div>
              <p className="eyebrow">ACTIVITY</p>
              <h2 id="transactions-title">Recent expenses</h2>
            </div>
            <span className="transaction-count">
              {expenses.length} total
            </span>
          </div>

          {expenses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon" aria-hidden="true">＋</div>
              <h3>No expenses yet</h3>
              <p>Add your first expense to start tracking your spending.</p>
              <button
                className="button button-secondary"
                type="button"
                onClick={() => setFormOpen(true)}
              >
                Add your first expense
              </button>
            </div>
          ) : (
            <div className="table-scroll">
              <table className="expense-table">
                <thead>
                  <tr>
                    <th scope="col">Description</th>
                    <th scope="col">Category</th>
                    <th scope="col">Date</th>
                    <th scope="col" className="amount-column">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id}>
                      <td className="description-cell">{expense.description}</td>
                      <td><span className="category-tag">{expense.category}</span></td>
                      <td className="date-cell">{formatDate(expense.date)}</td>
                      <td className="amount-cell">{formatAmount(expense.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <p className="storage-note">
          This preview keeps entries in the page temporarily. We’ll connect it to
          your backend next.
        </p>
      </main>

      <footer className="footer">
        <span>Expense Manager</span>
        <span>Built for a clearer view of your spending</span>
      </footer>
    </div>
  )
}

export default App
