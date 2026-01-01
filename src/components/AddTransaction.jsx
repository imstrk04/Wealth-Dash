import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowLeft } from 'lucide-react'

// The Curated List
const EMOJI_LIST = ['🍔', '🍕', '🍺', '☕', '🚗', '🚕', '✈️', '⛽', '🛍️', '🎁', '💡', '🎬', '💊', '📚', '💰', '💸', '🏠', '🐶', '💻', '🏋️', '🏥', '🚌', '👶', '👗']

export default function AddTransaction() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Expense')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  // Category & Emoji State
  const [category, setCategory] = useState('')
  const [emoji, setEmoji] = useState('💸') 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)

  const [categories, setCategories] = useState([])
  const [isCustomCat, setIsCustomCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [necessity, setNecessity] = useState('Needs')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [accounts, setAccounts] = useState([])

  const DEFAULT_EXPENSE = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education']
  const DEFAULT_INCOME = ['Salary', 'Freelance', 'Investments', 'Gift']

  useEffect(() => {
    fetchAccounts()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (type === 'Expense') { 
      setCategory('Food'); 
      setEmoji('🍔'); 
    } else if (type === 'Income') { 
      setCategory('Salary'); 
      setEmoji('💰'); 
    } else { 
      setCategory('Transfer'); 
      setEmoji('🔄'); 
    }
    setIsCustomCat(false)
    setShowEmojiPicker(false)
  }, [type])

  const fetchAccounts = async () => {
    const { data } = await supabase.from('accounts').select('*')
    setAccounts(data || [])
    if(data && data.length > 0) {
      setAccountId(data[0].id)
      if(data.length > 1) setToAccountId(data[1].id)
    }
  }

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*')
    setCategories(data || [])
  }

  const activeCategories = type === 'Expense' 
    ? [...DEFAULT_EXPENSE, ...categories.filter(c => c.type === 'Expense').map(c => c.name), '+ Add New'] 
    : [...DEFAULT_INCOME, ...categories.filter(c => c.type === 'Income').map(c => c.name), '+ Add New']

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || !accountId) return alert("Please fill details")
    const val = parseFloat(amount)
    const user = (await supabase.auth.getUser()).data.user

    let finalCategory = category
    if (category === '+ Add New') {
      if(!newCatName) return alert("Enter category name")
      finalCategory = newCatName
      await supabase.from('categories').insert({ user_id: user.id, name: newCatName, type })
    }

    if (type === 'Transfer') {
      if (accountId === toAccountId) return alert("Source and Dest account cannot be same")
      const srcAcc = accounts.find(a => a.id === accountId)
      await supabase.from('accounts').update({ balance: srcAcc.balance - val }).eq('id', accountId)
      const destAcc = accounts.find(a => a.id === toAccountId)
      await supabase.from('accounts').update({ balance: destAcc.balance + val }).eq('id', toAccountId)
      await supabase.from('transactions').insert({
        user_id: user.id, account_id: accountId, amount: val, type: 'Transfer',
        description: `Transfer to ${destAcc.name}`, category: 'Transfer', date, emoji: '🔄'
      })
      alert('Transfer Successful!'); setAmount(''); navigate(-1); return 
    }

    const selectedAcc = accounts.find(a => a.id === accountId)
    if (type === 'Expense' && selectedAcc.type !== 'Credit Card' && val > selectedAcc.balance) {
      return alert("Insufficient Funds")
    }

    const { error } = await supabase.from('transactions').insert({ 
      user_id: user.id, account_id: accountId, amount: val, description, 
      category: finalCategory, type, date, necessity: type === 'Expense' ? necessity : null,
      emoji: emoji
    })
    
    if (error) { alert('Error'); return }

    let newBalance = Number(selectedAcc.balance)
    newBalance = type === 'Expense' ? newBalance - val : newBalance + val
    
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId)
    alert('Saved!')
    setAmount('')
    setIsCustomCat(false)
    navigate(-1)
  }

  return (
    // FIX: Added 'w-full overflow-x-hidden' to prevent horizontal scroll/white bar
    <div className="p-4 max-w-md mx-auto pb-24 dark:bg-gray-900 min-h-screen w-full overflow-x-hidden">
      
      <div className="flex items-center gap-4 mb-6 mt-4">
        <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold dark:text-white">Add Transaction</h2>
      </div>
      
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-6">
        {['Expense', 'Income', 'Transfer'].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === t ? 'bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>{t}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 text-3xl font-bold outline-none bg-white dark:bg-gray-800 dark:text-white rounded-2xl border-2 border-transparent focus:border-blue-500 transition-all" placeholder="0" />
          </div>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-20 bg-white dark:bg-gray-800 rounded-2xl text-3xl flex items-center justify-center border-2 border-transparent hover:border-blue-500 transition-all shadow-sm">
            {emoji}
          </button>
        </div>

        {showEmojiPicker && (
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-xl border dark:border-gray-700 grid grid-cols-6 gap-2 animate-fade-in">
            {EMOJI_LIST.map(e => (
              <button 
                key={e} 
                type="button" 
                onClick={() => { setEmoji(e); setShowEmojiPicker(false) }} 
                className={`text-2xl p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-700 transition-colors ${emoji === e ? 'bg-blue-100 dark:bg-gray-600' : ''}`}
              >
                {e}
              </button>
            ))}
          </div>
        )}
        
        {type === 'Expense' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Necessity</label>
            <div className="flex gap-2 mt-1">
              {['Needs', 'Wants', 'Savings'].map(opt => (
                <button type="button" key={opt} onClick={() => setNecessity(opt)} className={`flex-1 py-2 rounded-xl border text-sm font-bold ${necessity === opt ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-gray-700 dark:text-blue-300' : 'bg-white border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'}`}>{opt}</button>
              ))}
            </div>
          </div>
        )}

        {type === 'Transfer' ? (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 flex flex-col gap-4 relative">
             <div className="relative z-10">
               <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">From Account</label>
               <select className="w-full mt-1 p-3 bg-white dark:bg-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 h-12" value={accountId} onChange={e => setAccountId(e.target.value)}>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>
             </div>

             <div className="flex justify-center -my-2 relative z-20">
               <div className="bg-blue-100 dark:bg-gray-700 p-2 rounded-full border-4 border-white dark:border-gray-800 text-blue-600 dark:text-blue-400">
                 <ArrowDown size={20} />
               </div>
             </div>

             <div className="relative z-10">
               <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">To Account</label>
               <select className="w-full mt-1 p-3 bg-white dark:bg-gray-900 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700 h-12" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
                 {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
               </select>
             </div>
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Account</label>
            <div className="flex gap-2 overflow-x-auto mt-2 no-scrollbar">
              {accounts.map(acc => (
                <button type="button" key={acc.id} onClick={() => setAccountId(acc.id)} className={`p-3 rounded-xl border-2 min-w-[100px] text-sm font-bold ${accountId === acc.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'}`}>{acc.name}</button>
              ))}
               <Link to="/add-account" className="p-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 min-w-[50px] flex items-center justify-center text-gray-400">+</Link>
            </div>
          </div>
        )}
        
        {type !== 'Transfer' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Category</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setIsCustomCat(e.target.value === '+ Add New'); }} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl h-12 border border-gray-200 dark:border-gray-700">
                {activeCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {isCustomCat && <input type="text" placeholder="Enter new category..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl h-12 outline-none text-blue-800" />}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div>
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Date</label>
             {/* FIX: Added 'min-w-0 appearance-none' to handle iOS Date Input quirks */}
             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full min-w-0 appearance-none mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" />
           </div>
           <div>
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Note</label>
             <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-3 bg-white dark:bg-gray-800 dark:text-white rounded-xl border border-gray-200 dark:border-gray-700" placeholder="Details..." />
           </div>
        </div>

        <button className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-xl mb-10">
          {type === 'Transfer' ? 'Transfer Funds' : 'Save Transaction'}
        </button>
      </form>
    </div>
  )
}