import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, HelpCircle, X, Trash2 } from 'lucide-react'

export default function AddAccount() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Check if we are editing an existing account
  const editingAccount = location.state?.account || null
  const isEditing = !!editingAccount

  const [showHelp, setShowHelp] = useState(false)
  const [name, setName] = useState(editingAccount?.name || '')
  const [type, setType] = useState(editingAccount?.type || 'Bank')
  const [limit, setLimit] = useState(editingAccount?.credit_limit || '')
  
  // Logic for displaying balance in the input field
  const initialDisplayBalance = () => {
    if (!editingAccount) return ''
    if (editingAccount.type === 'Credit Card') {
      // If editing CC, show "Available" (Balance + Limit)
      return parseFloat(editingAccount.balance) + parseFloat(editingAccount.credit_limit)
    }
    return editingAccount.balance
  }
  const [balance, setBalance] = useState(initialDisplayBalance())

  const handleSave = async (e) => {
    e.preventDefault()
    const user = (await supabase.auth.getUser()).data.user
    
    let finalLimit = parseFloat(limit) || 0
    let userInput = parseFloat(balance) || 0
    let dbBalance = userInput

    if (type === 'Credit Card') {
      dbBalance = userInput - finalLimit
    }

    const accountData = { 
      user_id: user.id, 
      name, 
      type, 
      balance: dbBalance,
      credit_limit: type === 'Credit Card' ? finalLimit : 0
    }

    let error;
    if (isEditing) {
      const { error: updateError } = await supabase
        .from('accounts')
        .update(accountData)
        .eq('id', editingAccount.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('accounts')
        .insert(accountData)
      error = insertError
    }

    if (!error) { 
      alert(isEditing ? 'Account Updated!' : 'Account Created!')
      navigate(-1) 
    } else {
      alert('Error saving account')
    }
  }

  const handleDelete = async () => {
    const confirmDelete = window.confirm("Are you sure? This will remove the account and potentially affect linked transactions.")
    if (confirmDelete) {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', editingAccount.id)
      
      if (!error) {
        alert('Account Deleted')
        navigate(-1)
      } else {
        alert('Error deleting account')
      }
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto dark:bg-gray-900 min-h-screen relative">
      
      {/* Help Modal logic remains same */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full relative">
            <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-gray-400"><X/></button>
            <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><HelpCircle size={20} className="text-blue-500"/> Account Guide</h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <p><strong>🏦 Bank/Cash:</strong> Enter your total balance.</p>
              <p><strong>💳 Credit Card:</strong> We calculate debt as (Available - Limit).</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold dark:text-white">{isEditing ? 'Edit Account' : 'New Account'}</h2>
        </div>
        <div className="flex gap-2">
          {isEditing && (
            <button onClick={handleDelete} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
              <Trash2 size={24} />
            </button>
          )}
          <button onClick={() => setShowHelp(true)} className="p-2 text-blue-600 dark:text-blue-400">
            <HelpCircle size={24} />
          </button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-2">Account Name</label>
          <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-2">Type</label>
          <select className="w-full p-4 rounded-xl border bg-white dark:bg-gray-800 dark:text-white" value={type} onChange={e => setType(e.target.value)} disabled={isEditing}>
            <option>Bank</option>
            <option>Credit Card</option>
            <option>Cash</option>
          </select>
        </div>

        {type === 'Credit Card' ? (
          <div className="space-y-4">
             <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-2">Total Credit Limit</label>
              <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" type="number" value={limit} onChange={e => setLimit(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-2">Remaining Credit (Available)</label>
              <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" type="number" value={balance} onChange={e => setBalance(e.target.value)} />
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Current Balance</label>
            <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" type="number" value={balance} onChange={e => setBalance(e.target.value)} />
          </div>
        )}

        <button className="bg-black dark:bg-blue-600 text-white p-4 rounded-xl font-bold mt-4">
          {isEditing ? 'Save Changes' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}