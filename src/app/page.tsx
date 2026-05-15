'use client';

import React, { useState } from 'react';
import { 
  Camera, 
  LayoutDashboard, 
  Image as ImageIcon, 
  Utensils, 
  Heart, 
  CloudSun, 
  Send, 
  Plus,
  Zap,
  Settings,
  Bell
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ACCOUNTS = [
  { id: 'food', name: 'Foodie Leo', icon: Utensils, color: 'from-orange-500 to-red-500', label: '美食達人' },
  { id: 'memory', name: 'Leo Memory', icon: Heart, color: 'from-pink-500 to-purple-500', label: '感性回憶' },
  { id: 'mood', name: 'Leo Vibe', icon: CloudSun, color: 'from-blue-500 to-cyan-500', label: '心情天氣' },
];

export default function Dashboard() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setSelectedImage(e.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 hidden lg:flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Social Media Prop
          </h1>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={LayoutDashboard} label="儀表板" active />
          <NavItem icon={ImageIcon} label="素材庫" />
          <NavItem icon={Zap} label="AI 生成" />
          <NavItem icon={Bell} label="通知" />
          <NavItem icon={Settings} label="設定" />
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">L</div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">Leo Admin</p>
              <p className="text-xs text-slate-500 truncate">Pro Account</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-semibold text-slate-100">今日發佈計劃</h2>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium">
            <Plus size={18} /> 新增內容
          </button>
        </header>

        <div className="flex-1 p-8 overflow-y-auto">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {/* Upload Area */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">第一步：上載原始照片</h3>
              </div>
              
              <div className={cn(
                "relative group rounded-2xl border-2 border-dashed transition-all duration-300 min-h-[300px] flex flex-col items-center justify-center gap-4",
                selectedImage ? "border-blue-500/50 bg-slate-900/30" : "border-slate-800 hover:border-slate-700 bg-slate-900/20"
              )}>
                {selectedImage ? (
                  <div className="relative w-full h-full p-4">
                    <img src={selectedImage} alt="Preview" className="w-full max-h-[500px] object-contain rounded-xl shadow-2xl" />
                    <button 
                      onClick={() => setSelectedImage(null)}
                      className="absolute top-8 right-8 p-2 bg-slate-900/80 hover:bg-red-500 rounded-full text-white transition-all backdrop-blur-sm"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="p-4 rounded-full bg-slate-800/50 group-hover:scale-110 transition-transform">
                      <Camera size={32} className="text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-slate-300">拖放照片或點擊上載</p>
                      <p className="text-sm text-slate-500">支持 JPG, PNG (Max 10MB)</p>
                    </div>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </>
                )}
              </div>
            </section>

            {/* AI Accounts Styles */}
            <section className={cn("space-y-4 transition-all duration-500", !selectedImage && "opacity-30 pointer-events-none")}>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">第二步：AI 風格分身</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {ACCOUNTS.map((acc, index) => (
                  <motion.div 
                    key={acc.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all hover:shadow-lg group"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-3 rounded-xl bg-gradient-to-br text-white", acc.color)}>
                        <acc.icon size={24} />
                      </div>
                      <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors">
                        {acc.label}
                      </span>
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{acc.name}</h4>
                    <p className="text-sm text-slate-400 mb-6">
                      {acc.id === 'food' ? '會幫你強化食物細節，生成誘人美食配文。' : 
                       acc.id === 'memory' ? '強調感性氛圍，記錄同朋友嘅美好時刻。' : 
                       '根據今日天氣同心情，生成生活感十足嘅 Post。'}
                    </p>
                    
                    <button className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                      預覽 AI 效果
                    </button>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* Action Bar */}
            {selectedImage && (
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-xl border border-slate-700 p-4 rounded-2xl shadow-2xl z-20 flex items-center gap-6"
              >
                <div className="flex -space-x-3">
                  {ACCOUNTS.map(acc => (
                    <div key={acc.id} className={cn("w-10 h-10 rounded-full border-2 border-slate-900 bg-gradient-to-br flex items-center justify-center text-white", acc.color)}>
                      <acc.icon size={16} />
                    </div>
                  ))}
                </div>
                <div className="h-8 w-px bg-slate-700" />
                <div className="pr-4">
                  <p className="text-sm font-bold text-slate-100">準備好發佈到 3 個分身 Account</p>
                  <p className="text-xs text-slate-400">所有內容均已由 AI 優化</p>
                </div>
                <button className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 flex items-center gap-2 shadow-lg shadow-blue-500/20">
                  <Send size={20} /> 一鍵發佈
                </button>
              </motion.div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={cn(
      "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
      active ? "bg-blue-600/10 text-blue-400" : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
    )}>
      <Icon size={20} className={active ? "text-blue-400" : "group-hover:scale-110 transition-transform"} />
      <span className="text-sm font-medium">{label}</span>
      {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />}
    </button>
  );
}
