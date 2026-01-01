import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { User, AtSign, Loader2, AlertCircle, Mail, Lock, Phone } from 'lucide-react'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  
  // Login State
  const [loginIdentifier, setLoginIdentifier] = useState('') // Email OR Username
  
  // Sign Up Specific States
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  
  // Shared State
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    try {
      if (isSignUp) {
        // --- SIGN UP LOGIC (Explicit Fields) ---
        const { data, error } = await supabase.auth.signUp({
          email: email, 
          password: password,
          options: { 
            data: { 
              full_name: fullName, 
              username: username,
              phone: phone
            } 
          }
        })
        
        if (error) throw error
        
        if (data.session) alert(`🎉 Welcome, ${fullName}!`)
        else alert('Account created! Please check your email.')

      } else {
        // --- LOGIN LOGIC (Smart: Email OR Username) ---
        let finalEmail = loginIdentifier.trim()

        // 1. If it's a Username (no '@'), find the email first
        if (!finalEmail.includes('@')) {
          const { data: emailFound, error: lookupError } = await supabase
            .rpc('get_email_by_username', { username_input: finalEmail })
          
          if (lookupError || !emailFound) {
            throw new Error('Username not found.')
          }
          finalEmail = emailFound
        }

        // 2. Log in using the email (either typed directly or found via username)
        const { error } = await supabase.auth.signInWithPassword({ 
          email: finalEmail, 
          password 
        })
        
        if (error) throw error
      }
    } catch (error) {
      setErrorMsg(error.message === "Invalid login credentials" 
        ? "Wrong password or user not found." 
        : error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-blue-600 text-white p-4 transition-all">
      <h1 className="text-4xl font-bold mb-2">WealthDash</h1>
      <p className="mb-8 text-blue-100 opacity-80">Track expenses. Save money.</p>
      
      {/* Toggle Switch */}
      <div className="bg-blue-800 p-1 rounded-full flex mb-6 w-64">
        <button onClick={() => { setIsSignUp(false); setErrorMsg('') }} className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${!isSignUp ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200'}`}>Log In</button>
        <button onClick={() => { setIsSignUp(true); setErrorMsg('') }} className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${isSignUp ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200'}`}>Sign Up</button>
      </div>

      <form onSubmit={handleAuth} className="w-full max-w-sm flex flex-col gap-4">
        
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-400 p-3 rounded-xl flex items-center gap-2 text-sm font-bold text-red-100 animate-fade-in">
            <AlertCircle size={18} />
            {errorMsg}
          </div>
        )}

        {/* --- SIGN UP FIELDS --- */}
        {isSignUp ? (
          <div className="space-y-4 animate-fade-in">
            {/* Full Name (Needed for "Hi, Name" dashboard) */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>

            {/* Username */}
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} required />
            </div>

            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            {/* Phone Number */}
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </div>
          </div>
        ) : (
          /* --- LOGIN FIELD (Smart) --- */
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
               {loginIdentifier.includes('@') ? <Mail size={20}/> : <User size={20}/>}
            </div>
            <input 
              className="p-4 pl-12 w-full rounded-xl text-black" 
              type="text" 
              placeholder="Username or Email" 
              value={loginIdentifier} 
              onChange={(e) => setLoginIdentifier(e.target.value)} 
              required 
            />
          </div>
        )}

        {/* Password (Shared) */}
        <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            <input className="p-4 pl-12 w-full rounded-xl text-black" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        
        <button disabled={loading} className="bg-white text-blue-600 font-bold p-4 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all">
          {loading && <Loader2 className="animate-spin" size={20} />}
          {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
        </button>
      </form>
    </div>
  )
}