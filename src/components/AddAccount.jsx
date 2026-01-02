import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useLocation } from 'react-router-dom'
import { ArrowLeft, HelpCircle, X, Trash2, Loader2 } from 'lucide-react'

export default function AddAccount() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isSaving, setIsSaving] = useState(false)
  
  const editingAccount = location.state?.account || null
  const isEditing = !!editingAccount

  const [showHelp, setShowHelp] = useState(false)
  const [name, setName] = useState(editingAccount?.name || '')
  const [type, setType] = useState(editingAccount?.type || 'Bank')
  const [limit, setLimit] = useState(editingAccount?.credit_limit || '')
  
  const [balance, setBalance] = useState(() => {
    if (!editingAccount) return ''
    return editingAccount.type === 'Credit Card' 
      ? parseFloat(editingAccount.balance) + parseFloat(editingAccount.credit_limit)
      : editingAccount.balance
  })

  const handleSave = async (e) => {
    e.preventDefault()
    if (isSaving) return; // Prevent spam
    
    setIsSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    try {
      let finalLimit = parseFloat(limit) || 0
      let userInput = parseFloat(balance) || 0
      let dbBalance = type === 'Credit Card' ? userInput - finalLimit : userInput

      const accountData = { 
        user_id: user.id, name, type, balance: dbBalance,
        credit_limit: type === 'Credit Card' ? finalLimit : 0
      }

      const { error } = isEditing 
        ? await supabase.from('accounts').update(accountData).eq('id', editingAccount.id)
        : await supabase.from('accounts').insert(accountData)

      if (error) throw error
      navigate(-1)
    } catch (err) {
      alert("Error saving account: " + err.message)
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Are you sure? This will remove the account.")) return;
    const { error } = await supabase.from('accounts').delete().eq('id', editingAccount.id)
    if (!error) navigate(-1)
  }

  return (
    <div className="p-4 max-w-md mx-auto dark:bg-gray-900 min-h-screen relative">
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600"><ArrowLeft size={24} /></button>
          <h2 className="text-2xl font-bold">{isEditing ? 'Edit Account' : 'New Account'}</h2>
        </div>
        <div className="flex gap-2">
          {isEditing && <button onClick={handleDelete} className="p-2 text-red-500"><Trash2 size={24} /></button>}
          <button onClick={() => setShowHelp(true)} className="p-2 text-blue-600"><HelpCircle size={24} /></button>
        </div>
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-2">Account Name</label>
          <input className="w-full p-4 rounded-xl border dark:bg-gray-800" value={name} onChange={e => setName(e.target.value)} required disabled={isSaving}/>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-2">Type</label>
          <select className="w-full p-4 rounded-xl border bg-white dark:bg-gray-800" value={type} onChange={e => setType(e.target.value)} disabled={isEditing || isSaving}>
            <option>Bank</option><option>Credit Card</option><option>Cash</option>
          </select>
        </div>
        {type === 'Credit Card' ? (
          <div className="space-y-4">
            <input className="w-full p-4 rounded-xl border dark:bg-gray-800" type="number" placeholder="Credit Limit" value={limit} onChange={e => setLimit(e.target.value)} disabled={isSaving}/>
            <input className="w-full p-4 rounded-xl border dark:bg-gray-800" type="number" placeholder="Available Credit" value={balance} onChange={e => setBalance(e.target.value)} disabled={isSaving}/>
          </div>
        ) : (
          <input className="w-full p-4 rounded-xl border dark:bg-gray-800" type="number" placeholder="Balance" value={balance} onChange={e => setBalance(e.target.value)} disabled={isSaving}/>
        )}
        <button disabled={isSaving} className="bg-blue-600 text-white p-4 rounded-xl font-bold flex justify-center gap-2 items-center">
          {isSaving ? <><Loader2 className="animate-spin" /> Saving...</> : (isEditing ? 'Save Changes' : 'Create Account')}
        </button>
      </form>
    </div>
  )
}