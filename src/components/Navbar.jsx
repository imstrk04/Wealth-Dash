import { Link } from 'react-router-dom'
import { Home, PlusCircle, PieChart } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-gray-200 pb-safe z-50">
      <div className="flex justify-around items-center h-20 max-w-md mx-auto">
        <Link to="/" className="flex flex-col items-center text-gray-400 hover:text-blue-600"><Home size={24} /><span className="text-[10px] font-bold mt-1">Home</span></Link>
        <Link to="/add" className="bg-blue-600 text-white p-4 rounded-full shadow-lg -mt-8 border-4 border-gray-50"><PlusCircle size={28} /></Link>
        <Link to="/analytics" className="flex flex-col items-center text-gray-400 hover:text-blue-600"><PieChart size={24} /><span className="text-[10px] font-bold mt-1">Insights</span></Link>
      </div>
    </nav>
  )
}