'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, LayoutDashboard, ImageIcon, Utensils, Heart, CloudSun, Send, Plus, Zap, Settings, 
  Bell, Download, Maximize, Crop, Sparkles, ExternalLink, AlertCircle, Loader2, 
  CheckCircle2, Save, RotateCcw, Languages, Trash2, Globe, Plane, Dumbbell, Laptop,
  MessageCircle, Share2, Link as LinkIcon, Copy, Monitor, Smartphone, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ICON_MAP: Record<string, any> = {
  Utensils, Heart, CloudSun, Plane, Dumbbell, Laptop, Camera, Zap, Monitor
};

const INITIAL_PERSONAS = [
  { id: 'food', name: 'Foodie Leo', icon: 'Utensils', color: 'from-orange-500 to-red-600', label: '美食', lang: 'zh-HK', prompt: '美食風格廣東話。' },
  { id: 'memory', name: 'Leo Memory', icon: 'Heart', color: 'from-pink-500 to-rose-600', label: '感性', lang: 'zh-HK', prompt: '回憶風格廣東話。' },
  { id: 'vibe', name: 'Vibe Master', icon: 'CloudSun', color: 'from-indigo-500 to-purple-600', label: '氛圍', lang: 'zh-HK', prompt: '文青風格廣東話。' },
];

