import React, { useState } from 'react';
import { HealthResponse } from '../types';
import { Shield, Cpu, HardDrive, Database, Radio, Sparkles, Layers, Search, X, ChevronRight } from 'lucide-react';
import { ALL_PAGES, PageMeta } from '../pages/catalog';

interface TopNavProps {
  health: HealthResponse | null;
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export const TopNav: React.FC<TopNavProps> = ({ health, activeTab, onSelectTab }) => {
  const [showCatalog, setShowCatalog] = useState<boolean>(false);
  const [catalogSearch, setCatalogSearch] = useState<string>('');

  const quickTabs = [
    { id: 'dashboard', label: '1. Dashboard' },
    { id: 'command-centre', label: '2. Command' },
    { id: 'voice-studio', label: '3. Voice' },
    { id: 'task-centre', label: '24. Tasks' },
    { id: 'contextual-memory', label: '4. Memory' },
    { id: 'knowledge-vault', label: '6. Vault' },
    { id: 'models-providers', label: '15. Models' },
    { id: 'security-centre', label: '23. Security' },
    { id: 'logs-diagnostics', label: '25. Logs' },
    { id: 'health-monitor', label: '26. Health' },
    { id: 'admin-control', label: '32. Admin' },
  ];

  const categories = [
    'Core',
    'Memory & Data',
    'Agents & Workflows',
    'Platform Control',
    'AI & Models',
    'Sensors & Visual',
    'Security & Diagnostics',
    'System',
  ] as const;

  const filteredPages = ALL_PAGES.filter(p =>
    p.title.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.description.toLowerCase().includes(catalogSearch.toLowerCase()) ||
    p.pageNumber.toString() === catalogSearch.trim()
  );

  const handleSelectPage = (pageId: string) => {
    onSelectTab(pageId);
    setShowCatalog(false);
  };

  const activePageMeta = ALL_PAGES.find(p => p.id === activeTab);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[rgba(7,10,19,0.92)] backdrop-blur-xl border-b border-white/5">
        {/* Upper Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between px-6 py-2.5 border-b border-white/5 text-xs gap-3">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="font-extrabold text-sm tracking-widest text-white">JARVIS</span>
              <span className="text-[10px] text-gray-500 font-mono border-l border-white/10 pl-2">
                v{health?.version || '0.1.0'}
              </span>
            </div>

            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
              health?.mode === 'offline'
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
            }`}>
              <Shield className="w-3 h-3" />
              {health?.mode === 'offline' ? 'Zero-API Offline Mode' : 'Online / Hybrid'}
            </span>
          </div>

          {/* Live System Telemetry */}
          <div className="flex items-center gap-5 text-gray-400 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>WAL:</span>
              <strong className="text-white">
                {health?.database.connected ? 'Active' : 'Connecting...'}
              </strong>
            </div>

            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>CPU:</span>
              <strong className="text-white">{health?.system_resources.cpu_pct ?? 0}%</strong>
            </div>

            <div className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
              <span>RAM:</span>
              <strong className="text-white">
                {health ? `${Math.round(health.system_resources.ram_used_mb / 1024)}GB` : '...'}
              </strong>
            </div>

            <div className="flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>Engine:</span>
              <strong className="text-cyan-300">
                {health?.local_ai.model_loaded || 'GGUF Standby'}
              </strong>
            </div>
          </div>
        </div>

        {/* Main Navigation Bar */}
        <div className="flex items-center justify-between px-6 py-1.5">
          <nav className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {quickTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onSelectTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>

          <button
            onClick={() => setShowCatalog(true)}
            className="ml-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/5 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-300 border border-white/10 hover:border-cyan-500/30 transition-all flex items-center gap-2 whitespace-nowrap"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>All 32 Pages</span>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono">
              {activePageMeta ? `Pg ${activePageMeta.pageNumber}` : 'Browse'}
            </span>
          </button>
        </div>
      </header>

      {/* 32-Page Directory Modal Drawer */}
      {showCatalog && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="cyber-glass w-full max-w-5xl max-h-[88vh] rounded-3xl border border-cyan-500/30 shadow-2xl shadow-cyan-950/50 flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-wide">JARVIS 32-Page Architectural Catalog</h2>
                  <p className="text-xs text-gray-400">Explore complete subsystem matrix • Select any page to switch active viewport</p>
                </div>
              </div>

              <button
                onClick={() => setShowCatalog(false)}
                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search Bar */}
            <div className="p-4 border-b border-white/5 bg-black/40">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search pages by name, category, page number or description..."
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-gray-200 focus:outline-none focus:border-cyan-500/50"
                  autoFocus
                />
              </div>
            </div>

            {/* Catalog Grid grouped by Category */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {categories.map((cat) => {
                const pagesInCat = filteredPages.filter(p => p.category === cat);
                if (pagesInCat.length === 0) return null;

                return (
                  <div key={cat} className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      {cat} ({pagesInCat.length})
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pagesInCat.map((page) => {
                        const isCurrent = activeTab === page.id;
                        return (
                          <div
                            key={page.id}
                            onClick={() => handleSelectPage(page.id)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                              isCurrent
                                ? 'bg-cyan-950/40 border-cyan-500 shadow-md shadow-cyan-500/20'
                                : 'bg-black/30 border-white/5 hover:border-cyan-500/40 hover:bg-white/5'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-bold">
                                  Page {page.pageNumber}
                                </span>
                                {isCurrent && (
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold">ACTIVE</span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-white mb-1">{page.title}</div>
                              <div className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed font-sans">
                                {page.description}
                              </div>
                            </div>

                            <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-cyan-400 font-mono">
                              <span>Open View</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
