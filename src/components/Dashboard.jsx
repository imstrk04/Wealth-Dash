import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { Wallet, Settings as SettingsIcon, Trash2, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Dashboard() {
  const [transactions, setTransactions] = useState([])
  const [totalBalance, setTotalBalance] = useState(0)
  const [userName, setUserName] = useState('User')
  const [accounts, setAccounts] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    // 1. Get User Profile
    const user = (await supabase.auth.getUser()).data.user
    const { data: profile } = await supabase.from('profiles').select('full_name').eq('id', user.id).single()
    if (profile) setUserName(profile.full_name)

    // 2. Get Recent Transactions
    const { data: transData } = await supabase.from('transactions').select('*, accounts(name)').order('date', { ascending: false }).limit(20)
    if (transData) setTransactions(transData)

    // 3. Get Accounts & Calculate Net Worth
    const { data: accData } = await supabase.from('accounts').select('*')
    if (accData) {
      setAccounts(accData)
      // Net Worth = (Bank + Cash) - (Credit Card Debt)
      // Note: Credit Card balances are stored as negative numbers (e.g., -5000) so we just sum everything normally.
      // However, if you store them as positive debt, we subtract. 
      // Based on previous logic: Bank is positive, CC debt is negative. So we sum them.
      const net = accData.reduce((acc, curr) => curr.balance + acc, 0)
      setTotalBalance(net)
    }
  }

  // --- DELETE LOGIC (Safe Reverse) ---
  const handleDelete = async (id) => {
    if(!confirm("Delete this transaction? Balance will be updated.")) return;

    // 1. Get transaction details
    const { data: t } = await supabase.from('transactions').select('*').eq('id', id).single()
    if (!t) return;

    // 2. Get Account details
    const { data: acc } = await supabase.from('accounts').select('*').eq('id', t.account_id).single()
    let newBalance = Number(acc.balance)
    
    // 3. Reverse the transaction
    if (acc.type === 'Credit Card') {
      // If we delete an Expense (which made balance more negative), we ADD amount back.
      // If we delete a Payment/Income (which made balance positive), we SUBTRACT.
      newBalance = t.type === 'Expense' ? newBalance + t.amount : newBalance - t.amount
    } else {
      // Bank/Cash: Expense lowered balance, so delete raises it.
      newBalance = t.type === 'Expense' ? newBalance + t.amount : newBalance - t.amount
    }

    // 4. Update DB
    await supabase.from('accounts').update({ balance: newBalance }).eq('id', t.account_id)
    await supabase.from('transactions').delete().eq('id', id)
    
    // 5. Refresh Data
    fetchData()
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24 fade-in dark:bg-gray-900 min-h-screen">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-center mb-6">
        <div><h2 className="text-xl font-bold text-gray-800 dark:text-white">Hi, {userName}!</h2></div>
        <Link to="/settings" className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-white"><SettingsIcon size={20}/></Link>
      </div>

      {/* --- NET WORTH CARD --- */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-3xl shadow-xl mb-6 relative overflow-hidden">
        <div className="relative z-10"><p className="text-blue-200 text-sm font-medium mb-1">Net Worth</p><h1 className="text-4xl font-bold">₹{totalBalance.toLocaleString()}</h1></div>
        <Wallet className="absolute right-4 bottom-4 text-blue-500 opacity-20" size={80} />
      </div>

      {/* --- ACCOUNTS LIST (With Edit Limit & Utilization) --- */}
      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm ml-1">My Accounts</h3>
      <div className="flex gap-4 overflow-x-auto no-scrollbar mb-6 pb-2">
        <Link to="/add-account" className="min-w-[80px] flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-4 text-gray-400 hover:text-blue-500">
          <Plus size={24} />
          <span className="text-[10px] font-bold mt-1">Add New</span>
        </Link>

        {accounts.map(acc => (
          <div key={acc.id} className="min-w-[150px] bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative group">
            <div className="flex justify-between items-start">
               <p className="text-xs text-gray-500 dark:text-gray-400 truncate w-20">{acc.name}</p>
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
            
            <p className={`font-bold text-lg ${acc.type === 'Credit Card' ? 'text-red-500' : 'text-green-600'}`}>
              {acc.type === 'Credit Card' ? '-' : ''}₹{Math.abs(acc.balance).toLocaleString()}
            </p>

            {/* Credit Utilization Bar */}
            {acc.type === 'Credit Card' && acc.credit_limit > 0 && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                  <div className="bg-red-500 h-1.5 rounded-full" style={{ width: `${Math.min((Math.abs(acc.balance)/acc.credit_limit)*100, 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  {Math.round((Math.abs(acc.balance)/acc.credit_limit)*100)}% Used of {parseInt(acc.credit_limit/1000)}k
                </p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* --- RECENT ACTIVITY --- */}
      <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 text-lg">Recent Activity</h3>
      <div className="flex flex-col gap-3">
        {transactions.map((t) => (
          <div key={t.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-50 dark:border-gray-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="bg-blue-50 dark:bg-gray-700 p-3 rounded-full text-lg">
                {t.emoji || '📄'}
              </div>
              <div>
                <p className="font-bold text-gray-800 dark:text-white text-sm">{t.description || t.category}</p>
                <p className="text-xs text-gray-400">{t.date} • {t.accounts?.name}</p>
              </div>
            </div>
            <div className="text-right">
              <span className={`block font-bold ${t.type === 'Income' ? 'text-green-600' : 'text-black dark:text-gray-300'}`}>{t.type === 'Income' ? '+' : '-'}₹{t.amount}</span>
              <button onClick={() => handleDelete(t.id)} className="p-2 -mr-2 text-gray-300 hover:text-red-500"><Trash2 size={16}/></button>
            </div>
          </div>
        ))}
        {transactions.length === 0 && <p className="text-center text-gray-400">No transactions yet.</p>}
      </div>
    </div>
  )
}