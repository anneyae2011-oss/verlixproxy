"use client";

import { useState, useEffect } from "react";
import { 
  BarChart3, 
  Settings, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  LogOut, 
  Loader2, 
  Key, 
  Zap,
  Globe,
  Maximize2
} from "lucide-react";
import clsx from "clsx";

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [newProvider, setNewProvider] = useState({ name: "", endpoint: "", apiKey: "", maxContext: 4096 });
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    checkAuth();
    const interval = setInterval(fetchProviders, 5000); // Polling for real-time stats
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const checkAuth = async () => {
    const res = await fetch("/api/admin/config");
    if (res.ok) {
      setIsLoggedIn(true);
      fetchProviders();
    }
    setLoading(false);
  };

  const fetchProviders = async () => {
    const res = await fetch("/api/admin/config");
    if (res.ok) {
      const data = await res.ok ? await res.json() : [];
      setProviders(data);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/admin/login", {
      method: "POST",
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      setIsLoggedIn(true);
      fetchProviders();
      setError("");
    } else {
      setError("Invalid password");
    }
    setLoading(false);
  };

  const addProvider = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/admin/config", {
      method: "POST",
      body: JSON.stringify(newProvider),
    });
    if (res.ok) {
      fetchProviders();
      setNewProvider({ name: "", endpoint: "", apiKey: "", maxContext: 4096 });
    }
  };

  const deleteProvider = async (id) => {
    if (!confirm("Are you sure?")) return;
    const res = await fetch("/api/admin/config", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchProviders();
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading && !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-pink-500" size={48} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-vh-100 p-4">
        <div className="glass-card max-w-sm w-full">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-pink-500 mb-2">Verlix Admin</h1>
            <p className="text-gray-500 text-sm">Please authenticate to continue</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <input
                type="password"
                placeholder="Enter admin password"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" className="btn-primary w-full">
              Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalTokens = providers.reduce((acc, p) => acc + (p.tokensUsed || 0), 0);
  const totalRequests = providers.reduce((acc, p) => acc + (p.requestsMade || 0), 0);

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar flex flex-col glass-container rounded-none">
        <div className="flex items-center gap-2 mb-10 px-2 mt-4">
          <div className="p-2 bg-pink-100 rounded-lg">
            <Zap className="text-pink-500" size={24} />
          </div>
          <h1 className="text-xl font-bold text-pink-600">VerlixProxy</h1>
        </div>
        
        <nav className="flex-1 space-y-2">
          <a href="#" className="flex items-center gap-3 p-3 bg-pink-50 text-pink-600 rounded-lg font-medium">
            <BarChart3 size={20} /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 p-3 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
            <Settings size={20} /> Settings
          </a>
        </nav>

        <div className="mt-auto border-t border-white/20 pt-6">
          <button 
            onClick={() => { document.cookie = "admin_session=; Max-Age=0"; window.location.reload(); }}
            className="flex items-center gap-3 p-3 text-gray-500 hover:text-red-500 transition-colors w-full"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="max-w-6xl mx-auto">
          <header className="flex justify-between items-center mb-10">
            <div>
              <h2 className="text-2xl font-bold mb-1">Overview</h2>
              <p className="text-gray-500 text-sm">Real-time status of your AI router</p>
            </div>
            <div className="text-sm text-gray-400 bg-white/50 px-4 py-2 rounded-full border border-white/40">
              Live Polling Active
            </div>
          </header>

          <div className="stat-grid">
            <div className="glass-card">
              <p className="stat-label">Total Tokens</p>
              <div className="flex items-end gap-2">
                <p className="stat-value">{totalTokens.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mb-2">Used</p>
              </div>
            </div>
            <div className="glass-card">
              <p className="stat-label">Total Requests</p>
              <div className="flex items-end gap-2">
                <p className="stat-value">{totalRequests.toLocaleString()}</p>
                <p className="text-gray-400 text-sm mb-2">Made</p>
              </div>
            </div>
            <div className="glass-card">
              <p className="stat-label">Providers</p>
              <div className="flex items-end gap-2">
                <p className="stat-value">{providers.length}</p>
                <p className="text-gray-400 text-sm mb-2">Active</p>
              </div>
            </div>
          </div>

          <section className="mb-12">
            <div className="flex justify-between items-end mb-6">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Globe size={18} className="text-pink-400" /> API Providers
              </h3>
            </div>
            
            <div className="provider-list">
              {providers.map((p) => (
                <div key={p.id} className="glass-card p-0 overflow-hidden">
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-gray-700 text-lg">{p.name}</h4>
                        <p className="text-xs text-gray-400 font-mono mt-1">{p.endpoint}</p>
                      </div>
                      <button onClick={() => deleteProvider(p.id)} className="text-gray-300 hover:text-red-400 transition-colors p-2 hover:bg-white/50 rounded-lg">
                        <Trash2 size={18} />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1"><Maximize2 size={12}/> Context</p>
                        <p className="font-semibold text-sm">{p.maxContext === 0 ? "Unlimited" : p.maxContext}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Tokens</p>
                        <p className="font-semibold text-sm">{p.tokensUsed.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Requests</p>
                        <p className="font-semibold text-sm">{p.requestsMade.toLocaleString()}</p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-gray-500">Created</p>
                        <p className="font-semibold text-sm">{new Date(p.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="bg-white/30 border border-white/40 rounded-xl p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-pink-100 rounded-lg">
                          <Key className="text-pink-500" size={14} />
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">Your Proxy Key</p>
                          <p className="font-mono text-sm text-pink-600">{p.proxyKey}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => copyToClipboard(p.proxyKey, p.id)}
                        className="p-2 hover:bg-white text-gray-500 rounded-lg transition-all"
                      >
                        {copiedId === p.id ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Provider Form */}
              <div className="glass-card p-6 border-dashed border-2 border-pink-200 bg-pink-50/20">
                <h4 className="font-bold text-pink-600 mb-6 flex items-center gap-2">
                  <Plus size={18} /> Configure New Provider
                </h4>
                <form onSubmit={addProvider} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase px-1">Provider Name</label>
                      <input
                        type="text"
                        placeholder="e.g. OpenAI GPT-4"
                        className="input-field"
                        required
                        value={newProvider.name}
                        onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase px-1">Endpoint URL</label>
                      <input
                        type="text"
                        placeholder="https://api.openai.com/v1"
                        className="input-field"
                        required
                        value={newProvider.endpoint}
                        onChange={(e) => setNewProvider({...newProvider, endpoint: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase px-1">API Key</label>
                      <input
                        type="password"
                        placeholder="sk-..."
                        className="input-field"
                        required
                        value={newProvider.apiKey}
                        onChange={(e) => setNewProvider({...newProvider, apiKey: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-500 uppercase px-1">Max Context (Tokens)</label>
                      <input
                        type="number"
                        placeholder="4096"
                        className="input-field"
                        value={newProvider.maxContext}
                        onChange={(e) => setNewProvider({...newProvider, maxContext: e.target.value})}
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary flex items-center justify-center gap-2 px-8">
                    <Plus size={18} /> Save Provider & Generate Key
                  </button>
                </form>
              </div>
            </div>
          </section>
        </div>
      </main>

      <style jsx global>{`
        .min-vh-100 { min-height: 100vh; }
        .bg-pink-50 { background-color: #fff1f2; }
        .text-pink-500 { color: #ec4899; }
        .text-pink-600 { color: #db2777; }
        .bg-pink-100 { background-color: #ffe4e6; }
      `}</style>
    </div>
  );
}
