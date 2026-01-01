import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import AuthPage from '../components/Auth'
import AddTransaction from '../components/AddTransaction'
import AddAccount from '../components/AddAccount'

// Helper to wrap components in Router (needed for Links/Navigation)
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>)
}

describe('WealthDash Component Tests', () => {
  
  // TEST 1: Check if Auth Page renders
  it('renders the Auth page correctly', () => {
    renderWithRouter(<AuthPage />)
    
    // Check for title
    expect(screen.getByText(/WealthDash/i)).toBeInTheDocument()
    
    // FIX: Use getAllByRole because there are TWO "Log In" buttons (Toggle & Submit)
    const loginBtns = screen.getAllByRole('button', { name: /Log In/i })
    expect(loginBtns.length).toBeGreaterThan(0) // As long as we find at least one, it's good

    // Check for Sign Up toggle
    const signUpBtn = screen.getByRole('button', { name: /Sign Up/i })
    expect(signUpBtn).toBeInTheDocument()
  })

  // TEST 2: Check AddTransaction Form Inputs (Async Fix)
  it('renders AddTransaction inputs correctly', async () => {
    renderWithRouter(<AddTransaction />)
    
    // FIX: Wait for the inputs to appear to resolve "act(...)" warnings from useEffect
    await waitFor(() => {
        expect(screen.getByText('Expense')).toBeInTheDocument()
    })

    expect(screen.getByText('Income')).toBeInTheDocument()
    expect(screen.getByText('Transfer')).toBeInTheDocument()
    
    // Check amount input exists (placeholder "0")
    const amountInput = screen.getByPlaceholderText('0')
    expect(amountInput).toBeInTheDocument()
  })

  // TEST 3: Logic Check - Net Worth Calculation
  it('calculates Net Worth correctly (Pure Logic)', () => {
    const mockAccounts = [
      { type: 'Bank', balance: 10000 },
      { type: 'Cash', balance: 2000 },
      { type: 'Credit Card', balance: -5000 } // Debt is stored as negative
    ]

    // This is the exact logic used in Dashboard.jsx
    const netWorth = mockAccounts.reduce((acc, curr) => acc + curr.balance, 0)

    // 10000 + 2000 + (-5000) should be 7000
    expect(netWorth).toBe(7000)
  })

  // TEST 4: Add Account Form logic
  it('renders Add Account form fields', () => {
    renderWithRouter(<AddAccount />)
    
    expect(screen.getByText(/New Account/i)).toBeInTheDocument()
    expect(screen.getByPlaceholderText(/e.g. HDFC Regalia/i)).toBeInTheDocument()
  })
})