import { NavLink, Route, Routes } from 'react-router'
import DashboardPage from './pages/DashboardPage.jsx'
import CurrenciesPage from './pages/CurrenciesPage.jsx'
import './App.css'

function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink className="brand" to="/" aria-label="Expense Manager home">
          <span className="brand-mark">W</span>
          <span className="brand-name">
            wallace<span className="brand-divider"> / </span>expenses
          </span>
        </NavLink>

        <nav className="topbar-nav" aria-label="Main navigation">
          <NavLink
            className={({ isActive }) =>
              `topbar-link${isActive ? ' topbar-link-active' : ''}`
            }
            to="/"
            end
          >
            Dashboard
          </NavLink>
          <NavLink
            className={({ isActive }) =>
              `topbar-link${isActive ? ' topbar-link-active' : ''}`
            }
            to="/currencies"
          >
            Currencies
          </NavLink>
        </nav>

        <div className="account-label">
          <span className="account-avatar">W</span>
          <span>Personal account</span>
        </div>
      </header>

      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/currencies" element={<CurrenciesPage />} />
      </Routes>

      <footer className="footer">
        <span>Expense Manager</span>
        <span>Built for a clearer view of your spending</span>
      </footer>
    </div>
  )
}

export default App