export default function Dashboard() {
  const [activeView, setActiveView] = useState<'dashboard' | 'settings' | 'platforms'>('dashboard');
  const [personas, setPersonas] = useState(INITIAL_PERSONAS);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCaptions, setGeneratedCaptions] = useState<Record<string, string>>({});
  const [currentGeneratingId, setCurrentGeneratingId] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ id: string, type: 'ig' | 'threads' } | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const connectIG = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) { alert('請設定 NEXT_PUBLIC_FACEBOOK_APP_ID'); return; }
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/meta/callback');
    // 強化版 Scopes
    const scopes = [
      'public_profile',
      'email',
      'instagram_basic',
      'instagram_content_publish',
      'pages_show_list',
      'pages_read_engagement',
      'business_management'
    ].join(',');
    const url = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
    window.open(url, '_blank', 'width=600,height=700');
  };

  const connectThreads = () => {
    const appId = process.env.NEXT_PUBLIC_FACEBOOK_APP_ID;
    if (!appId) { alert('請設定 NEXT_PUBLIC_FACEBOOK_APP_ID'); return; }
    const redirectUri = encodeURIComponent('http://localhost:3000/api/auth/meta/callback');
    const scopes = ['threads_basic', 'threads_content_publish'].join(',');
    const url = `https://www.threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scopes}&response_type=code`;
    window.open(url, '_blank', 'width=600,height=700');
  };

  const handlePublishThreads = async (personaId: string) => {
    const caption = generatedCaptions[personaId];
    if (!caption || !selectedImage) return;
    try {
      const res = await fetch('/api/threads/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: caption, imageBase64: selectedImage }),
      });
      const data = await res.json();
      if (res.ok) alert(data.message || 'Threads 發佈成功！');
      else alert(`Threads 錯誤: ${data.error}`);
    } catch (e) { alert('發佈失敗，請檢查網路。'); }
  };

  const handlePublishIG = async (personaId: string) => {
    const caption = generatedCaptions[personaId];
    if (!caption || !selectedImage) return;
    try {
      const res = await fetch('/api/ig/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: caption, imageBase64: selectedImage }),
      });
      const data = await res.json();
      if (res.ok) alert(data.message || 'IG 發佈成功！');
      else alert(`IG 錯誤: ${data.error}`);
    } catch (e) { alert('發佈失敗，請檢查網路。'); }
  };

  const handlePublishFB = async (personaId: string) => {
    const caption = generatedCaptions[personaId];
    if (!caption || !selectedImage) return;
    try {
      const res = await fetch('/api/fb/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: caption, imageBase64: selectedImage }),
      });
      const data = await res.json();
      if (data.success) {
        alert('Facebook 發佈成功！');
      } else {
        alert(`FB 發佈失敗: ${data.error}\n細節: ${JSON.stringify(data.details?.message || data.details)}`);
      }
    } catch (e) { alert('發佈失敗，請檢查網路。'); }
  };

  const handleGenerateAI = async () => {
    if (!selectedImage) return;
    setIsGenerating(true);
    setGeneratedCaptions({});
    for (const p of personas) {
      setCurrentGeneratingId(p.id);
      try {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: selectedImage, customPrompt: p.prompt, language: p.lang, personaName: p.name }),
        });
        const data = await res.json();
        setGeneratedCaptions(prev => ({ ...prev, [p.id]: data.content }));
      } catch (e) {
        setGeneratedCaptions(prev => ({ ...prev, [p.id]: "AI Timeout." }));
      }
    }
    setIsGenerating(false);
    setCurrentGeneratingId(null);
  };

  const downloadProcessedImage = (aspectRatio: '1:1' | '4:5') => {
    if (!selectedImage || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = selectedImage;
    img.onload = () => {
      const ratio = aspectRatio === '1:1' ? 1 : 0.8;
      let tw = img.width, th = img.height;
      if (img.width / img.height > ratio) tw = img.height * ratio;
      else th = img.width / ratio;
      canvas.width = 1080;
      canvas.height = aspectRatio === '1:1' ? 1080 : 1350;
      ctx?.drawImage(img, (img.width-tw)/2, (img.height-th)/2, tw, th, 0, 0, 1080, canvas.height);
      const link = document.createElement('a');
      link.download = `social-${aspectRatio}.jpg`;
      link.href = canvas.toDataURL('image/jpeg', 0.9);
      link.click();
    };
  };

  return (
    <div className="flex min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-indigo-500/30 overflow-hidden">
      <canvas ref={canvasRef} className="hidden" />
      <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => {
        const file = e.target.files?.[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => setSelectedImage(ev.target?.result as string);
          reader.readAsDataURL(file);
        }
      }} />

      {/* Sidebar */}
      <aside className="w-72 border-r border-slate-800/50 bg-slate-950/40 backdrop-blur-3xl hidden lg:flex flex-col z-30 shadow-2xl">
        <div className="p-12">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg"><Globe size={20} /></div>
             <h1 className="text-xl font-black tracking-tighter text-white">SOCIAL PROP</h1>
          </div>
        </div>
        <nav className="flex-1 px-6 space-y-2">
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeView === 'dashboard'} onClick={() => setActiveView('dashboard')} />
          <NavItem icon={Languages} label="AI Lab" active={activeView === 'settings'} onClick={() => setActiveView('settings')} />
          <NavItem icon={LinkIcon} label="Platforms" active={activeView === 'platforms'} onClick={() => setActiveView('platforms')} />
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-10">
        <header className="h-24 border-b border-slate-800/50 flex items-center justify-between px-12 bg-slate-950/20 backdrop-blur-2xl">
           <h2 className="text-sm font-black tracking-[0.2em] uppercase text-slate-400">Social Content Hub</h2>
           {selectedImage && activeView === 'dashboard' && (
             <div className="flex gap-3">
               <button onClick={() => downloadProcessedImage('1:1')} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black hover:border-indigo-500">1:1 SQ</button>
               <button onClick={() => downloadProcessedImage('4:5')} className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-[10px] font-black hover:border-indigo-500">4:5 PT</button>
             </div>
           )}
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' ? (
              <motion.div key="dash" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-12 pb-40">
                <section onClick={() => !selectedImage && fileInputRef.current?.click()} className={cn("relative rounded-[3rem] border-2 border-dashed transition-all duration-1000 min-h-[350px] flex flex-col items-center justify-center overflow-hidden shadow-2xl", selectedImage ? "border-indigo-500/20 bg-slate-900/20" : "border-slate-800 bg-slate-900/10 cursor-pointer hover:border-indigo-500/50")}>
                   {selectedImage ? (
                     <div className="w-full h-full p-12 flex flex-col items-center">
                        <img src={selectedImage} alt="Preview" className="max-h-[350px] rounded-[2.5rem] shadow-2xl border border-slate-800/50 mb-10" />
                        <div className="flex gap-4">
                          <button onClick={(e) => { e.stopPropagation(); handleGenerateAI(); }} className="px-12 py-5 bg-indigo-600 rounded-[1.5rem] text-sm font-black flex items-center gap-3 shadow-2xl hover:scale-105 transition-all disabled:opacity-50" disabled={isGenerating}>
                            {isGenerating ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />} {isGenerating ? 'GENERATING...' : 'BATCH GENERATE ALL'}
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedImage(null); }} className="px-8 py-5 bg-slate-950/50 border border-slate-800 rounded-[1.5rem] text-sm font-black">RESET</button>
                        </div>
                     </div>
                   ) : (
                     <div className="text-center space-y-6"><Camera size={48} className="mx-auto text-slate-700" /><p className="text-sm font-black text-slate-500 uppercase tracking-widest">Select Media</p></div>
                   )}
                </section>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {personas.map((p, idx) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }} className="p-8 rounded-[2.5rem] border border-slate-800/50 bg-slate-900/40 flex flex-col h-[480px]">
                        <div className="flex items-center justify-between mb-8">
                           <div className={cn("p-4 rounded-2xl text-white bg-gradient-to-br shadow-xl", p.color)}><Sparkles size={24} /></div>
                           <div className="flex gap-2">
                             <button onClick={() => setPreviewData({ id: p.id, type: 'ig' })} className="p-2 text-slate-600 hover:text-pink-500 transition-colors"><Camera size={20} /></button>
                             <button onClick={() => setPreviewData({ id: p.id, type: 'threads' })} className="p-2 text-slate-600 hover:text-indigo-400 transition-colors"><MessageCircle size={20} /></button>
                           </div>
                        </div>
                        <h4 className="text-xl font-black text-white mb-4 italic">{p.name}</h4>
                        <div className="flex-1 bg-slate-950/50 rounded-3xl p-6 text-sm text-slate-400 leading-relaxed border border-slate-800/50 overflow-y-auto custom-scrollbar relative">
                          {generatedCaptions[p.id] || (isGenerating && currentGeneratingId === p.id ? 'Thinking...' : 'Standby...')}
                          {generatedCaptions[p.id] && (
                            <button onClick={() => { navigator.clipboard.writeText(generatedCaptions[p.id]); alert('Copied!'); }} className="absolute bottom-4 right-4 p-2 bg-slate-800 rounded-xl"><Copy size={14} /></button>
                          )}
                        </div>
                        <div className="mt-6 flex flex-wrap gap-2">
                          <button onClick={() => handlePublishFB(p.id)} className="flex-1 min-w-[30%] py-2 bg-blue-600/10 text-blue-500 border border-blue-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-blue-600 hover:text-white transition-all">FB Page</button>
                          <button onClick={() => handlePublishIG(p.id)} className="flex-1 min-w-[30%] py-2 bg-pink-600/10 text-pink-500 border border-pink-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-pink-600 hover:text-white transition-all">IG Post</button>
                          <button onClick={() => handlePublishThreads(p.id)} className="flex-1 min-w-[30%] py-2 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all">Threads</button>
                        </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : activeView === 'platforms' ? (
              <motion.div key="plat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-5xl mx-auto space-y-8 pb-40">
                 <div className="flex justify-center mb-10">
                    <button onClick={async () => {
                      try {
                        const res = await fetch('/api/auth/meta/inspect');
                        const data = await res.json();
                        if (data.success) {
                          const igId = data.pages_found?.[0]?.instagram_business_account?.id || '未找到';
                          alert(`探測成功！\nFB Page ID: ${data.fb_page_id}\nIG ID: ${igId}\nThreads ID: ${data.threads_id}\n\n權限: ${data.permissions?.join(', ')}`);
                        } else {
                          alert(`探測失敗: ${data.error}`);
                        }
                      } catch (e) {
                        alert('探測連線失敗');
                      }
                    }} className="px-10 py-4 bg-slate-900 border border-slate-700 rounded-2xl text-xs font-black hover:border-indigo-500 transition-all">
                      🔍 探測目前 Token 權限
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <PlatformCard icon={Camera} name="Instagram Business" color="bg-gradient-to-br from-pink-600 to-orange-500" onConnect={connectIG} />
                    <PlatformCard icon={MessageCircle} name="Threads API" color="bg-slate-800" onConnect={connectThreads} />
                 </div>
              </motion.div>
            ) : (
              <div className="max-w-4xl mx-auto space-y-8 pb-40 text-center">
                 <div className="flex items-center justify-between mb-8">
                   <h3 className="text-4xl font-black text-white italic tracking-tighter">Persona Laboratory</h3>
                   <button 
                     onClick={() => {
                       setPersonas([...personas, { 
                         id: `new-${Date.now()}`, 
                         name: 'New Style', 
                         icon: 'Sparkles', 
                         color: 'from-emerald-500 to-teal-600', 
                         label: '自訂', 
                         lang: 'zh-HK', 
                         prompt: '自訂 AI 指令...' 
                       }]);
                     }}
                     className="px-6 py-3 bg-white text-black rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-slate-200 transition-all shadow-xl shadow-white/10"
                   >
                     <Plus size={18} /> Add Style
                   </button>
                 </div>
                 <div className="grid gap-8 text-left">
                  {personas.map((p, i) => (
                    <div key={p.id} className="p-10 bg-slate-900/30 border border-slate-800 rounded-[3rem] space-y-6 relative group">
                       <button 
                         onClick={() => {
                           if(personas.length <= 1) { alert('最少要保留一個 Persona！'); return; }
                           setPersonas(personas.filter(x => x.id !== p.id));
                         }} 
                         className="absolute -top-4 -right-4 w-12 h-12 bg-red-500/10 text-red-500 border border-red-500/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-2xl"
                         title="Remove Persona"
                       >
                         <Trash2 size={20} />
                       </button>
                       
                       <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                         <input className="bg-transparent text-2xl font-black text-white outline-none flex-1" value={p.name} onChange={e => {
                           const n = [...personas]; n[i].name = e.target.value; setPersonas(n);
                         }} placeholder="Persona Name" />
                         <div className="flex items-center gap-3 bg-slate-950 p-2 rounded-xl border border-slate-800/50">
                           <Languages size={16} className="text-slate-500 ml-2" />
                           <select className="bg-transparent text-slate-300 text-sm outline-none font-bold cursor-pointer" value={p.lang} onChange={e => {
                             const n = [...personas]; n[i].lang = e.target.value; setPersonas(n);
                           }}>
                             <option value="zh-HK">廣東話 (Cantonese)</option>
                             <option value="zh-TW">繁體中文 (Traditional)</option>
                             <option value="en-US">English (US)</option>
                             <option value="ja-JP">日本語 (Japanese)</option>
                           </select>
                         </div>
                       </div>
                       
                       <textarea className="w-full h-32 bg-[#020617] p-6 rounded-[1.5rem] text-sm text-slate-400 border border-slate-800 outline-none resize-none focus:border-indigo-500/50 transition-colors" value={p.prompt} onChange={e => {
                         const n = [...personas]; n[i].prompt = e.target.value; setPersonas(n);
                       }} placeholder="System Prompt..." />
                       
                       <div className="flex justify-end mt-4">
                         <button onClick={() => alert('Persona 已儲存！')} className="px-6 py-3 bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-black hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                           <Save size={16} /> 儲存設定
                         </button>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Unified Preview Modal */}
      <AnimatePresence>
        {previewData && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-[#020617]/95 backdrop-blur-xl z-[100] flex items-center justify-center p-8" onClick={() => setPreviewData(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className={cn("w-[420px] rounded-[3rem] overflow-hidden shadow-2xl", previewData.type === 'ig' ? "bg-white text-black" : "bg-black text-white border border-slate-800")} onClick={e => e.stopPropagation()}>
               <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <span className="font-bold">{previewData.type === 'ig' ? 'ig_user_preview' : 'threads_user_preview'}</span>
               </div>
               <div className="aspect-square bg-slate-100 overflow-hidden">
                  {selectedImage && <img src={selectedImage} className="w-full h-full object-cover" />}
               </div>
               <div className="p-8 space-y-4">
                  <div className="flex gap-6"><Heart size={24} /><MessageCircle size={24} /><Send size={24} /></div>
                  <div className="text-sm leading-relaxed font-medium">
                     <span className="font-bold mr-2">leomarketing</span>
                     {generatedCaptions[previewData.id] || "No content generated yet."}
                  </div>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function NavItem({ icon: Icon, label, active, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={cn("w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all group", active ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/30" : "text-slate-500 hover:text-slate-200")}>
      <Icon size={20} />
      <span className="text-xs font-black tracking-widest uppercase">{label}</span>
    </button>
  );
}

function PlatformCard({ icon: Icon, name, color, onConnect }: any) {
  return (
    <div className="p-10 bg-slate-900/40 border border-slate-800 rounded-[3rem] flex flex-col items-center gap-8 text-center hover:border-indigo-500/50 transition-all">
       <div className={cn("w-20 h-20 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl", color)}><Icon size={40} /></div>
       <div>
         <h4 className="text-2xl font-black text-white mb-2">{name}</h4>
         <p className="text-sm text-slate-500">Authorize your account to enable one-click publishing.</p>
       </div>
       <button onClick={onConnect} className="w-full py-5 bg-indigo-600 rounded-2xl font-black text-sm hover:bg-indigo-500 transition-all">立即連結平台</button>
    </div>
  );
}
