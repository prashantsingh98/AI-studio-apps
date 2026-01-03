
import React, { useState, useCallback, useMemo } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts';
import { analyzeStatement } from './services/geminiService';
import { Transaction, Category, ExpenseSummary } from './types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from './constants';

const App: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('file');

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    });
  };

  const processAnalysis = async (input: string | { data: string; mimeType: string }) => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeStatement(input);
      setTransactions(prev => [...prev, ...result.transactions]);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = (reader.result as string).split(',')[1];
      await processAnalysis({ data: base64Data, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const handlePasteSubmit = () => {
    if (!pastedText.trim()) return;
    processAnalysis(pastedText);
  };

  const categorySummary = useMemo(() => {
    const summary: Record<string, ExpenseSummary> = {};
    transactions.forEach(t => {
      if (!summary[t.category]) {
        summary[t.category] = {
          category: t.category,
          total: 0,
          count: 0,
          color: CATEGORY_COLORS[t.category] || '#94A3B8'
        };
      }
      summary[t.category].total += t.amount;
      summary[t.category].count += 1;
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [transactions]);

  const totalSpent = useMemo(() => 
    transactions.reduce((sum, t) => sum + t.amount, 0), 
  [transactions]);

  const chartData = useMemo(() => 
    categorySummary.map(s => ({ name: s.category, value: s.total })),
  [categorySummary]);

  const clearData = () => {
    if (window.confirm("Are you sure you want to clear all data?")) {
      setTransactions([]);
      setPastedText('');
      setError(null);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {/* Header */}
      <header className="bg-indigo-600 text-white py-6 px-4 shadow-lg sticky top-0 z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-white p-2 rounded-xl">
              <i className="fa-solid fa-indian-rupee-sign text-indigo-600 text-2xl"></i>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">SmartSpend AI (INR)</h1>
          </div>
          <div className="flex items-center gap-4">
            {transactions.length > 0 && (
              <button 
                onClick={clearData}
                className="bg-indigo-500 hover:bg-indigo-400 text-sm font-semibold px-4 py-2 rounded-lg transition-colors border border-indigo-400"
              >
                Clear All
              </button>
            )}
            <div className="bg-indigo-700 px-4 py-2 rounded-full font-medium text-sm">
              Total: <span className="font-bold ml-1">{formatCurrency(totalSpent)}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 mt-8">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <i className="fa-solid fa-file-import text-indigo-500"></i>
            Import Indian Bank Statement
          </h2>
          
          <div className="flex gap-4 mb-6">
            <button 
              onClick={() => setInputMode('file')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${inputMode === 'file' ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
            >
              <i className="fa-solid fa-image mr-2"></i> Upload Image
            </button>
            <button 
              onClick={() => setInputMode('text')}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${inputMode === 'text' ? 'bg-indigo-50 text-indigo-700 ring-2 ring-indigo-500' : 'bg-gray-50 text-gray-500 border border-gray-200 hover:bg-gray-100'}`}
            >
              <i className="fa-solid fa-paste mr-2"></i> Paste Text
            </button>
          </div>

          {inputMode === 'file' ? (
            <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <i className="fa-solid fa-cloud-arrow-up text-gray-400 text-4xl mb-3"></i>
                <p className="mb-2 text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-gray-400">PNG, JPG or PDF Image (Max 10MB)</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} disabled={loading} />
            </label>
          ) : (
            <div className="space-y-4">
              <textarea 
                className="w-full h-40 p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                placeholder="Paste transaction descriptions from your Indian bank statement here..."
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                disabled={loading}
              />
              <button 
                onClick={handlePasteSubmit}
                disabled={loading || !pastedText.trim()}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-md"
              >
                {loading ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-bolt"></i>}
                {loading ? 'Analyzing with Gemini...' : 'Analyze Text'}
              </button>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl flex items-start gap-3">
              <i className="fa-solid fa-circle-exclamation mt-1"></i>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}
        </div>

        {transactions.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Charts & Summary */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold mb-6">Spending Breakdown</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#94A3B8'} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                
                <div className="space-y-3 mt-4">
                  {categorySummary.map((s) => (
                    <div key={s.category} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                          style={{ backgroundColor: s.color }}
                        >
                          <i className={`fa-solid ${CATEGORY_ICONS[s.category]}`}></i>
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{s.category}</p>
                          <p className="text-xs text-gray-500">{s.count} transactions</p>
                        </div>
                      </div>
                      <p className="font-bold text-gray-700">{formatCurrency(s.total)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold">Transaction History</h3>
                  <span className="text-sm text-gray-500">{transactions.length} items</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Category</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {transactions.map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                            {t.date || 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-900">{t.merchant}</span>
                              <span className="text-xs text-gray-400 truncate max-w-[200px]">{t.originalDescription}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span 
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${CATEGORY_COLORS[t.category]}20`,
                                color: CATEGORY_COLORS[t.category]
                              }}
                            >
                              {t.category}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm font-bold text-gray-900">
                            {formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          !loading && (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
              <div className="bg-indigo-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fa-solid fa-receipt text-indigo-400 text-3xl"></i>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">No Transactions Yet</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                Upload an image or paste statement text to get AI-powered categorization and insights in INR.
              </p>
            </div>
          )
        )}
      </main>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
          <p className="text-indigo-900 font-bold text-lg animate-pulse">Gemini is analyzing your spending...</p>
          <p className="text-indigo-600/60 text-sm mt-2">Extracting merchants, dates, and amounts in INR</p>
        </div>
      )}
    </div>
  );
};

export default App;
