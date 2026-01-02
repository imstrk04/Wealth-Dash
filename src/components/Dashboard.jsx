import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Wallet, Settings as SettingsIcon, Trash2, Plus, ArrowRight, Pencil, X, Calendar, CreditCard, FileText, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [userName, setUserName] = useState('User')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedTransaction, setSelectedTransaction] = useState(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return; }

    const [profile, trans, accs] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', user.id).single(),
      supabase.from('transactions').select('*, accounts:accounts!transactions_account_id_fkey(name)').order('date', { ascending: false }).order('created_at', { ascending: false }).limit(50),
      supabase.from('accounts').select('*')
    ])

    if (profile.data) setUserName(profile.data.full_name)
    if (trans.data) setTransactions(trans.data)
    if (accs.data) {
      setAccounts(accs.data)
      setTotalBalance(accs.data.reduce((acc, curr) => curr.balance + acc, 0))
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if(!confirm("Delete this transaction? Balances will be updated.")) return;

    // Enforcement: Verify record exists on server before logic
    const { data: t, error: fetchErr } = await supabase.from('transactions').select('*').eq('id', id).single()
    if (fetchErr || !t) {
      alert("Transaction not found on server. Refreshing list.")
      fetchData() 
      return;
    }

    try {
      if (t.type === 'Transfer' && t.target_account_id) {
         const { data: targetAcc } = await supabase.from('accounts').select('balance').eq('id', t.target_account_id).single()
         if (targetAcc) {
           await supabase.from('accounts').update({ balance: targetAcc.balance - t.amount }).eq('id', t.target_account_id)
         }
      }

      const { data: acc } = await supabase.from('accounts').select('*').eq('id', t.account_id).single()
      if (acc) {
        let newBalance = Number(acc.balance) + (t.type === 'Income' ? -t.amount : t.amount)
        await supabase.from('accounts').update({ balance: newBalance }).eq('id', t.account_id)
      }

      await supabase.from('transactions').delete().eq('id', id)
      setSelectedTransaction(null)
      fetchData() // Hard refresh from server to ensure sync
    } catch (err) {
      console.error(err)
      alert("Failed to delete.")
    }
  }

  const groupedTransactions = transactions.reduce((groups, tx) => {
    const date = tx.date
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
    return groups
  }, {})

  const formatDateHeader = (dateString) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' })
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24 fade-in dark:bg-gray-900 min-h-screen relative text-black dark:text-white">
      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedTransaction(null)}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelectedTransaction(null)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
              <X size={20}/>
            </button>
            <div className="flex flex-col items-center mb-6">
              <div className="text-6xl mb-4 bg-gray-50 dark:bg-gray-700 p-6 rounded-full shadow-inner">
                {selectedTransaction.emoji}
              </div>
              <h2 className={`text-3xl font-bold ${selectedTransaction.type === 'Income' ? 'text-green-500' : 'text-black dark:text-white'}`}>
                {selectedTransaction.type === 'Income' ? '+' : '-'}₹{selectedTransaction.amount.toLocaleString()}
              </h2>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">{selectedTransaction.type}</span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Tag size={20}/></div>
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase">Category</p>
                  <p className="font-bold">{selectedTransaction.category}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 text-gray-400">
                    <CreditCard size={14}/> <span className="text-xs font-bold uppercase">Account</span>
                  </div>
                  <p className="font-bold text-sm truncate">{selectedTransaction.accounts?.name}</p>
                </div>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 text-gray-400">
                    <Calendar size={14}/> <span className="text-xs font-bold uppercase">Date</span>
                  </div>
                  <p className="font-bold text-sm">{selectedTransaction.date}</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-6">
               <Link to={`/edit-transaction/${selectedTransaction.id}`} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-white font-bold transition-colors">
                 <Pencil size={18}/> Edit
               </Link>
               <button onClick={() => handleDelete(selectedTransaction.id)} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-bold transition-colors">
                 <Trash2 size={18}/> Delete
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-6 mt-2">
        <div><h2 className="text-xl font-bold">Hi, {userName}!</h2></div>
        <Link to="/settings" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-white"><SettingsIcon size={20}/></Link>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Total Net Worth</p>
          <h1 className="text-4xl font-bold">₹{totalBalance.toLocaleString()}</h1>
        </div>
        <Wallet className="absolute right-4 bottom-4 text-white opacity-10 rotate-12" size={90} />
      </div>

      <div className="flex justify-between items-end mb-3 ml-1">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">My Accounts</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 pb-2">
        <Link to="/add-account" className="min-w-[80px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 text-gray-400 transition-all">
          <Plus size={24} />
          <span className="text-[10px] font-bold mt-1">Add</span>
        </Link>
        {accounts.map(acc => (
          <div key={acc.id} className="min-w-[160px] bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group flex-shrink-0">
            <div className="flex justify-between items-start mb-2">
               <p className="text-xs font-bold text-gray-500 truncate w-24">{acc.name}</p>
               <Link to="/add-account" state={{ account: acc }} className="text-gray-300 hover:text-blue-500 transition-colors">
                 <Pencil size={14}/>
               </Link>
            </div>
            <p className={`font-bold text-xl ${acc.type === 'Credit Card' ? 'text-red-500' : 'text-green-600'}`}>
              ₹{Math.abs(acc.balance).toLocaleString()}
            </p>
            <p className="text-[10px] text-gray-400">{acc.type === 'Credit Card' ? 'Current Debt' : 'Available Balance'}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-800 dark:text-white text-lg">Recent Activity</h3>
        <Link to="/analytics" className="text-blue-500 text-xs font-bold flex items-center gap-1">View Charts <ArrowRight size={14}/></Link>
      </div>

      <div className="space-y-6">
        {loading ? (
          <p className="text-center text-gray-400 py-8">Loading...</p>
        ) : transactions.length === 0 ? (
          <div className="text-center py-10 opacity-50">
            <p className="text-4xl mb-2">🍃</p>
            <p className="text-sm">No transactions yet.</p>
          </div>
        ) : (
          Object.keys(groupedTransactions).map((date) => (
            <div key={date} className="animate-fade-in">
              <div className="sticky top-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm py-2 z-10 border-b border-gray-100 dark:border-gray-800 mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase pl-1">{formatDateHeader(date)}</h3>
              </div>
              <div className="space-y-3">
                {groupedTransactions[date].map((t) => (
                  <div key={t.id} onClick={() => setSelectedTransaction(t)} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-50 rounded-full">{t.emoji || '💰'}</div>
                      <div>
                        <p className="font-bold text-sm">{t.category}</p>
                        <p className="text-xs text-gray-400 truncate w-28">{t.description || t.accounts?.name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`block font-bold text-base ${t.type === 'Income' ? 'text-green-500' : ''}`}>
                        {t.type === 'Income' ? '+' : '-'}₹{t.amount}
                      </span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase">{t.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}