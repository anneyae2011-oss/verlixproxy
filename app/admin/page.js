"use client";

import { useState, useEffect } from "react";
import * as Lucide from "lucide-react";
import clsx from "clsx";

// Defensive Icon Wrapper to prevent crashes if an icon is missing
const Icon = ({ name, ...props }) => {
  const LucideIcon = Lucide[name];
  if (!LucideIcon) return null;
  return <LucideIcon {...props} />;
};

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
    maxContext: 128000,
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
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        setIsLoggedIn(true);
        fetchProviders();
      }
    } catch (e) {
      console.error("Auth check failed:", e);
    }
    setLoading(false);
  };

  const fetchProviders = async () => {
    try {
      const res = await fetch("/api/admin/config");
      if (res.ok) {
        const data = await res.json();
        setProviders(data);
      }
    } catch (e) {
      console.error("Fetch providers failed:", e);
    }
  };

  const fetchModels = async (providerId) => {
    setLoadingModels(true);
    setError("");
    try {
      const p = editingProvider || newProvider;
      // Use the provided endpoint/key if we don't have a providerId
      const url = providerId ? `/api/admin/models?providerId=${providerId}` : `/api/admin/models?endpoint=${encodeURIComponent(p.endpoint)}&apiKey=${encodeURIComponent(p.apiKey)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setModels(data.data || []);
      } else {
        setError(data.error || "Failed to reach provider.");
      }
    } catch (e) {
      setError("Network error: Could not reach internal models API.");
    } finally {
      setLoadingModels(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        setIsLoggedIn(true);
        fetchProviders();
      } else {
        setError("Invalid Master Password");
      }
    } catch (e) {
      setError("Login service unavailable");
    }
    setLoading(false);
  };

  const openAddModal = () => {
    console.log("[DEBUG] Opening Add Modal");
    setEditingProvider(null);
    setNewProvider({ name: "", endpoint: "", apiKey: "", maxContext: 128000, rpmLimit: 0, rpdLimit: 0, allowedModels: "" });
    setModels([]);
    setError("");
    setShowAddModal(true);
  };

  const startEdit = (p) => {
    console.log("[DEBUG] Starting Edit for:", p.name);
    setEditingProvider(p);
    setNewProvider({ ...p });
    setModels([]);
    setError("");
    setShowAddModal(true);
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
      } else {
        const data = await res.json();
        setError(data.error || "Save failed.");
      }
    } catch (e) {
      setError("Connection error during save.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteProvider = async (id) => {
    if (!confirm("Remove this provider node?")) return;
    try {
      const res = await fetch("/api/admin/config", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) fetchProviders();
    } catch (e) {
      console.error("Delete failed:", e);
    }
  };

  const toggleModel = (modelId) => {
    const current = newProvider.allowedModels ? newProvider.allowedModels.split(",").filter(m => m.trim()) : [];
    let next = current.includes(modelId) ? current.filter(m => m !== modelId) : [...current, modelId];
    setNewProvider({ ...newProvider, allowedModels: next.join(",") });
  };

  if (loading && !isLoggedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#fff5f7]">
        <Icon name="Loader2" className="animate-spin text-[#ff8fa3]" size={40} />
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4 bg-[#fff5f7]">
        <div className="w-full max-w-md bg-white p-12 rounded-[2.5rem] border border-[#ffe4e6] shadow-xl">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-[#fff0f3] rounded-full flex items-center justify-center mx-auto mb-6">
              <Icon name="Lock" className="text-[#ff8fa3]" size={32} />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-800 mb-2">VerlixProxy</h1>
            <p className="text-gray-400 font-medium text-sm">Organized AI Management</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <input
              type="password"
              placeholder="Master Password"
              className="input-v3"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
            />
            {error && <div className="text-red-500 text-xs font-bold text-center">{error}</div>}
            <button type="submit" className="btn-v3 w-full py-4 text-lg">Unlock Terminal</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout relative">
      {/* Modal - Rendered at Top Level of return for maximum reliability */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-md" onClick={() => setShowAddModal(false)}></div>
          <div className="card-v3 w-full max-w-2xl relative z-[10000] p-10 max-h-[90vh] overflow-y-auto bg-white shadow-2xl">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-2xl font-extrabold text-gray-800">{editingProvider ? "Edit Node" : "Add Node"}</h3>
              <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><Icon name="X" size={20}/></button>
            </div>

            <form onSubmit={saveProvider} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" placeholder="Name" className="input-v3" required value={newProvider.name} onChange={e => setNewProvider({...newProvider, name: e.target.value})} />
                <input type="url" placeholder="Endpoint URL" className="input-v3" required value={newProvider.endpoint} onChange={e => setNewProvider({...newProvider, endpoint: e.target.value})} />
                <input type="password" placeholder="API Key" className="input-v3" required value={newProvider.apiKey} onChange={e => setNewProvider({...newProvider, apiKey: e.target.value})} />
                <input type="number" placeholder="RPM Limit" className="input-v3" value={newProvider.rpmLimit} onChange={e => setNewProvider({...newProvider, rpmLimit: e.target.value})} />
                <input type="number" placeholder="RPD Limit" className="input-v3" value={newProvider.rpdLimit} onChange={e => setNewProvider({...newProvider, rpdLimit: e.target.value})} />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-gray-400">Models</span>
                  <button type="button" onClick={() => fetchModels(editingProvider?.id)} className="text-pink-500 text-xs font-bold flex items-center gap-1">
                    <Icon name="RefreshCcw" size={12} className={loadingModels ? "animate-spin" : ""} /> Probe
                  </button>
                </div>
                <div className="bg-gray-50 border border-pink-100 rounded-2xl p-4 min-h-[100px] flex flex-wrap gap-2">
                  {models.length > 0 ? models.map(m => (
                    <button key={m.id} type="button" onClick={() => toggleModel(m.id)} className={clsx("px-3 py-1 rounded-full text-[10px] font-bold border transition-all", newProvider.allowedModels.split(",").includes(m.id) ? "bg-pink-100 border-pink-300 text-pink-500" : "bg-white border-gray-100 text-gray-400 hover:border-pink-200")}>
                      {m.id}
                    </button>
                  )) : <div className="w-full flex items-center justify-center text-gray-300 text-[10px] font-bold">PROBE TO LOAD MODELS</div>}
                </div>
              </div>

              {error && <div className="text-red-500 text-xs font-bold">{error}</div>}
              <button type="submit" disabled={isSubmitting} className="btn-v3 w-full py-4 text-xl">
                {isSubmitting ? <Icon name="Loader2" className="animate-spin" /> : "Save Configuration"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sidebar V3 */}
      <aside className={clsx("sidebar-v3 lg:flex fixed lg:relative z-40 transition-all", isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}>
        <div className="flex items-center gap-3 mb-12">
          <div className="p-2 bg-[#ff8fa3] rounded-xl text-white"><Icon name="Zap" size={24} /></div>
          <h2 className="text-2xl font-extrabold text-[#4a4a4a]">Verlix</h2>
        </div>
        <nav className="space-y-4 flex-1">
          <button className="flex items-center gap-4 w-full p-4 bg-[#fff0f3] text-[#ff8fa3] rounded-2xl font-bold"><Icon name="BarChart2" size={20} /> Dashboard</button>
          <button className="flex items-center gap-4 w-full p-4 text-gray-400 hover:bg-[#fffafa] rounded-2xl font-bold transition-all"><Icon name="Settings" size={20} /> Settings</button>
        </nav>
        <button onClick={() => { document.cookie = "admin_session=; Max-Age=0"; window.location.reload(); }} className="flex items-center gap-4 p-4 text-gray-400 hover:text-red-400 font-bold transition-all"><Icon name="LogOut" size={20} /> De-auth</button>
      </aside>

      {/* Main Content */}
      <main className="content-v3 flex-1">
        <header className="flex justify-between items-start mb-16">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Network Control</h1>
            <p className="text-gray-400 font-medium">Neat and organized AI mesh control plane.</p>
          </div>
          <div className="flex gap-4">
            <button className="lg:hidden btn-ghost p-4 rounded-2xl" onClick={() => setIsSidebarOpen(true)}><Icon name="Menu" size={20}/></button>
            <button 
              onClick={openAddModal}
              className="btn-v3 px-8 shadow-xl shadow-pink-100 relative z-30"
            >
              <Icon name="Plus" size={20} /> Add Provider
            </button>
          </div>
        </header>

        <div className="section-grid">
          {providers.map((p) => (
            <div key={p.id} className="card-v3 group relative">
              <div className="flex justify-between items-center mb-6">
                <span className="font-bold text-lg text-gray-700">{p.name}</span>
                <div className="flex gap-2">
                  <button onClick={() => startEdit(p)} className="p-2 text-gray-400 hover:text-pink-500 rounded-lg"><Icon name="Edit2" size={16} /></button>
                  <button onClick={() => deleteProvider(p.id)} className="p-2 text-gray-400 hover:text-red-500 rounded-lg"><Icon name="Trash2" size={16} /></button>
                </div>
              </div>
              <div className="space-y-2 text-xs text-gray-400 mb-6">
                <div className="flex justify-between"><span>RPM</span><span className="text-pink-400 font-bold">{p.rpmLimit || "∞"}</span></div>
                <div className="flex justify-between"><span>RPD</span><span className="text-pink-400 font-bold">{p.rpdLimit || "∞"}</span></div>
                <div className="flex justify-between"><span>Usage</span><span className="text-gray-600 font-mono">{p.requestsMade || 0} reqs</span></div>
              </div>
              <div className="p-3 bg-[#fffafa] border border-pink-100 rounded-xl flex items-center justify-between">
                <span className="font-mono text-[10px] text-gray-400 truncate">{p.proxyKey}</span>
                <button 
                  onClick={() => { navigator.clipboard.writeText(p.proxyKey); setCopiedId(p.id); setTimeout(()=>setCopiedId(null), 2000); }}
                  className="text-pink-400"
                >
                  <Icon name={copiedId === p.id ? "Check" : "Copy"} size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
