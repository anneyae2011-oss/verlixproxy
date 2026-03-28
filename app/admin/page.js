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
  Maximize2,
  Menu,
  X,
  Edit2,
  Lock,
  Wifi,
  Clock,
  ChevronRight,
  Filter,
  RefreshCw,
  Eye,
  EyeOff
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
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    checkAuth();
    const interval = setInterval(fetchProviders, 8000); 
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
      if (res.ok) {
        const data = await res.json();
        setModels(data.data || []);
      } else {
        setError("Could not reach provider to fetch models. Check endpoint/key.");
      }
    } catch (e) {
      setError("Network error fetching models");
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
      setError("Invalid password");
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
        setError(data.error || "Critical failure saving gateway configuration.");
      }
    } catch (e) {
      setError("Synchronous connection lost. Check server status.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProvider = async (id) => {
    if (!confirm("Are you sure you want to revoke this gateway? This will permanently disable the proxy key.")) return;
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
    if (!models.length) return;
    const currentCount = newProvider.allowedModels ? newProvider.allowedModels.split(",").filter(m => m.trim()).length : 0;
    if (currentCount >= models.length) {
      setNewProvider({ ...newProvider, allowedModels: "" });
    } else {
      setNewProvider({ ...newProvider, allowedModels: models.map(m => m.id).join(",") });
    }
  };

  const startEdit = (p) => {
    setEditingProvider(p);
    setNewProvider({
      name: p.name,
      endpoint: p.endpoint,
      apiKey: p.apiKey,
      maxContext: p.maxContext,
      rpmLimit: p.rpmLimit,
      rpdLimit: p.rpdLimit,
      allowedModels: p.allowedModels || ""
    });
    setModels([]);
    setShowAddModal(true);
  };

  if (loading && !isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-vh-100 flex-col gap-4">
        <Loader2 className="animate-spin text-purple-500" size={48} />
        <p className="text-sm font-medium text-gray-400">Loading FrsionOS...</p>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-vh-100 p-6">
        <div className="bubble w-64 h-64 -top-20 -left-20"></div>
        <div className="bubble w-32 h-32 bottom-20 right-10"></div>
        <div className="glass-panel max-w-md w-full p-10 relative z-10">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Lock className="text-purple-500" size={32} />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">FrsionOS</h1>
            <p className="text-gray-400 text-sm">Premium AI Routing Platform</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Master Key</label>
              <input
                type="password"
                placeholder="••••••••••••"
                className="input-v2"
                value={password}
                required
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-red-400 text-xs text-center">{error}</p>}
            <button type="submit" className="btn-v2 w-full text-lg py-4 shadow-lg shadow-purple-200">
              Authenticate
            </button>
          </form>
        </div>
      </div>
    );
  }

  const totalTokens = providers.reduce((acc, p) => acc + (p.tokensUsed || 0), 0);
  const totalRequests = providers.reduce((acc, p) => acc + (p.requestsMade || 0), 0);

  return (
    <div className="app-container">
      {/* Mobile Burger */}
      <button 
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="lg:hidden fixed bottom-8 right-8 z-[60] w-14 h-14 bg-purple-600 text-white rounded-full flex items-center justify-center shadow-2xl scale-110"
      >
        {isSidebarOpen ? <X /> : <Menu />}
      </button>

      {/* Sidebar V2 */}
      <aside className={clsx(
        "sidebar-v2 glass-panel p-8 flex flex-col z-40 transition-all duration-500 lg:translate-x-0 ease-in-out",
        isSidebarOpen ? "translate-x-0 fixed inset-0 m-0 rounded-none bg-white/40 backdrop-blur-3xl" : "-translate-x-[110%] fixed inset-0 m-0 lg:relative lg:m-0 lg:rounded-3xl"
      )}>
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2.5 bg-purple-500 rounded-2xl shadow-lg shadow-purple-200 flex items-center justify-center">
            <Zap className="text-white" size={24} />
          </div>
          <h2 className="text-2xl font-black tracking-tight text-gray-800">FrsionOS</h2>
        </div>

        <nav className="space-y-3 flex-1">
          <button className="flex items-center gap-4 w-full p-4 bg-purple-500/10 text-purple-600 rounded-2xl font-black text-xs uppercase tracking-widest">
            <BarChart3 size={20} /> Overview
          </button>
          <button className="flex items-center gap-4 w-full p-4 text-gray-400 hover:text-purple-500 hover:bg-purple-50/50 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest">
            <Globe size={20} /> Node Map
          </button>
          <button className="flex items-center gap-4 w-full p-4 text-gray-400 hover:text-purple-500 hover:bg-purple-50/50 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest">
            <Settings size={20} /> Runtime
          </button>
        </nav>

        <div className="pt-8 border-t border-gray-100">
          <button 
            onClick={() => { document.cookie = "admin_session=; Max-Age=0"; window.location.reload(); }}
            className="flex items-center gap-4 p-4 text-gray-400 hover:text-red-500 transition-colors w-full font-bold text-xs uppercase tracking-widest"
          >
            <LogOut size={20} /> Kill Session
          </button>
        </div>
      </aside>

      {/* Main Content V2 */}
      <main className="main-v2">
        <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-12">
          <div>
            <span className="text-[10px] font-black text-purple-500 uppercase tracking-[0.3em] mb-4 block">Central Processing Unit</span>
            <h1 className="text-5xl font-black text-gray-800 tracking-tighter mb-2">Platform Control</h1>
            <p className="text-gray-400 font-medium">Monitoring and routing active endpoints across the mesh.</p>
          </div>
          <button 
            onClick={() => { setEditingProvider(null); setNewProvider({ name: "", endpoint: "", apiKey: "", maxContext: 4096, rpmLimit: 0, rpdLimit: 0, allowedModels: "" }); setShowAddModal(true); }}
            className="btn-v2 flex items-center justify-center gap-3 px-8 py-5 rounded-2xl shadow-2xl shadow-purple-200 text-sm"
          >
            <Plus size={20} /> Invoke Gateway
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
          {[
            { label: "Aggregate Throughput", value: totalTokens.toLocaleString(), icon: <Key />, sub: "TOKEN FLOW" },
            { label: "Active Connections", value: totalRequests.toLocaleString(), icon: <Wifi />, sub: "SYNC LAYER" },
            { label: "Mesh Nodes", value: providers.length, icon: <Maximize2 />, sub: "EDGE ROUTING" }
          ].map((stat, i) => (
            <div key={i} className="glass-panel p-10 group overflow-hidden relative">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
              <div className="flex justify-between items-start mb-8">
                <div className="p-4 bg-white/80 rounded-2xl text-purple-500 shadow-sm border border-white/60">
                  {stat.icon}
                </div>
                <span className="text-[9px] font-black text-purple-400 tracking-[0.2em]">{stat.sub}</span>
              </div>
              <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">{stat.label}</p>
              <h3 className="text-5xl font-black text-gray-800 tracking-tighter">{stat.value}</h3>
            </div>
          ))}
        </div>

        {/* Providers Section */}
        <section>
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black flex items-center gap-3 uppercase tracking-widest text-gray-700">
              <div className="p-2 bg-purple-100 rounded-lg"><Filter className="text-purple-500" size={16} /></div>
              Active Mesh Nodes
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 xl:grid-cols-2 gap-8">
            {providers.map((p) => (
              <div key={p.id} className="glass-panel overflow-hidden group border-white/80">
                <div className="p-10">
                  <div className="flex justify-between items-start mb-10">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className={clsx("w-3 h-3 rounded-full shadow-lg", p.enabled ? "bg-green-400 animate-pulse shadow-green-200" : "bg-gray-300")}></div>
                        <h4 className="font-black text-2xl text-gray-800 tracking-tight">{p.name}</h4>
                      </div>
                      <p className="text-xs font-bold text-gray-400 font-mono bg-gray-50 px-3 py-1 rounded-full border border-gray-100 w-fit">{p.endpoint}</p>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => startEdit(p)} className="p-3 text-gray-400 hover:bg-white hover:text-purple-500 rounded-2xl transition-all shadow-sm border border-transparent hover:border-white/80">
                        <Edit2 size={18} />
                      </button>
                      <button onClick={() => deleteProvider(p.id)} className="p-3 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-6 mb-10">
                    {[
                      { l: "CONTEXT", v: p.maxContext || "AUTO", i: <Maximize2 size={12}/> },
                      { l: "RPM LIMIT", v: p.rpmLimit || "INF", i: <Clock size={12}/> },
                      { l: "RPD LIMIT", v: p.rpdLimit || "INF", i: <Zap size={12}/> }
                    ].map((m, i) => (
                      <div key={i} className="glass-card p-5 text-center relative overflow-hidden group/m">
                        <div className="absolute top-0 left-0 w-full h-1 bg-purple-500/10 group-hover/m:bg-purple-500/30"></div>
                        <p className="text-[9px] font-black text-gray-300 uppercase mb-2 flex items-center justify-center gap-1">
                          {m.i} {m.l}
                        </p>
                        <p className="text-lg font-black text-gray-700 tracking-tighter">{m.v}</p>
                      </div>
                    ))}
                  </div>

                  <div className="p-6 bg-white/40 border border-white/60 rounded-[2.5rem] flex items-center justify-between shadow-inner">
                    <div className="flex items-center gap-5">
                      <div className="p-3 bg-purple-500 rounded-2xl shadow-lg shadow-purple-100">
                        <Key className="text-white" size={18} />
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">MESH ACCESS TOKEN</p>
                        <p className="font-mono text-sm font-black text-purple-600">{p.proxyKey}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => copyToClipboard(p.proxyKey, p.id)}
                      className="p-4 bg-white hover:bg-purple-50 rounded-2xl transition-all shadow-md border border-white group-hover:scale-105 active:scale-95"
                    >
                      {copiedId === p.id ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-purple-400" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {providers.length === 0 && (
              <div className="col-span-full py-20 text-center glass-panel border-dashed border-2">
                <Globe className="mx-auto text-gray-200 mb-6 animate-pulse" size={64}/>
                <p className="text-xl font-bold text-gray-400">No mesh nodes detected. Invoke your first gateway.</p>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-3xl" onClick={() => setShowAddModal(false)}></div>
          <div className="glass-panel max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8 sm:p-12 relative z-10 shadow-3xl border-white/90">
            <header className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-3xl font-black text-gray-800 tracking-tighter">
                  {editingProvider ? "Edit Gateway" : "Initialize Mesh Node"}
                </h3>
                <p className="text-gray-400 text-sm font-medium">Configure upstream routing and constraints.</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="p-3 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all"
              >
                <X size={24}/>
              </button>
            </header>

            <form onSubmit={saveProvider} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Node Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. OpenAI Flux-1"
                    className="input-v2 px-6 py-4"
                    required
                    value={newProvider.name}
                    onChange={(e) => setNewProvider({...newProvider, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Internal Endpoint (HTTP/S)</label>
                  <input
                    type="url"
                    placeholder="https://api.openai.com/v1"
                    className="input-v2 px-6 py-4"
                    required
                    value={newProvider.endpoint}
                    onChange={(e) => setNewProvider({...newProvider, endpoint: e.target.value})}
                  />
                </div>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Upstream Credentials</label>
                  <div className="relative">
                    <input
                      type={showKey ? "text" : "password"}
                      placeholder="sk-••••••••••••"
                      className="input-v2 px-6 py-4 pr-14"
                      required
                      value={newProvider.apiKey}
                      onChange={(e) => setNewProvider({...newProvider, apiKey: e.target.value})}
                    />
                    <button 
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-gray-300 hover:text-purple-500"
                    >
                      {showKey ? <EyeOff size={18}/> : <Eye size={18}/>}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Context Threshold</label>
                  <input
                    type="number"
                    placeholder="4096 (Max Tokens)"
                    className="input-v2 px-6 py-4"
                    value={newProvider.maxContext}
                    onChange={(e) => setNewProvider({...newProvider, maxContext: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Rate Limit (Requests/Min)</label>
                  <input
                    type="number"
                    placeholder="0 = Unlimited"
                    className="input-v2 px-6 py-4"
                    value={newProvider.rpmLimit}
                    onChange={(e) => setNewProvider({...newProvider, rpmLimit: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Quota Limit (Requests/Day)</label>
                  <input
                    type="number"
                    placeholder="0 = Unlimited"
                    className="input-v2 px-6 py-4"
                    value={newProvider.rpdLimit}
                    onChange={(e) => setNewProvider({...newProvider, rpdLimit: e.target.value})}
                  />
                </div>
              </div>

              {/* Model Management */}
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Filter size={14}/> Model Control Matrix
                  </label>
                  <div className="flex gap-3">
                    <button 
                      type="button" 
                      onClick={() => fetchModels(editingProvider?.id || "")}
                      disabled={!newProvider.endpoint || !newProvider.apiKey}
                      className="flex items-center gap-2 text-[10px] font-black uppercase text-purple-600 px-4 py-2 bg-purple-50 rounded-xl hover:bg-purple-100 disabled:opacity-30"
                    >
                      <RefreshCw size={12} className={loadingModels ? "animate-spin" : ""}/> 
                      Probe Models
                    </button>
                    {models.length > 0 && (
                      <button 
                        type="button" 
                        onClick={toggleAllModels}
                        className="text-[10px] font-black uppercase text-gray-500 px-4 py-2 hover:bg-gray-100 rounded-xl"
                      >
                        Select All
                      </button>
                    )}
                  </div>
                </div>

                <div className={clsx(
                  "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-4 bg-gray-50/50 rounded-[2rem] border border-gray-100",
                  models.length === 0 && "flex items-center justify-center"
                )}>
                  {models.length > 0 ? models.map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => toggleModel(m.id)}
                      className={clsx(
                        "p-4 rounded-2xl text-[11px] font-bold text-left transition-all flex justify-between items-center border",
                        newProvider.allowedModels.split(",").includes(m.id)
                          ? "bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-100"
                          : "bg-white text-gray-500 border-white hover:border-purple-200"
                      )}
                    >
                      <span className="truncate mr-2">{m.id}</span>
                      {newProvider.allowedModels.split(",").includes(m.id) && <Check size={14}/>}
                    </button>
                  )) : (
                    <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest italic">Sync with upstream to initialize model matrix</p>
                  )}
                </div>
                <p className="text-[9px] text-gray-400 italic ml-2">
                  Current Selection: {newProvider.allowedModels ? newProvider.allowedModels.split(",").length : "All models enabled"}
                </p>
              </div>

              {error && <p className="text-red-500 text-sm font-black bg-red-50 p-6 rounded-[2rem] border border-red-100 animate-pulse">{error}</p>}

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="btn-v2 w-full text-lg py-6 shadow-3xl shadow-purple-200 flex items-center justify-center gap-4 rounded-3xl"
              >
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Zap size={24} />}
                <span className="tracking-tighter font-black uppercase">{editingProvider ? "Recalibrate Gateway" : "Initialize Mesh Link"}</span>
              </button>
            </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-thumb { background: rgba(167, 139, 250, 0.2); border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: rgba(167, 139, 250, 0.4); }
        .shadow-3xl { box-shadow: 0 35px 60px -15px rgba(0, 0, 0, 0.1); }
      `}</style>
    </div>
  );
}
