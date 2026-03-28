"use client";

import { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  LogOut, 
  Loader2, 
  Zap,
  Globe,
  Menu,
  X,
  Edit2,
  Lock,
  Wifi,
  Settings,
  BarChart2,
  List,
  Activity,
  Shield,
  RefreshCcw,
  AlertCircle
} from "lucide-react";
import clsx from "clsx";

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProvider, setNewProvider] = useState({ 
    name: "", 
    endpoint: "", 
    apiKey: "", 
    maxContext: 4096,
    rpmLimit: 0,
    rpdLimit: 0,
    allowedModels: "" 
  });
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
    const interval = setInterval(fetchProviders, 10000); 
    return () => clearInterval(interval);
  }, [isLoggedIn]);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        setIsLoggedIn(true);
        fetchProviders();
      }
    } catch (e) {}
    setLoading(false);
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (e) {}
  };

  const fetchModels = async (providerId) => {
    setLoadingModels(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/models?providerId=${providerId}`);
      const data = await res.json();
      if (res.ok) {
        setModels(data.data || []);
      } else {
        setError(data.error || "Failed to reach provider. Check endpoint and key.");
      }
    } catch (e) {
      setError("Network error: Could not connect to internal models API.");
    } finally {
      setLoadingModels(false);
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
      setError("Incorrect Master Password");
    }
    setLoading(false);
  };

  const saveProvider = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      const method = editingProvider ? "PUT" : "POST";
      const payload = { ...newProvider };
      if (editingProvider) payload.id = editingProvider.id;

      const res = await fetch("/api/admin/config", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchProviders();
        setShowAddModal(false);
        setEditingProvider(null);
        setModels([]);
        setNewProvider({ name: "", endpoint: "", apiKey: "", maxContext: 4096, rpmLimit: 0, rpdLimit: 0, allowedModels: "" });
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save configuration.");
      }
    } catch (e) {
      setError("Network error occurred while saving.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProvider = async (id) => {
    if (!confirm("Confirm removal of this AI node?")) return;
    const res = await fetch("/api/admin/config", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    });
    if (res.ok) fetchProviders();
  };

  const toggleModel = (modelId) => {
    const current = newProvider.allowedModels ? newProvider.allowedModels.split(",").filter(m => m.trim()) : [];
    let next;
    if (current.includes(modelId)) {
      next = current.filter(m => m !== modelId);
    } else {
      next = [...current, modelId];
    }
    setNewProvider({ ...newProvider, allowedModels: next.join(",") });
  };

  const toggleAllModels = () => {
    if (newProvider.allowedModels.split(",").filter(m => m.trim()).length >= models.length) {
      setNewProvider({ ...newProvider, allowedModels: "" });
    } else {
      setNewProvider({ ...newProvider, allowedModels: models.map(m => m.id).join(",") });
    }
  };

  if (loading && !isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fff5f7]">
        <Loader2 className="animate-spin text-[#ff8fa3]" size={40} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[#fff5f7]">
        <div className="w-full max-w-md bg-white p-12 rounded-[2.5rem] border border-[#ffe4e6] shadow-xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#fff0f3] rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="text-[#ff8fa3]" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">VerlixProxy</h1>
            <p className="text-gray-400 font-medium text-sm">Organized AI Management</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Access Key</label>
              <input
                type="password"
                placeholder="••••••••"
                className="input-v3"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2">
              <AlertCircle size={14}/> {error}
            </div>}
            <button type="submit" className="btn-v3 w-full py-4 text-lg">
              Unlock Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalTokens = providers.reduce((acc, p) => acc + (p.tokensUsed || 0), 0);
  const totalRequests = providers.reduce((acc, p) => acc + (p.requestsMade || 0), 0);

  return (
    <div className="app-layout">
      {/* Sidebar V3 */}
      <aside className={clsx(
        "sidebar-v3 lg:flex",
        isSidebarOpen ? "fixed inset-0 z-50 flex" : "hidden"
      )}>
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-[#ff8fa3] rounded-xl text-white">
            <Zap size={24} />
          </div>
          <h2 className="text-2xl font-extrabold text-[#4a4a4a]">Verlix</h2>
        </div>

        <nav className="space-y-4 flex-1">
          <button className="flex items-center gap-4 w-full p-4 bg-[#fff0f3] text-[#ff8fa3] rounded-2xl font-bold">
            <BarChart2 size={20} /> Dashboard
          </button>
          <button className="flex items-center gap-4 w-full p-4 text-gray-400 hover:bg-[#fffafa] rounded-2xl font-bold transition-all">
            <List size={20} /> Mesh Nodes
          </button>
          <button className="flex items-center gap-4 w-full p-4 text-gray-400 hover:bg-[#fffafa] rounded-2xl font-bold transition-all">
            <Shield size={20} /> Security
          </button>
        </nav>

        <div className="pt-8 border-t border-[#ffe4e6]">
          <button 
            onClick={() => { document.cookie = "admin_session=; Max-Age=0"; window.location.reload(); }}
            className="flex items-center gap-4 p-4 text-gray-400 hover:text-red-400 font-bold transition-all"
          >
            <LogOut size={20} /> De-auth
          </button>
        </div>

        {isSidebarOpen && <button onClick={() => setIsSidebarOpen(false)} className="absolute top-8 right-8 text-gray-400 lg:hidden"><X size={24}/></button>}
      </aside>

      {/* Main Content V3 */}
      <main className="content-v3">
        <header className="flex flex-col md:flex-row md:justify-between md:items-start gap-6 mb-16">
          <div className="fade-in">
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Network Control</h1>
            <p className="text-gray-400 font-medium">Neat and organized overview of active AI Gateways.</p>
          </div>
          <div className="flex gap-4">
            <button className="lg:hidden btn-ghost p-4 rounded-2xl" onClick={() => setIsSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <button 
              onClick={() => { setEditingProvider(null); setNewProvider({ name: "", endpoint: "", apiKey: "", maxContext: 4096, rpmLimit: 0, rpdLimit: 0, allowedModels: "" }); setModels([]); setShowAddModal(true); }}
              className="btn-v3 px-8 shadow-xl shadow-pink-100"
            >
              <Plus size={20} /> Add Provider
            </button>
          </div>
        </header>

        {/* Organized Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {[
            { label: "Token Data Flow", value: totalTokens.toLocaleString(), icon: <Activity size={20}/> },
            { label: "Request Count", value: totalRequests.toLocaleString(), icon: <Globe size={20}/> },
            { label: "Active Gateways", value: providers.length, icon: <Settings size={20}/> }
          ].map((stat, i) => (
            <div key={i} className="card-v3 flex flex-col items-center text-center">
              <div className="p-4 bg-[#fff0f3] text-[#ff8fa3] rounded-3xl mb-4">
                {stat.icon}
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-extrabold text-gray-800">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Neat Provider List */}
        <section>
          <div className="flex items-center gap-4 mb-10">
            <div className="w-1 h-8 bg-[#ff8fa3] rounded-full"></div>
            <h3 className="text-xl font-extrabold text-gray-800">Operational Mesh Nodes</h3>
          </div>

          <div className="section-grid">
            {providers.map((p) => (
              <div key={p.id} className="card-v3 fade-in group">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className={clsx("w-2 h-2 rounded-full", p.enabled ? "bg-green-400" : "bg-gray-300")}></div>
                    <span className="font-bold text-lg text-gray-700">{p.name}</span>
                  </div>
                  <div className="flex gap-1 opacity-10 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => { startEdit(p); }} className="p-2 text-gray-400 hover:text-pink-500 hover:bg-[#fff5f7] rounded-lg">
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => deleteProvider(p.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Endpoint</span>
                    <span className="font-mono text-[10px] bg-gray-50 px-2 py-1 rounded truncate max-w-[150px]">{p.endpoint}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400 font-medium">Limits</span>
                    <div className="flex gap-2 font-bold text-pink-400">
                      <span>{p.rpmLimit || "∞"} RPM</span>
                      <span>{p.rpdLimit || "∞"} RPD</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-[#fffafa] border border-[#ffe4e6] rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <Key size={14} className="text-[#ff8fa3] shrink-0" />
                    <span className="font-mono text-xs text-gray-500 truncate">{p.proxyKey}</span>
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(p.proxyKey); setCopiedId(p.id); setTimeout(()=>setCopiedId(null), 2000); }}
                    className="text-[#ff8fa3] hover:scale-110 active:scale-95 transition-all p-2"
                  >
                    {copiedId === p.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Neat Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/5 backdrop-blur-sm" onClick={() => setShowAddModal(false)}></div>
          <div className="card-v3 w-full max-w-2xl relative z-10 p-10 max-h-[90vh] overflow-y-auto">
            <header className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-extrabold text-gray-800">{editingProvider ? "Edit Gateway" : "New Gateway"}</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={20}/>
              </button>
            </header>

            <form onSubmit={saveProvider} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Node Nickname</label>
                  <input type="text" className="input-v3" placeholder="OpenRouter Primary" required value={newProvider.name} onChange={e => setNewProvider({...newProvider, name: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">API Endpoint</label>
                  <input type="url" className="input-v3" placeholder="https://..." required value={newProvider.endpoint} onChange={e => setNewProvider({...newProvider, endpoint: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Upstream Key</label>
                  <input type="password" className="input-v3" placeholder="sk-..." required value={newProvider.apiKey} onChange={e => setNewProvider({...newProvider, apiKey: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Context Window</label>
                  <input type="number" className="input-v3" value={newProvider.maxContext} onChange={e => setNewProvider({...newProvider, maxContext: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Limit (RPM)</label>
                  <input type="number" className="input-v3" value={newProvider.rpmLimit} onChange={e => setNewProvider({...newProvider, rpmLimit: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Quota (RPD)</label>
                  <input type="number" className="input-v3" value={newProvider.rpdLimit} onChange={e => setNewProvider({...newProvider, rpdLimit: e.target.value})} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Model Matrix</label>
                  <button 
                    type="button" 
                    onClick={() => fetchModels(editingProvider?.id || "")}
                    disabled={!newProvider.endpoint || !newProvider.apiKey}
                    className="text-[10px] font-bold text-pink-500 flex items-center gap-1 hover:underline"
                  >
                    <RefreshCcw size={10} className={loadingModels ? "animate-spin" : ""}/> Probe Node
                  </button>
                </div>
                
                <div className="min-h-[100px] border border-[#ffe4e6] rounded-2xl p-4 bg-[#fffafa]">
                  {models.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2">
                        {models.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            onClick={() => toggleModel(m.id)}
                            className={clsx(
                              "px-3 py-1.5 rounded-xl text-xs font-medium border transition-all",
                              newProvider.allowedModels.split(",").includes(m.id)
                                ? "bg-pink-100 border-pink-300 text-pink-600"
                                : "bg-white border-gray-100 text-gray-400 hover:border-pink-200"
                            )}
                          >
                            {m.id}
                          </button>
                        ))}
                      </div>
                      <button type="button" onClick={toggleAllModels} className="text-[10px] font-bold text-gray-400 hover:text-pink-500">Toggle All Available</button>
                    </div>
                  ) : (
                    <div className="h-20 flex flex-col items-center justify-center text-gray-300 gap-1">
                      <Globe size={20}/>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Connect to discover models</span>
                    </div>
                  )}
                </div>
              </div>

              {error && <div className="p-4 bg-red-50 text-red-500 rounded-2xl text-xs font-bold flex items-center gap-2">
                <AlertCircle size={16}/> {error}
              </div>}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-v3 w-full py-5 text-lg"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                {editingProvider ? "Recalibrate Link" : "Establish Mesh Gateway"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
