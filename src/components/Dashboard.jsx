import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Wallet, Settings as SettingsIcon, Trash2, Plus, ArrowRight, Pencil } from 'lucide-react' // <--- Added Pencil
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [userName, setUserName] = useState('User')
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    // 1. Get User Profile
    const user = (await supabase.auth.getUser()).data.user
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (profile) setUserName(profile.full_name)

    // 2. Get Recent Transactions (Ordered by Date)
    const { data: transData } = await supabase
      .from('transactions')
      .select('*, accounts(name)')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false }) 
      .limit(50) 
    
    if (transData) setTransactions(transData)

    // 3. Get Accounts & Calculate Net Worth
    const { data: accData } = await supabase.from('accounts').select('*')
    if (accData) {
      setAccounts(accData)
      const net = accData.reduce((acc, curr) => curr.balance + acc, 0)
      setTotalBalance(net)
    }
    setLoading(false)
  }

  // --- DELETE LOGIC ---
  const handleDelete = async (id) => {
    if(!confirm("Delete this transaction? Balance will be updated.")) return;

    // 1. Get transaction details
    const { data: t } = await supabase.from('transactions').select('*').eq('id', id).single()
    if (!t) return;

    // 2. Get Account details
    const { data: acc } = await supabase.from('accounts').select('*').eq('id', t.account_id).single()
    let newBalance = Number(acc.balance)
    
    // 3. Reverse the transaction
    newBalance = t.type === 'Expense' ? newBalance + t.amount : newBalance - t.amount

    // 4. Update DB
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', t.account_id)
    await supabase.from('transactions').delete().eq('id', id)
    
    // 5. Refresh Data
    fetchData()
  }

  // --- HELPER: Group Transactions by Date ---
  const groupedTransactions = transactions.reduce((groups, tx) => {
    const date = tx.date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(tx)
    return groups
  }, {})

  // --- HELPER: Format Date Header ---
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
    <div className="p-4 max-w-md mx-auto pb-24 fade-in dark:bg-gray-900 min-h-screen">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6 mt-2">
        <div><h2 className="text-xl font-bold text-gray-800 dark:text-white">Hi, {userName}!</h2></div>
        <Link to="/settings" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-white hover:bg-gray-200 transition-colors"><SettingsIcon size={20}/></Link>
      </div>

      {/* --- NET WORTH CARD --- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-xl mb-8 relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-blue-200 text-sm font-medium mb-1">Total Net Worth</p>
          <h1 className="text-4xl font-bold">₹{totalBalance.toLocaleString()}</h1>
        </div>
        <Wallet className="absolute right-4 bottom-4 text-white opacity-10 rotate-12" size={90} />
      </div>

      {/* --- ACCOUNTS LIST --- */}
      <div className="flex justify-between items-end mb-3 ml-1">
        <h3 className="font-bold text-gray-700 dark:text-gray-300 text-sm">My Accounts</h3>
      </div>
      
      <div className="flex gap-4 overflow-x-auto no-scrollbar mb-8 pb-2">
        <Link to="/add-account" className="min-w-[80px] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-4 text-gray-400 hover:text-blue-500 hover:border-blue-500 transition-all">
          <Plus size={24} />
          <span className="text-[10px] font-bold mt-1">Add</span>
        </Link>

        {accounts.map(acc => (
          <div key={acc.id} className="min-w-[160px] bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group flex-shrink-0">
            <div className="flex justify-between items-start mb-2">
               <p className="text-xs font-bold text-gray-500 dark:text-gray-400 truncate w-24">{acc.name}</p>
               {acc.type === 'Credit Card' && (
                 <button onClick={async () => {
                   const newLim = prompt("Enter new Credit Limit:", acc.credit_limit);
                   if(newLim) {
                     await supabase.from('accounts').update({credit_limit: newLim}).eq('id', acc.id);
                     fetchData();
                   }
                 }} className="text-gray-300 hover:text-blue-500"><SettingsIcon size={12}/></button>
               )}
            </div>
            
            <p className={`font-bold text-xl ${acc.type === 'Credit Card' ? 'text-red-500' : 'text-green-600'}`}>
              {acc.type === 'Credit Card' ? '' : ''}₹{Math.abs(acc.balance).toLocaleString()}
            </p>
            {acc.type === 'Credit Card' && <p className="text-[10px] text-gray-400">Current Debt</p>}

            {/* Credit Utilization Bar */}
            {acc.type === 'Credit Card' && acc.credit_limit > 0 && (
              <div className="mt-3">
                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-1.5 rounded-full ${Math.abs(acc.balance)/acc.credit_limit > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${Math.min((Math.abs(acc.balance)/acc.credit_limit)*100, 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-medium">
                  {Math.round((Math.abs(acc.balance)/acc.credit_limit)*100)}% Used of {parseInt(acc.credit_limit/1000)}k
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- RECENT ACTIVITY (Grouped & Sticky) --- */}
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
            <p className="text-sm dark:text-gray-400">No transactions yet.</p>
          </div>
        ) : (
          Object.keys(groupedTransactions).map((date) => (
            <div key={date} className="animate-fade-in">
              {/* Sticky Header */}
              <div className="sticky top-0 bg-white/90 dark:bg-gray-900/95 backdrop-blur-sm py-2 z-10 border-b border-gray-100 dark:border-gray-800 mb-2">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider pl-1">
                  {formatDateHeader(date)}
                </h3>
              </div>
              
              {/* Transactions List */}
              <div className="space-y-3">
                {groupedTransactions[date].map((t) => (
                  <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-700/50 flex justify-between items-center group">
                    <div className="flex items-center gap-4">
                      <div className="text-2xl w-10 h-10 flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-full">
                        {t.emoji || (t.type === 'Income' ? '💰' : '💸')}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white text-sm">{t.category}</p>
                        <p className="text-xs text-gray-400 w-28 truncate">{t.description || t.accounts?.name}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <span className={`block font-bold text-base ${t.type === 'Income' ? 'text-green-500' : 'text-gray-800 dark:text-white'}`}>
                          {t.type === 'Income' ? '+' : '-'}₹{t.amount}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase">{t.type}</span>
                      </div>
                      
                      {/* Edit Button */}
                      <Link to={`/edit-transaction/${t.id}`} className="p-2 text-gray-300 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                        <Pencil size={16}/>
                      </Link>

                      {/* Delete Button */}
                      <button onClick={() => handleDelete(t.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={16}/>
                      </button>
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