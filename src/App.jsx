import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthPage from './components/Auth'
import Dashboard from './components/Dashboard'
import AddTransaction from './components/AddTransaction'
import EditTransaction from './components/EditTransaction' // <--- IMPORT THIS
import AddAccount from './components/AddAccount'
import Analytics from './components/Analytics'
import Navbar from './components/Navbar'
import Settings from './components/Settings'

export default function App() {
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Auth Listener
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    
    // Apply Dark Mode from storage on load
    if (localStorage.getItem('theme') === 'dark') {
      document.documentElement.classList.add('dark')
    }

    return () => subscription.unsubscribe()
  }, [])

  if (!session) return <AuthPage />

  return (
    <Router>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/add" element={<AddTransaction />} />
          <Route path="/edit-transaction/:id" element={<EditTransaction />} /> {/* <--- NEW ROUTE */}
          <Route path="/add-account" element={<AddAccount />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
        <Navbar />
      </div>
    </Router>
  )
}