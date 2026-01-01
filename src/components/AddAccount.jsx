import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, HelpCircle, X } from 'lucide-react' // Added HelpCircle, X

export default function AddAccount() {
  const navigate = useNavigate()
  const [showHelp, setShowHelp] = useState(false) // Help State
  
  const [name, setName] = useState('')
  const [type, setType] = useState('Bank')
  const [balance, setBalance] = useState('') 
  const [limit, setLimit] = useState('')

  const handleAdd = async (e) => {
    e.preventDefault()
    const user = (await supabase.auth.getUser()).data.user
    
    let finalLimit = parseFloat(limit) || 0
    let userInput = parseFloat(balance) || 0
    let dbBalance = userInput

    // Logic: If user says "40k Available" out of "50k Limit", they spent 10k.
    // So Balance = (40k - 50k) = -10k
    if (type === 'Credit Card') {
      dbBalance = userInput - finalLimit
    }

    const { error } = await supabase.from('accounts').insert({ 
      user_id: user.id, 
      name, 
      type, 
      balance: dbBalance,
      credit_limit: type === 'Credit Card' ? finalLimit : 0
    })

    if (!error) { 
      alert('Account Created!')
      navigate(-1) 
    } else {
      alert('Error creating account')
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto dark:bg-gray-900 min-h-screen relative">
      
      {/* --- HELP MODAL --- */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative">
            <button onClick={() => setShowHelp(false)} className="absolute top-4 right-4 text-gray-400 hover:text-red-500"><X/></button>
            <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2"><HelpCircle size={20} className="text-blue-500"/> Account Guide</h3>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
              <div>
                <strong className="text-black dark:text-white block mb-1">🏦 Bank / Cash</strong>
                <p>Enter the current amount you have.</p>
              </div>
              <div>
                <strong className="text-black dark:text-white block mb-1">💳 Credit Card</strong>
                <p>We calculate your debt automatically.</p>
                <ul className="list-disc ml-4 mt-2 space-y-1 text-xs">
                  <li><strong>Total Limit:</strong> Max amount bank gave you.</li>
                  <li><strong>Available:</strong> What the banking app says you can still spend.</li>
                </ul>
                <p className="mt-2 text-xs italic opacity-75">Example: 50k Limit, 40k Available = You owe 10k.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6 mt-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold dark:text-white">New Account</h2>
        </div>
        <button onClick={() => setShowHelp(true)} className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800 rounded-full transition-colors">
          <HelpCircle size={24} />
        </button>
      </div>

      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-2">Account Name</label>
          <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" placeholder="e.g. HDFC Regalia" value={name} onChange={e => setName(e.target.value)} required />
        </div>

        <div>
          <label className="text-xs font-bold text-gray-500 uppercase ml-2">Type</label>
          <select className="w-full p-4 rounded-xl border bg-white dark:bg-gray-800 dark:text-white" value={type} onChange={e => {
            setType(e.target.value); 
            setBalance('');
          }}>
            <option>Bank</option>
            <option>Credit Card</option>
            <option>Cash</option>
          </select>
        </div>

        {/* Credit Card Specific Fields */}
        {type === 'Credit Card' && (
          <div className="animate-fade-in space-y-4">
             <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-2">Total Credit Limit</label>
              <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" type="number" placeholder="e.g. 100000" value={limit} onChange={e => setLimit(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 uppercase ml-2">Remaining Credit (Available)</label>
              <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" type="number" placeholder="e.g. 95000" value={balance} onChange={e => setBalance(e.target.value)} />
              <p className="text-xs text-gray-400 mt-1 ml-2">Check your banking app for "Available Limit".</p>
            </div>
          </div>
        )}

        {/* Bank/Cash Fields */}
        {type !== 'Credit Card' && (
          <div>
            <label className="text-xs font-bold text-gray-500 uppercase ml-2">Current Balance</label>
            <input className="w-full p-4 rounded-xl border dark:bg-gray-800 dark:text-white" type="number" placeholder="0" value={balance} onChange={e => setBalance(e.target.value)} />
          </div>
        )}

        <button className="bg-black dark:bg-blue-600 text-white p-4 rounded-xl font-bold mt-4">Create Account</button>
      </form>
    </div>
  )
}