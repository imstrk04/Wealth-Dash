import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, SmilePlus, Search, Loader2 } from 'lucide-react'

const EMOJI_LIST = [
  '🍔', '🍕', '🍺', '☕', '🚗', '🚕', '✈️', '⛽', '🛍️', '🎁', '💡', '🎬', '💊', '📚', 
  '💰', '💸', '🏠', '🐶', '💻', '🏋️', '🏥', '🚌', '👶', '👗', '🥪', '🥗', '🍦', '🍩',
  '🚲', '🚢', '🚆', '🏨', '🔋', '📱', '🎮', '🎧', '🍉', '🍎', '🥦', '🍿', '🎸', '🎨'
]

export default function EditTransaction() {
  const { id } = useParams()
  const navigate = useNavigate()
  const emojiInputRef = useRef(null)
  
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form State
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [date, setDate] = useState('')
  const [type, setType] = useState('')
  const [category, setCategory] = useState('')
  const [necessity, setNecessity] = useState('Needs') // New State
  const [emoji, setEmoji] = useState('💸')
  const [accountId, setAccountId] = useState('')
  const [oldTransaction, setOldTransaction] = useState(null)
  
  // UI State
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState('')

  const filteredEmojis = useMemo(() => {
    return EMOJI_LIST.filter(e => emojiSearch === '' || e.includes(emojiSearch))
  }, [emojiSearch])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    const { data: tx, error } = await supabase.from('transactions').select('*').eq('id', id).single()
    if (error || !tx) { 
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
    if (tx.necessity) setNecessity(tx.necessity) // Load necessity

    setLoading(false)
  }

  const handleNativeEmojiInput = (e) => {
    const val = e.target.value;
    if (val) {
      setEmoji(val.slice(-2).trim() || val.slice(-1));
      setShowEmojiPicker(false);
      e.target.value = '';
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault()
    if (isSubmitting) return;
    if (!amount || !accountId) return alert("Please fill details")
    
    setIsSubmitting(true)
    const newAmount = parseFloat(amount)
    const oldAmount = parseFloat(oldTransaction.amount)
    
    try {
      // --- BALANCE UPDATE LOGIC ---
      if ((newAmount !== oldAmount || type !== oldTransaction.type) && type !== 'Transfer' && oldTransaction.type !== 'Transfer') {
        const { data: acc } = await supabase.from('accounts').select('*').eq('id', accountId).single()
        let currentBalance = Number(acc.balance)

        // 1. Reverse Old Transaction Effect
        if (oldTransaction.type === 'Expense') currentBalance += oldAmount
        else if (oldTransaction.type === 'Income') currentBalance -= oldAmount
        
        // 2. Apply New Transaction Effect
        if (type === 'Expense') currentBalance -= newAmount
        else if (type === 'Income') currentBalance += newAmount

        await supabase.from('accounts').update({ balance: currentBalance }).eq('id', accountId)
      }

      // --- UPDATE TRANSACTION ---
      const { error } = await supabase.from('transactions').update({
        amount: newAmount,
        description,
        date,
        category,
        type, 
        emoji,
        necessity: type === 'Expense' ? necessity : null // Only save necessity for Expense
      }).eq('id', id)

      if (error) throw error
      
      alert("Updated Successfully!")
      navigate(-1)
    } catch (error) {
      console.error(error)
      alert("Error updating transaction")
      setIsSubmitting(false)
    }
  }

  if (loading) return <div className="p-10 text-center dark:text-white">Loading...</div>

  return (
    <div className="p-4 max-w-md mx-auto pb-24 dark:bg-gray-900 min-h-screen relative">
      <input ref={emojiInputRef} type="text" className="fixed -top-40 left-0 opacity-0 pointer-events-none" onChange={handleNativeEmojiInput} />

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
              disabled={isSubmitting}
              className="w-full pl-10 pr-4 py-4 text-3xl font-bold outline-none bg-white dark:bg-gray-800 dark:text-white rounded-2xl border-2 border-transparent focus:border-blue-500 transition-all shadow-sm" 
            />
          </div>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-20 bg-white dark:bg-gray-800 rounded-2xl text-3xl flex items-center justify-center border-2 border-transparent hover:border-blue-500 shadow-sm transition-all">
            {emoji}
          </button>
        </div>

        {/* Custom Emoji Picker (Same as AddTransaction) */}
        {showEmojiPicker && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border dark:border-gray-700 overflow-hidden animate-fade-in mb-4">
            <div className="p-3 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" placeholder="Search" value={emojiSearch} onChange={(e) => setEmojiSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 bg-gray-200/50 dark:bg-gray-900 rounded-lg text-sm outline-none dark:text-white" />
              </div>
            </div>
            <div className="p-4 max-h-60 overflow-y-auto">
              <div className="grid grid-cols-6 gap-2">
                <button type="button" onClick={() => emojiInputRef.current.focus()} className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl p-2 border border-blue-100 dark:border-blue-800/50">
                   <SmilePlus size={20} />
                </button>
                {filteredEmojis.map(e => (
                  <button key={e} type="button" onClick={() => { setEmoji(e); setShowEmojiPicker(false); setEmojiSearch('') }} className={`text-2xl p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 ${emoji === e ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}>{e}</button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Type Selector */}
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

        {/* --- NEW: Necessity Selector (Only for Expenses) --- */}
        {type === 'Expense' && (
          <div className="animate-fade-in">
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Necessity</label>
            <div className="flex gap-2 mt-1">
              {['Needs', 'Wants', 'Savings'].map(opt => (
                <button 
                  type="button" 
                  key={opt} 
                  onClick={() => setNecessity(opt)} 
                  className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${necessity === opt ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-gray-700 dark:text-blue-300 dark:border-gray-500' : 'bg-white text-gray-500 border-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400'}`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Category */}
        <div>
           <label className="text-xs font-bold text-gray-500 uppercase ml-2">Category</label>
           <input type="text" value={category} onChange={e => setCategory(e.target.value)} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div>
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Date</label>
             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" />
           </div>
           <div>
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Note</label>
             <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" />
           </div>
        </div>

        <button disabled={isSubmitting} className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition-colors active:scale-95 disabled:bg-gray-400">
          {isSubmitting ? <><Loader2 className="animate-spin" /> Updating...</> : <><Save size={20}/> Save Changes</>}
        </button>
      </form>
    </div>
  )
}