import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
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
  
  // We fetch accounts/categories just in case we need them later (e.g. if we add dropdowns)
  const [accounts, setAccounts] = useState([])
  const [categories, setCategories] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // 1. Get Transaction Details
    const { data: tx, error } = await supabase.from('transactions').select('*').eq('id', id).single()
    if (error) { 
      console.error("Error fetching transaction:", error)
      alert("Transaction not found")
      navigate('/')
      return 
    }

    setOldTransaction(tx)
    setAmount(tx.amount)
    setDescription(tx.description)
    setDate(tx.date)
    setType(tx.type)
    setCategory(tx.category)
    setEmoji(tx.emoji)
    setAccountId(tx.account_id)

    // 2. Get Lists (Optional, kept for future extensibility)
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
    // Update balance if Amount changed OR Type changed
    // NOTE: We skip balance updates for 'Transfer' here because tracking the destination account logic is complex for this edit form.
    if ((newAmount !== oldAmount || type !== oldTransaction.type) && type !== 'Transfer' && oldTransaction.type !== 'Transfer') {
      const { data: acc } = await supabase.from('accounts').select('*').eq('id', accountId).single()
      let currentBalance = Number(acc.balance)

      // 1. Reverse Old Transaction Effect
      if (oldTransaction.type === 'Expense') currentBalance += oldAmount
      else if (oldTransaction.type === 'Income') currentBalance -= oldAmount
      
      // 2. Apply New Transaction Effect
      if (type === 'Expense') currentBalance -= newAmount
      else if (type === 'Income') currentBalance += newAmount

      // Update Account
      const { error: balanceError } = await supabase.from('accounts').update({ balance: currentBalance }).eq('id', accountId)
      if (balanceError) {
         console.error("Error updating balance:", balanceError)
         return alert("Failed to update account balance")
      }
    }

    // --- UPDATE TRANSACTION ---
    const { error } = await supabase.from('transactions').update({
      amount: newAmount,
      description,
      date,
      category,
      type, // Ensure type is updated too
      emoji
    }).eq('id', id)

    if (error) {
      console.error("Error updating transaction:", error)
      alert("Error updating transaction. Check permissions.")
    } else {
      alert("Updated Successfully!")
      navigate(-1)
    }
  }

  if (loading) return <div className="p-10 text-center dark:text-white">Loading...</div>

  return (
    <div className="p-4 max-w-md mx-auto pb-24 dark:bg-gray-900 min-h-screen relative">
      <div className="flex items-center gap-4 mb-6 mt-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold dark:text-white">Edit Transaction</h2>
      </div>

      <form onSubmit={handleUpdate} className="flex flex-col gap-5">
        
        {/* Amount & Emoji */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
            <input 
              type="number" 
              value={amount} 
              onChange={e => setAmount(e.target.value)} 
              className="w-full pl-10 pr-4 py-4 text-3xl font-bold outline-none bg-white dark:bg-gray-800 dark:text-white rounded-2xl border-2 border-transparent focus:border-blue-500 transition-all" 
            />
          </div>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-20 bg-white dark:bg-gray-800 rounded-2xl text-3xl flex items-center justify-center border-2 border-transparent hover:border-blue-500 shadow-sm transition-all">
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

        {/* Note/Description */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase ml-2">Note</label>
           <input 
             type="text" 
             value={description} 
             onChange={e => setDescription(e.target.value)} 
             className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" 
           />
        </div>

        {/* Date */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase ml-2">Date</label>
           <input 
             type="date" 
             value={date} 
             onChange={e => setDate(e.target.value)} 
             className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" 
           />
        </div>

        {/* Category */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase ml-2">Category</label>
           <input 
             type="text" 
             value={category} 
             onChange={e => setCategory(e.target.value)} 
             className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" 
           />
        </div>

        {/* Type Selector (Added so you can fix mistakes like Income -> Expense) */}
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-2">Type</label>
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mt-1">
            {['Expense', 'Income'].map((t) => (
              <button 
                key={t} 
                type="button"
                onClick={() => setType(t)} 
                className={`flex-1 py-3 rounded-lg font-bold text-sm transition-all ${type === t ? 'bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <button className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors active:scale-95">
          <Save size={20}/> Save Changes
        </button>
      </form>
    </div>
  )
}