import { useEffect, useState } from 'react'

const createEmptyForm = () => ({
  currencyCode: '',
  rateToBase: '',
})

const formatRate = (rate) =>
  new Intl.NumberFormat(undefined, { maximumFractionDigits: 8 }).format(Number(rate))

const formatUpdateAt = (date) =>
  date
    ? new Date(String(date).replace(' ', 'T')).toLocaleString()
    : '—'

function CurrenciesPage() {
  const [currencies, setCurrencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [form, setForm] = useState(createEmptyForm)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCurrencyId, setEditingCurrencyId] = useState(null)
  const [currencySort, setCurrencySort] = useState({ key: 'rateToBase', direction: 'asc' })
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    fetch('/api/currencies')
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`)
        }

        return response.json()
      })
      .then((data) => setCurrencies(data))
      .catch((error) => {
        console.error('Could not load currencies:', error)
        setLoadError(true)
        setErrorMessage('Could not load currencies. Check that the backend is running.')
      })
      .finally(() => setLoading(false))
  }, [])

  const closeForm = () => {
    setFormOpen(false)
    setEditingCurrencyId(null)
    setForm(createEmptyForm())
    setErrorMessage('')
  }

  const openNewCurrencyForm = () => {
    setEditingCurrencyId(null)
    setForm(createEmptyForm())
    setErrorMessage('')
    setFormOpen(true)
  }

  const openEditCurrencyForm = (currency) => {
    setEditingCurrencyId(currency.id)
    setForm({
      currencyCode: currency.currencyCode,
      rateToBase: String(currency.rateToBase),
    })
    setErrorMessage('')
    setFormOpen(true)
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({ ...currentForm, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    const currencyToSave = {
      currencyCode: form.currencyCode.trim().toUpperCase(),
      rateToBase: Number(form.rateToBase),
    }

    try {
      const isEditing = editingCurrencyId !== null
      const response = await fetch(
        isEditing
          ? `/api/currencies/update/${editingCurrencyId}`
          : '/api/currencies',
        {
          method: isEditing ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(currencyToSave),
        },
      )

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      const savedCurrency = await response.json()

      if (isEditing) {
        setCurrencies((currentCurrencies) =>
          currentCurrencies.map((currency) =>
            currency.id === savedCurrency.id ? savedCurrency : currency,
          ),
        )
      } else {
        setCurrencies((currentCurrencies) => [savedCurrency, ...currentCurrencies])
      }

      closeForm()
    } catch (error) {
      console.error('Could not save currency:', error)
      setErrorMessage('Could not save the currency. Check the code and rate, then try again.')
    }
  }

  const handleDelete = async (currency) => {
    const confirmed = window.confirm(`Delete ${currency.currencyCode}?`)
    if (!confirmed) return

    setErrorMessage('')

    try {
      const response = await fetch(`/api/currencies/delete/${currency.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`)
      }

      setCurrencies((currentCurrencies) =>
        currentCurrencies.filter((currentCurrency) => currentCurrency.id !== currency.id),
      )

      if (editingCurrencyId === currency.id) {
        closeForm()
      }
    } catch (error) {
      console.error('Could not delete currency:', error)
      setErrorMessage('Could not delete the currency. Please try again.')
    }
  }

  const sortedCurrencies = [...currencies].sort((first, second) => {
    let comparison
    if (currencySort.key === 'rateToBase') {
      comparison = Number(first.rateToBase) - Number(second.rateToBase)
    } else if (currencySort.key === 'updateAt') {
      comparison = new Date(String(first.updateAt).replace(' ', 'T'))
        - new Date(String(second.updateAt).replace(' ', 'T'))
    } else {
      comparison = String(first.currencyCode).localeCompare(String(second.currencyCode))
    }
    return currencySort.direction === 'asc' ? comparison : -comparison
  })

  const changeCurrencySort = (key) => {
    setCurrencySort((currentSort) => ({
      key,
      direction:
        currentSort.key === key && currentSort.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const currencySortOrder = (key) =>
    currencySort.key !== key ? 'none' : currencySort.direction === 'asc' ? 'ascending' : 'descending'

  const currencySortLabel = (key) => {
    if (currencySort.key !== key) return '↕'
    return currencySort.direction === 'asc' ? '↑' : '↓'
  }

  return (
    <main className="dashboard">
      <section className="page-heading" aria-labelledby="currencies-title">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1 id="currencies-title">Currencies</h1>
          <p className="page-subtitle">
            Manage currency codes and their rates to MYR, the app's base currency.
          </p>
        </div>
        <button
          className="button button-primary"
          type="button"
          onClick={() => {
            if (formOpen && editingCurrencyId === null) {
              closeForm()
            } else {
              openNewCurrencyForm()
            }
          }}
          aria-expanded={formOpen}
          aria-controls="currency-form-panel"
        >
          <span className="button-plus" aria-hidden="true">+</span>
          Add currency
        </button>
      </section>

      {formOpen && (
        <section
          className="form-card"
          id="currency-form-panel"
          aria-labelledby="currency-form-title"
        >
          <div className="card-heading">
            <div>
              <p className="eyebrow">
                {editingCurrencyId === null ? 'NEW CURRENCY' : 'EDIT CURRENCY'}
              </p>
              <h2 id="currency-form-title">
                {editingCurrencyId === null ? 'Add a currency' : 'Edit currency'}
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
            <label className="field">
              <span>Currency code</span>
              <input
                autoFocus
                name="currencyCode"
                type="text"
                placeholder="e.g. MYR"
                value={form.currencyCode}
                onChange={handleChange}
                maxLength="3"
                pattern="[A-Za-z]{3}"
                title="Enter a three-letter currency code, such as MYR."
                required
              />
            </label>

            <label className="field">
              <span>Rate to base currency</span>
              <input
                name="rateToBase"
                type="number"
                min="0.00000001"
                step="0.00000001"
                placeholder="1.00000000"
                value={form.rateToBase}
                onChange={handleChange}
                required
              />
            </label>

            <p className="field-hint">
              Enter the MYR value of one unit of this currency. MYR itself stays at 1.00000000.
            </p>

            <div className="form-actions">
              <button
                className="button button-secondary"
                type="button"
                onClick={closeForm}
              >
                Cancel
              </button>
              <button className="button button-primary" type="submit">
                {editingCurrencyId === null ? 'Save currency' : 'Save changes'}
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="transactions-card" aria-labelledby="currency-list-title">
        <div className="transactions-heading">
          <div>
            <p className="eyebrow">CURRENCY DATA</p>
            <h2 id="currency-list-title">Supported currencies</h2>
          </div>
          <span className="transaction-count">
            {currencies.length} {currencies.length === 1 ? 'currency' : 'currencies'}
          </span>
        </div>

        {errorMessage && (
          <p className="action-error" role="alert">
            {errorMessage}
          </p>
        )}

        {loading ? (
          <div className="empty-state">
            <p>Loading currencies…</p>
          </div>
        ) : loadError ? (
          <div className="empty-state">
            <h3>Could not load currencies</h3>
            <p>Start the backend, then refresh this page.</p>
          </div>
        ) : currencies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon" aria-hidden="true">¤</div>
            <h3>No currencies yet</h3>
            <p>Add a currency to start building your currency list.</p>
            <button
              className="button button-secondary"
              type="button"
              onClick={openNewCurrencyForm}
            >
              Add your first currency
            </button>
          </div>
        ) : (
          <div className="table-scroll">
            <table className="expense-table">
              <thead>
                <tr>
                  <th scope="col" aria-sort={currencySortOrder('currencyCode')}>
                    <button className="table-sort-button" type="button" onClick={() => changeCurrencySort('currencyCode')}>
                      Currency code <span aria-hidden="true">{currencySortLabel('currencyCode')}</span>
                    </button>
                  </th>
                  <th scope="col" className="amount-column" aria-sort={currencySortOrder('rateToBase')}>
                    <button className="table-sort-button" type="button" onClick={() => changeCurrencySort('rateToBase')}>
                      Rate to base <span aria-hidden="true">{currencySortLabel('rateToBase')}</span>
                    </button>
                  </th>
                  <th scope="col" aria-sort={currencySortOrder('updateAt')}>
                    <button className="table-sort-button" type="button" onClick={() => changeCurrencySort('updateAt')}>
                      Last updated <span aria-hidden="true">{currencySortLabel('updateAt')}</span>
                    </button>
                  </th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedCurrencies.map((currency) => (
                  <tr key={currency.id}>
                    <td className="description-cell">
                      {currency.currencyCode}
                      {currency.currencyCode === 'MYR' && <span className="base-currency-tag">Base</span>}
                    </td>
                    <td className="amount-cell">{formatRate(currency.rateToBase)}</td>
                    <td className="date-cell">{formatUpdateAt(currency.updateAt)}</td>
                    <td>
                      <div className="expense-actions">
                        {currency.currencyCode !== 'MYR' && (
                          <>
                            <button
                              className="row-action-button"
                              type="button"
                              onClick={() => openEditCurrencyForm(currency)}
                              aria-label={`Edit ${currency.currencyCode}`}
                            >
                              Edit
                            </button>
                            <button
                              className="row-action-button row-action-delete"
                              type="button"
                              onClick={() => handleDelete(currency)}
                              aria-label={`Delete ${currency.currencyCode}`}
                            >
                              Delete
                            </button>
                          </>
                        )}
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

export default CurrenciesPage
