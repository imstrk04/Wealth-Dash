import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Moon, Sun, User, Phone, LogOut, BarChart3, Lock, ArrowLeft } from 'lucide-react' // Added ArrowLeft
import { useNavigate } from 'react-router-dom' // Added

export default function Settings() {
  const navigate = useNavigate() // Hook
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState({ full_name: '', phone: '', email: '' })
  const [password, setPassword] = useState('') 
  const [darkMode, setDarkMode] = useState(false)
  
  const [chartPrefs, setChartPrefs] = useState({
    breakdown: true,
    trend: true,
    incomeVsExpense: true,
    cardVsBank: true,
    categoryBar: true
  })

  useEffect(() => {
    fetchProfile()
    const isDark = localStorage.getItem('theme') === 'dark'
    setDarkMode(isDark)
    if (isDark) document.documentElement.classList.add('dark')
    
    const saved = localStorage.getItem('chartPrefs')
    if(saved) setChartPrefs(JSON.parse(saved))
  }, [])

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile({ ...data, email: user.email })
    }
  }

  const toggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
      setDarkMode(false)
    } else {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
      setDarkMode(true)
    }
  }

  const toggleChart = (key) => {
    const newPrefs = { ...chartPrefs, [key]: !chartPrefs[key] }
    setChartPrefs(newPrefs)
    localStorage.setItem('chartPrefs', JSON.stringify(newPrefs))
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ full_name: profile.full_name, phone: profile.phone })
      .eq('id', user.id)

    let passMsg = ''
    if (password) {
      const { error: passError } = await supabase.auth.updateUser({ password: password })
      if (passError) {
        passMsg = ` (Password Failed: ${passError.message})`
      } else {
        passMsg = ' and Password'
        setPassword('') 
      }
    }

    if (!profileError) alert(`Profile${passMsg} updated!`)
    else alert('Error updating profile')
    
    setLoading(false)
  }

  const handleLogout = async () => { await supabase.auth.signOut(); window.location.href = "/" }

  return (
    <div className="p-4 max-w-md mx-auto pb-24 dark:bg-gray-900 min-h-screen">
      
      {/* HEADER WITH BACK BUTTON */}
      <div className="flex items-center gap-4 mb-6 mt-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold dark:text-white">Settings</h2>
      </div>

      {/* Theme Toggle */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex justify-between items-center">
        <span className="font-bold text-gray-700 dark:text-gray-200">App Theme</span>
        <button onClick={toggleTheme} className={`p-2 rounded-full ${darkMode ? 'bg-gray-700 text-yellow-400' : 'bg-blue-100 text-blue-600'}`}>
          {darkMode ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </div>

      {/* Chart Visibility */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <div className="flex items-center gap-2 mb-4 text-gray-700 dark:text-white">
          <BarChart3 size={20} />
          <span className="font-bold">Dashboard Charts</span>
        </div>
        <div className="space-y-3">
          {[
            { id: 'breakdown', label: 'Expense Breakdown (Pie)' },
            { id: 'categoryBar', label: 'Category Comparison (Bar)' },
            { id: 'cardVsBank', label: 'Card vs Bank Usage' },
            { id: 'trend', label: 'Monthly Trend' },
            { id: 'incomeVsExpense', label: 'Income vs Expense' }
          ].map(chart => (
            <div key={chart.id} className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-300">{chart.label}</span>
              <input 
                type="checkbox" 
                checked={chartPrefs[chart.id]} 
                onChange={() => toggleChart(chart.id)}
                className="w-5 h-5 accent-blue-600"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Profile Form */}
      <form onSubmit={handleUpdate} className="flex flex-col gap-4">
        <div className="relative">
          <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
          <input className="p-4 pl-12 w-full rounded-xl border dark:bg-gray-800 dark:text-white" value={profile.full_name || ''} onChange={e => setProfile({...profile, full_name: e.target.value})} placeholder="Full Name" />
        </div>
        
        <div className="relative">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
          <input className="p-4 pl-12 w-full rounded-xl border dark:bg-gray-800 dark:text-white" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} placeholder="Phone" />
        </div>

        <div className="relative">
          <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
          <input 
            type="password"
            className="p-4 pl-12 w-full rounded-xl border dark:bg-gray-800 dark:text-white" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="New Password (leave empty to keep)" 
          />
        </div>

        <button disabled={loading} className="bg-black dark:bg-blue-600 text-white p-4 rounded-xl font-bold mt-4">{loading ? 'Saving...' : 'Save Changes'}</button>
      </form>

      <button onClick={handleLogout} className="w-full mt-6 flex items-center justify-center gap-2 text-red-500 font-bold p-4"><LogOut size={20}/> Log Out</button>
    </div>
  )
}