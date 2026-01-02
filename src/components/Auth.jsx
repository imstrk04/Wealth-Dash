import { useState } from 'react'
import { supabase } from '../supabaseClient'
import { User, AtSign, Loader2, AlertCircle, Mail, Lock, Phone } from 'lucide-react'

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [loginIdentifier, setLoginIdentifier] = useState('') 
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [phone, setPhone] = useState('')
  const [fullName, setFullName] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  // --- NEW: OAuth Login Logic ---
  const handleOAuthLogin = async (provider) => {
    setLoading(true)
    setErrorMsg('')
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: window.location.origin // Dynamic redirect based on environment
        }
      })
      if (error) throw error
    } catch (error) {
      setErrorMsg(error.message)
      setLoading(false)
    }
  }

  const handleAuth = async (e) => {
    e.preventDefault()
    if (loading) return // Anti-spam guard
    setLoading(true)
    setErrorMsg('')

    try {
      if (isSignUp) {
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
        let finalEmail = loginIdentifier.trim()
        if (!finalEmail.includes('@')) {
          const { data: emailFound, error: lookupError } = await supabase
            .rpc('get_email_by_username', { username_input: finalEmail })
          if (lookupError || !emailFound) throw new Error('Username not found.')
          finalEmail = emailFound
        }

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
      setLoading(false) // Only reset on error; success redirects
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-blue-600 text-white p-4 transition-all">
      <h1 className="text-4xl font-bold mb-2">WealthDash</h1>
      <p className="mb-8 text-blue-100 opacity-80 text-center">Track expenses. Save money.</p>
      
      <div className="bg-blue-800 p-1 rounded-full flex mb-6 w-64 shadow-inner">
        <button onClick={() => { setIsSignUp(false); setErrorMsg('') }} className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${!isSignUp ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200'}`}>Log In</button>
        <button onClick={() => { setIsSignUp(true); setErrorMsg('') }} className={`flex-1 py-2 rounded-full text-sm font-bold transition-all ${isSignUp ? 'bg-white text-blue-600 shadow-md' : 'text-blue-200'}`}>Sign Up</button>
      </div>

      <form onSubmit={handleAuth} className="w-full max-w-sm flex flex-col gap-4">
        {errorMsg && (
          <div className="bg-red-500/20 border border-red-400 p-3 rounded-xl flex items-center gap-2 text-sm font-bold text-red-100 animate-fade-in">
            <AlertCircle size={18} /> {errorMsg}
          </div>
        )}

        {isSignUp ? (
          <div className="space-y-4 animate-fade-in">
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="text" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} required disabled={loading} />
            </div>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))} required disabled={loading} />
            </div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
              <input className="p-4 pl-12 w-full rounded-xl text-black" type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required disabled={loading} />
            </div>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
               {loginIdentifier.includes('@') ? <Mail size={20}/> : <User size={20}/>}
            </div>
            <input className="p-4 pl-12 w-full rounded-xl text-black" type="text" placeholder="Username or Email" value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} required disabled={loading} />
          </div>
        )}

        <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20}/>
            <input className="p-4 pl-12 w-full rounded-xl text-black" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
        </div>
        
        <button disabled={loading} className="bg-white text-blue-600 font-bold p-4 rounded-xl shadow-lg mt-2 flex justify-center items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all disabled:opacity-70">
          {loading && <Loader2 className="animate-spin" size={20} />}
          {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
        </button>
      </form>

      {/* --- NEW: OAuth UI SECTION --- */}
      <div className="w-full max-w-sm mt-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-blue-400/50"></div>
          <span className="text-xs font-bold text-blue-200 uppercase">Or continue with</span>
          <div className="flex-1 h-px bg-blue-400/50"></div>
        </div>

        <button 
          onClick={() => handleOAuthLogin('google')} 
          disabled={loading}
          className="w-full bg-blue-700/50 border border-blue-400/30 p-4 rounded-xl font-bold flex justify-center items-center gap-3 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {/* Using a simple SVG for Google Logo for clarity */}
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  )
}