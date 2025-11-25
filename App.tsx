
import React, { useEffect, useState } from 'react';
import Layout from './components/Layout';
import Login from './components/Login';
import CalendarView from './components/CalendarView';
import VisitDetailModal from './components/VisitDetailModal';
import WeeklyBriefing from './components/WeeklyBriefing';
import BatchImportModal from './components/BatchImportModal';
import AddVisitModal from './components/AddVisitModal';
import UserManagementModal from './components/UserManagementModal';
import { dataService } from './services/dataService';
import { User, Visit } from './types';
import { ICONS } from './constants';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [showBriefing, setShowBriefing] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUserMgr, setShowUserMgr] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check auth on load
    const user = dataService.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    loadVisits();
    setIsLoading(false);
  }, []);

  const loadVisits = () => {
    setVisits(dataService.getVisits());
  };

  const handleLoginSuccess = () => {
    setCurrentUser(dataService.getCurrentUser());
  };

  const handleLogout = () => {
    dataService.logout();
    setCurrentUser(null);
  };

  const handleVisitUpdate = (updatedVisit: Visit) => {
    setVisits(prev => prev.map(v => v.id === updatedVisit.id ? updatedVisit : v));
    setSelectedVisit(updatedVisit);
  };

  const handleDeleteVisit = (id: string) => {
    dataService.deleteVisit(id);
    setVisits(prev => prev.filter(v => v.id !== id));
    setSelectedVisit(null);
  };

  const handleImportSuccess = () => {
    loadVisits();
    alert("导入成功！");
  };

  const handleAddVisit = (newVisit: Visit) => {
    dataService.saveVisit(newVisit);
    loadVisits();
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-stone-50 text-stone-500">正在加载...</div>;

  if (!currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Admin Tools Dropdown
  const renderAdminTools = () => (
    <div className="relative">
      <button 
        onClick={() => setShowSettings(!showSettings)}
        className="flex items-center gap-2 text-stone-500 hover:text-zen-700 transition"
      >
        <ICONS.Settings size={20} />
      </button>
      
      {showSettings && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-stone-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
           <div className="py-1">
             <button 
               onClick={() => { setShowImport(true); setShowSettings(false); }}
               className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-zen-700 flex items-center gap-2"
             >
               <ICONS.Upload size={16} /> 批量导入
             </button>
             <button 
               onClick={() => { setShowUserMgr(true); setShowSettings(false); }}
               className="w-full text-left px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 hover:text-zen-700 flex items-center gap-2"
             >
               <ICONS.Shield size={16} /> 账号管理
             </button>
           </div>
        </div>
      )}
      
      {showSettings && (
        <div className="fixed inset-0 z-40" onClick={() => setShowSettings(false)}></div>
      )}
    </div>
  );

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout} 
      title="接待管理看板"
      rightAction={currentUser.role === 'ADMIN' ? renderAdminTools() : null}
    >
      <div className="space-y-8">
        
        {/* Welcome & Primary Actions - Reorganized for Visual Impact */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          
          {/* Hero / Date Section */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-stone-100 flex flex-col justify-center relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-32 h-32 bg-wood-100 rounded-bl-full opacity-50 transition-transform group-hover:scale-110"></div>
            <h2 className="text-3xl font-serif font-bold text-zen-900 mb-2 relative z-10">
              {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
            </h2>
            <p className="text-stone-500 mb-6 relative z-10">今日有 {visits.filter(v => {
              const today = new Date().toISOString().split('T')[0];
              return v.startDate <= today && v.endDate >= today;
            }).length} 组贵宾来访</p>
            <div className="flex items-center gap-2 text-sm text-wood-600 font-medium">
              <ICONS.Sparkles size={16} />
              <span>春风以此，青草自来</span>
            </div>
          </div>

          {/* Primary Action 1: New Visit (Prominent) */}
          {currentUser.role === 'ADMIN' && (
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-zen-700 text-white p-8 rounded-2xl shadow-lg shadow-zen-200 flex flex-col items-start justify-between hover:bg-zen-800 transition-all hover:-translate-y-1 group relative overflow-hidden"
            >
              <div className="absolute -right-4 -bottom-4 text-zen-600/30 transform group-hover:scale-110 transition-transform duration-500">
                <ICONS.Plus size={120} />
              </div>
              <div className="bg-white/20 p-3 rounded-full mb-4 backdrop-blur-sm">
                <ICONS.Plus size={24} className="text-white" />
              </div>
              <div className="text-left relative z-10">
                <h3 className="text-xl font-bold font-serif mb-1">新增来访接待</h3>
                <p className="text-zen-200 text-sm">创建新的行程与筹备任务</p>
              </div>
            </button>
          )}

          {/* Primary Action 2: Weekly Briefing (Prominent) */}
          <button 
            onClick={() => setShowBriefing(true)}
            className="bg-white border-2 border-dashed border-stone-200 text-stone-600 p-8 rounded-2xl hover:border-wood-400 hover:bg-wood-50/30 transition-all hover:-translate-y-1 group flex flex-col items-start justify-between"
          >
             <div className="bg-stone-100 p-3 rounded-full mb-4 group-hover:bg-wood-100 group-hover:text-wood-600 transition-colors">
                <ICONS.FileText size={24} />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold font-serif text-stone-800 mb-1">生成本周简报</h3>
                <p className="text-stone-400 text-sm group-hover:text-stone-500">一键导出图片用于分享</p>
              </div>
          </button>
        </div>

        {/* Calendar View */}
        <CalendarView 
          visits={visits} 
          onSelectVisit={setSelectedVisit} 
        />
      </div>

      {/* Modals */}
      {selectedVisit && (
        <VisitDetailModal 
          visit={selectedVisit} 
          onClose={() => setSelectedVisit(null)} 
          onUpdate={handleVisitUpdate}
          onDelete={() => handleDeleteVisit(selectedVisit.id)}
        />
      )}

      {showBriefing && (
        <WeeklyBriefing 
          visits={visits}
          onClose={() => setShowBriefing(false)}
        />
      )}

      {showImport && (
        <BatchImportModal
          onClose={() => setShowImport(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}

      {showAddModal && (
        <AddVisitModal
          onClose={() => setShowAddModal(false)}
          onSave={handleAddVisit}
        />
      )}

      {showUserMgr && (
        <UserManagementModal
          onClose={() => setShowUserMgr(false)}
        />
      )}

      {/* Footer Info */}
      <div className="mt-12 text-center text-xs text-stone-300 pb-8 font-serif tracking-widest opacity-60">
        VISITOR PRO SYSTEM • {new Date().getFullYear()}
      </div>
    </Layout>
  );
};

export default App;