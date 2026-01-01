import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../supabaseClient'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip, Legend, YAxis } from 'recharts'
import { Download, Loader2, ArrowLeft } from 'lucide-react' // Added ArrowLeft
import { useNavigate } from 'react-router-dom' // Added
import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'

const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export default function Analytics() {
  const navigate = useNavigate() // Hook
  const [data, setData] = useState([])
  const [viewMode, setViewMode] = useState('Month') 
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [chartPrefs, setChartPrefs] = useState({ breakdown: true, trend: true, incomeVsExpense: true, cardVsBank: true, categoryBar: true })
  
  const [compMonthA, setCompMonthA] = useState(new Date().toISOString().slice(0, 7))
  const [compMonthB, setCompMonthB] = useState(new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().slice(0, 7))

  useEffect(() => {
    const fetchAll = async () => {
      const { data } = await supabase.from('transactions').select('*, accounts(name, type)').order('date', { ascending: true })
      if(data) setData(data)
    }
    fetchAll()
    const saved = localStorage.getItem('chartPrefs')
    if(saved) setChartPrefs(JSON.parse(saved))
  }, [])

  // --- FILTER LOGIC ---
  const filteredData = useMemo(() => {
    return data.filter(t => {
      const tDate = new Date(t.date);
      const sel = new Date(selectedDate);
      if (viewMode === 'Week') {
        const start = new Date(sel); start.setDate(sel.getDate() - sel.getDay());
        const end = new Date(start); end.setDate(start.getDate() + 6);
        return tDate >= start && tDate <= end;
      }
      if (viewMode === 'Month') return tDate.getMonth() === sel.getMonth() && tDate.getFullYear() === sel.getFullYear();
      if (viewMode === 'Year') return tDate.getFullYear() === sel.getFullYear();
      return true;
    });
  }, [data, viewMode, selectedDate]);

  // --- CHART DATA PREP ---
  const categoryData = useMemo(() => {
    const expenses = filteredData.filter(t => t.type === 'Expense');
    const grouped = expenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
  }, [filteredData]);

  const bankVsCardData = useMemo(() => {
    const expenses = filteredData.filter(t => t.type === 'Expense');
    const grouped = expenses.reduce((acc, curr) => {
      const type = curr.accounts?.type === 'Credit Card' ? 'Credit Card' : 'Bank/Cash';
      acc[type] = (acc[type] || 0) + curr.amount;
      return acc;
    }, {});
    return Object.keys(grouped).map(key => ({ name: key, value: grouped[key] }));
  }, [filteredData]);

  const comparisonData = useMemo(() => {
    const getMonthData = (monthStr) => {
      const [y, m] = monthStr.split('-');
      const txns = data.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === parseInt(y) && (d.getMonth() + 1) === parseInt(m);
      });
      const income = txns.filter(t => t.type === 'Income').reduce((sum, t) => sum + t.amount, 0);
      const expense = txns.filter(t => t.type === 'Expense').reduce((sum, t) => sum + t.amount, 0);
      return { income, expense };
    };
    const dataA = getMonthData(compMonthA);
    const dataB = getMonthData(compMonthB);
    return [
      { name: 'Income', [compMonthA]: dataA.income, [compMonthB]: dataB.income },
      { name: 'Expense', [compMonthA]: dataA.expense, [compMonthB]: dataB.expense },
    ];
  }, [data, compMonthA, compMonthB]);


  // --- PDF EXPORT FUNCTION ---
  const downloadPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(18)
      doc.text(`WealthDash Report - ${viewMode} View`, 14, 20)
      doc.setFontSize(12)
      doc.setTextColor(100)
      doc.text(`Period: ${selectedDate}`, 14, 28)
      
      const totalInc = filteredData.filter(t => t.type === 'Income').reduce((a,c)=>a+c.amount, 0)
      const totalExp = filteredData.filter(t => t.type === 'Expense').reduce((a,c)=>a+c.amount, 0)
      
      doc.text(`Total Income: ${totalInc}`, 14, 38)
      doc.text(`Total Expense: ${totalExp}`, 80, 38)

      const tableData = filteredData.map(t => [
        t.date, 
        t.description || t.category, 
        t.category, 
        t.type, 
        t.accounts?.name || '-',
        `${t.type === 'Expense' ? '-' : '+'} ${t.amount}`
      ])

      autoTable(doc, {
        head: [['Date', 'Description', 'Category', 'Type', 'Account', 'Amount']],
        body: tableData,
        startY: 45,
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] },
      })

      doc.save(`WealthDash_Report_${selectedDate}.pdf`)
      
    } catch (err) {
      console.error(err)
      alert("Failed to generate PDF. Check console for details.")
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto pb-24 dark:bg-gray-900 min-h-screen">
      
      {/* HEADER WITH BACK BUTTON & TITLE */}
      <div className="flex justify-between items-center mb-6 mt-2">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Insights</h2>
        </div>
        <button onClick={downloadPDF} className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg text-xs font-bold border border-red-100 shadow-sm active:scale-95 transition-transform">
          <Download size={16}/> PDF
        </button>
      </div>

      <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-xl mb-6">
        {['Week', 'Month', 'Year'].map(v => (
          <button key={v} onClick={() => setViewMode(v)} className={`flex-1 py-2 text-sm font-bold rounded-lg ${viewMode === v ? 'bg-white shadow-sm text-blue-600 dark:bg-gray-700 dark:text-white' : 'text-gray-500'}`}>{v}</button>
        ))}
      </div>
      
      <div className="mb-6">
        {viewMode === 'Week' && <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:text-white" />}
        {viewMode === 'Month' && <input type="month" value={selectedDate.slice(0, 7)} onChange={e => setSelectedDate(e.target.value + '-01')} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:text-white" />}
        {viewMode === 'Year' && <select value={new Date(selectedDate).getFullYear()} onChange={e => setSelectedDate(`${e.target.value}-01-01`)} className="w-full p-3 rounded-xl border dark:bg-gray-800 dark:text-white">{[2023, 2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}</select>}
      </div>

      {chartPrefs.categoryBar && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-sm">Category Comparison</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} stroke="#888"/>
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartPrefs.cardVsBank && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-sm">Card vs Bank Spending</h3>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={bankVsCardData} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={5} dataKey="value">
                  {bankVsCardData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.name === 'Credit Card' ? '#ef4444' : '#10b981'} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartPrefs.breakdown && (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
          <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-2 text-sm">Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {categoryData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6">
        <h3 className="font-bold text-gray-700 dark:text-gray-200 mb-4 text-lg">Compare Periods</h3>
        
        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Month A</label>
            <input type="month" value={compMonthA} onChange={e => setCompMonthA(e.target.value)} className="w-full p-2 text-sm rounded-lg border dark:bg-gray-900 dark:text-white" />
          </div>
          <div className="flex-1">
            <label className="text-[10px] font-bold text-gray-400 uppercase">Month B</label>
            <input type="month" value={compMonthB} onChange={e => setCompMonthB(e.target.value)} className="w-full p-2 text-sm rounded-lg border dark:bg-gray-900 dark:text-white" />
          </div>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData}>
              <XAxis dataKey="name" stroke="#888" />
              <YAxis hide />
              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '10px'}}/>
              <Legend />
              <Bar dataKey={compMonthA} fill="#3b82f6" name={compMonthA} radius={[4, 4, 0, 0]} />
              <Bar dataKey={compMonthB} fill="#10b981" name={compMonthB} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}