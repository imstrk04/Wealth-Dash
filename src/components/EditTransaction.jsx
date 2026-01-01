import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import EmojiPicker from 'emoji-picker-react'

export default function EditTransaction() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  
  // Form State
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [emoji, setEmoji] = useState('💸')
  const [accountId, setAccountId] = useState('')
  const [oldTransaction, setOldTransaction] = useState(null)
  
  // UI State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // 1. Get Transaction Details
    const { data: tx, error } = await supabase.from('transactions').select('*').eq('id', id).single()
    if (error) { alert("Transaction not found"); navigate('/'); return }

    setOldTransaction(tx)
    setAmount(tx.amount)
    setDescription(tx.description)
    setDate(tx.date)
    setType(tx.type)
    setCategory(tx.category)
    setEmoji(tx.emoji)
    setAccountId(tx.account_id)

    // 2. Get Lists
    const { data: accs } = await supabase.from('accounts').select('*')
    setAccounts(accs || [])
    const { data: cats } = await supabase.from('categories').select('*')
    setCategories(cats || [])
    
    setLoading(false)
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (!amount || !accountId) return alert("Please fill details")
    
    const newAmount = parseFloat(amount)
    const oldAmount = parseFloat(oldTransaction.amount)
    
    // --- BALANCE UPDATE LOGIC ---
    // Only update balance if Amount or Account changed (Skipping Account change logic for simplicity, assuming same account)
    if (newAmount !== oldAmount) {
      const { data: acc } = await supabase.from('accounts').select('*').eq('id', accountId).single()
      let currentBalance = Number(acc.balance)

      // 1. Reverse Old Transaction
      // (If it was Expense, we add back. If Income, we subtract)
      if (oldTransaction.type === 'Expense') currentBalance += oldAmount
      else if (oldTransaction.type === 'Income') currentBalance -= oldAmount
      
      // 2. Apply New Transaction
      if (type === 'Expense') currentBalance -= newAmount
      else if (type === 'Income') currentBalance += newAmount

      // Update Account
      await supabase.from('accounts').update({ balance: currentBalance }).eq('id', accountId)
    }

    // --- UPDATE TRANSACTION ---
    const { error } = await supabase.from('transactions').update({
      amount: newAmount,
      description,
      date,
      category,
      emoji
    }).eq('id', id)

    if (error) alert("Error updating")
    else {
      alert("Updated Successfully!")
      navigate(-1)
    }
  }

  if (loading) return <div className="p-10 text-center">Loading...</div>

  return (
    <div className="p-4 max-w-md mx-auto pb-24 dark:bg-gray-900 min-h-screen relative">
      <div className="flex items-center gap-4 mb-6 mt-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold dark:text-white">Edit Transaction</h2>
      </div>

      <form onSubmit={handleUpdate} className="flex flex-col gap-5">
        
        {/* Amount & Emoji */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 text-3xl font-bold outline-none bg-white dark:bg-gray-800 dark:text-white rounded-2xl border-2 border-transparent focus:border-blue-500" />
          </div>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-20 bg-white dark:bg-gray-800 rounded-2xl text-3xl flex items-center justify-center border-2 border-transparent hover:border-blue-500 shadow-sm">
            {emoji}
          </button>
        </div>

        {/* FULL EMOJI PICKER */}
        {showEmojiPicker && (
          <div className="absolute z-50 top-24 left-0 w-full p-2">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
               <EmojiPicker 
                 width="100%" 
                 height={350}
                 onEmojiClick={(e) => { setEmoji(e.emoji); setShowEmojiPicker(false) }} 
               />
            </div>
            <div className="fixed inset-0 -z-10 bg-black/20" onClick={() => setShowEmojiPicker(false)}></div>
          </div>
        )}

        {/* Details */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase ml-2">Note</label>
           <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" />
        </div>

        <div>
           <label className="text-xs font-bold text-gray-500 uppercase ml-2">Date</label>
           <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" />
        </div>

        {/* Category (Text input for flexibility) */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase ml-2">Category</label>
           <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" />
        </div>

        <button className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-xl flex items-center justify-center gap-2">
          <Save size={20}/> Save Changes
        </button>
      </form>
    </div>
  )
}