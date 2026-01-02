import { useState, useEffect, useRef, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowDown, ArrowLeft, HelpCircle, X, SmilePlus, Search } from 'lucide-react'

// Expanded Curated List for better searching
const EMOJI_LIST = [
  '🍔', '🍕', '🍺', '☕', '🚗', '🚕', '✈️', '⛽', '🛍️', '🎁', '💡', '🎬', '💊', '📚', 
  '💰', '💸', '🏠', '🐶', '💻', '🏋️', '🏥', '🚌', '👶', '👗', '🥪', '🥗', '🍦', '🍩',
  '🚲', '🚢', '🚆', '🏨', '🔋', '📱', '🎮', '🎧', '🍉', '🍎', '🥦', '🍿', '🎸', '🎨'
]

export default function AddTransaction() {
  const navigate = useNavigate()
  const emojiInputRef = useRef(null)
  const [showHelp, setShowHelp] = useState(false)
  
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('Expense')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  
  const [category, setCategory] = useState('')
  const [emoji, setEmoji] = useState('💸') 
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [emojiSearch, setEmojiSearch] = useState('') // New search state

  const [categories, setCategories] = useState([])
  const [isCustomCat, setIsCustomCat] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [necessity, setNecessity] = useState('Needs')
  const [accountId, setAccountId] = useState('')
  const [toAccountId, setToAccountId] = useState('')
  const [accounts, setAccounts] = useState([])

  const DEFAULT_EXPENSE = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Health', 'Education']
  const DEFAULT_INCOME = ['Salary', 'Freelance', 'Investments', 'Gift']

  // Filter emojis based on search
  const filteredEmojis = useMemo(() => {
    return EMOJI_LIST.filter(e => emojiSearch === '' || e.includes(emojiSearch))
  }, [emojiSearch])

  useEffect(() => {
    fetchAccounts()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (type === 'Expense') { setCategory('Food'); setEmoji('🍔'); } 
    else if (type === 'Income') { setCategory('Salary'); setEmoji('💰'); } 
    else { setCategory('Transfer'); setEmoji('🔄'); }
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

  const handleNativeEmojiInput = (e) => {
    const val = e.target.value;
    if (val) {
      setEmoji(val.slice(-2).trim() || val.slice(-1));
      setShowEmojiPicker(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!amount || !accountId) return alert("Please fill details")
    const val = parseFloat(amount)
    const { data: { user } } = await supabase.auth.getUser()

    let finalCategory = category
    if (category === '+ Add New') {
      if(!newCatName) return alert("Enter category name")
      finalCategory = newCatName
      await supabase.from('categories').insert({ user_id: user.id, name: newCatName, type })
    }

    if (type === 'Transfer') {
      if (accountId === toAccountId) return alert("Source and Dest account cannot be same")
      const srcAcc = accounts.find(a => a.id === accountId)
      const destAcc = accounts.find(a => a.id === toAccountId)
      await supabase.from('accounts').update({ balance: srcAcc.balance - val }).eq('id', accountId)
      await supabase.from('accounts').update({ balance: destAcc.balance + val }).eq('id', toAccountId)
      
      await supabase.from('transactions').insert({
        user_id: user.id, account_id: accountId, target_account_id: toAccountId,
        amount: val, type: 'Transfer', description: `Transfer to ${destAcc.name}`, 
        category: 'Transfer', date, emoji: '🔄'
      })
      alert('Transfer Successful!'); navigate(-1); return 
    }

    const selectedAcc = accounts.find(a => a.id === accountId)
    const { error } = await supabase.from('transactions').insert({ 
      user_id: user.id, account_id: accountId, amount: val, description, 
      category: finalCategory, type, date, necessity: type === 'Expense' ? necessity : null,
      emoji: emoji
    })
    
    if (!error) {
      let newBalance = type === 'Expense' ? Number(selectedAcc.balance) - val : Number(selectedAcc.balance) + val
      await supabase.from('accounts').update({ balance: newBalance }).eq('id', accountId)
      alert('Saved!')
      navigate(-1)
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24 dark:bg-gray-900 min-h-screen relative">
      
      <input 
        ref={emojiInputRef}
        type="text" 
        className="fixed -top-40 left-0 opacity-0 pointer-events-none" 
        onChange={handleNativeEmojiInput}
      />

      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold dark:text-white">Add Transaction</h2>
        </div>
        <button onClick={() => setShowHelp(true)} className="p-2 text-blue-600 dark:text-blue-400">
          <HelpCircle size={24} />
        </button>
      </div>
      
      <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-6">
        {['Expense', 'Income', 'Transfer'].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${type === t ? 'bg-white shadow-md text-blue-600 dark:bg-gray-700 dark:text-blue-400' : 'text-gray-500'}`}>{t}</button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        <div className="flex gap-4">
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">₹</span>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="w-full pl-10 pr-4 py-4 text-3xl font-bold bg-white dark:bg-gray-800 dark:text-white rounded-2xl shadow-sm outline-none" placeholder="0" />
          </div>
          <button type="button" onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-20 bg-white dark:bg-gray-800 rounded-2xl text-3xl flex items-center justify-center shadow-sm border-2 border-transparent active:border-blue-500">
            {emoji}
          </button>
        </div>

        {/* --- STYLED EMOJI PICKER --- */}
        {showEmojiPicker && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border dark:border-gray-700 overflow-hidden animate-fade-in">
            {/* Search Header */}
            <div className="p-3 border-b dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={emojiSearch}
                  onChange={(e) => setEmojiSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-200/50 dark:bg-gray-900 rounded-lg text-sm outline-none dark:text-white"
                />
              </div>
            </div>

            <div className="p-4 max-h-60 overflow-y-auto">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Recently Used & Curated</p>
              <div className="grid grid-cols-6 gap-2">
                {/* Native Trigger */}
                <button 
                  type="button" 
                  onClick={() => emojiInputRef.current.focus()} 
                  className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl p-2 border border-blue-100 dark:border-blue-800/50"
                >
                  <SmilePlus size={20} />
                  <span className="text-[9px] font-bold mt-1">System</span>
                </button>

                {filteredEmojis.map(e => (
                  <button 
                    key={e} 
                    type="button" 
                    onClick={() => { setEmoji(e); setShowEmojiPicker(false); setEmojiSearch('') }} 
                    className={`text-2xl p-2 rounded-xl transition-all active:scale-90 hover:bg-gray-100 dark:hover:bg-gray-700 ${emoji === e ? 'bg-blue-100 dark:bg-blue-900/40' : ''}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t dark:border-gray-700 flex items-center gap-3">
               <div className="text-3xl">{emoji}</div>
               <div className="text-xs font-medium text-gray-500 dark:text-gray-400">Current Selection</div>
            </div>
          </div>
        )}

        {/* ... Rest of form ... */}
        {type === 'Expense' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Necessity</label>
            <div className="flex gap-2 mt-1">
              {['Needs', 'Wants', 'Savings'].map(opt => (
                <button type="button" key={opt} onClick={() => setNecessity(opt)} className={`flex-1 py-2 rounded-xl border text-sm font-bold ${necessity === opt ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-gray-700 dark:text-blue-300' : 'bg-white text-gray-500 dark:bg-gray-800 dark:border-gray-700'}`}>{opt}</button>
              ))}
            </div>
          </div>
        )}

        {type === 'Transfer' ? (
          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-xl border dark:border-gray-700 flex flex-col gap-4">
             <select className="w-full p-3 dark:bg-gray-900 dark:text-white rounded-xl" value={accountId} onChange={e => setAccountId(e.target.value)}>
               {accounts.map(a => <option key={a.id} value={a.id}>From: {a.name}</option>)}
             </select>
             <div className="flex justify-center -my-2"><ArrowDown className="text-blue-500"/></div>
             <select className="w-full p-3 dark:bg-gray-900 dark:text-white rounded-xl" value={toAccountId} onChange={e => setToAccountId(e.target.value)}>
               {accounts.map(a => <option key={a.id} value={a.id}>To: {a.name}</option>)}
             </select>
          </div>
        ) : (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Account</label>
            <div className="flex gap-2 overflow-x-auto mt-2 no-scrollbar">
              {accounts.map(acc => (
                <button type="button" key={acc.id} onClick={() => setAccountId(acc.id)} className={`p-3 rounded-xl border-2 min-w-[100px] text-sm font-bold ${accountId === acc.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white dark:bg-gray-800 dark:border-gray-700'}`}>{acc.name}</button>
              ))}
            </div>
          </div>
        )}
        
        {type !== 'Transfer' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Category</label>
            <select value={category} onChange={e => { setCategory(e.target.value); setIsCustomCat(e.target.value === '+ Add New'); }} className="w-full mt-1 p-3 dark:bg-gray-800 dark:text-white rounded-xl border dark:border-gray-700">
                {activeCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {isCustomCat && <input type="text" placeholder="Enter new category..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className="w-full mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl outline-none" />}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
           <div>
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Date</label>
             <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full mt-1 p-3 dark:bg-gray-800 dark:text-white rounded-xl border dark:border-gray-700" />
           </div>
           <div>
             <label className="text-xs font-bold text-gray-500 uppercase ml-2">Note</label>
             <input type="text" value={description} onChange={e => setDescription(e.target.value)} className="w-full mt-1 p-3 dark:bg-gray-800 dark:text-white rounded-xl border dark:border-gray-700" placeholder="Details..." />
           </div>
        </div>

        <button className="bg-blue-600 text-white py-4 rounded-xl font-bold text-lg mt-4 shadow-xl mb-10 transition-all active:scale-95">
          Save Transaction
        </button>
      </form>
    </div>
  )
}