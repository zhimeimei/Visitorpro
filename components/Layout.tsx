import React from 'react';
import { ICONS, APP_NAME } from '../constants';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User | null;
  onLogout: () => void;
  title?: string;
  rightAction?: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, title, rightAction }) => {
  return (
    <div className="min-h-screen bg-stone-50 flex flex-col font-sans text-stone-800 rice-paper-texture">
      {/* Header - Transparent & Airy */}
      <header className="sticky top-0 z-30 bg-stone-50/90 backdrop-blur-sm border-b border-stone-200/50 transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Minimal Text Logo */}
            <div className="flex items-baseline gap-2 group cursor-default">
              <span className="font-serif font-bold text-2xl text-zen-800 tracking-wide">春风</span>
              <span className="font-serif text-sm text-stone-400 italic">VisitorPro</span>
            </div>
            
            {title && (
              <div className="hidden md:flex items-center gap-3">
                 <div className="h-4 w-px bg-stone-300 rotate-12"></div>
                 <span className="text-sm text-stone-500 font-serif tracking-wide">{title}</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-5">
            {rightAction}
            
            <div className="flex items-center gap-3 pl-5 border-l border-stone-200">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-sm font-medium text-stone-700 font-serif">{currentUser?.name}</span>
              </div>
              <button 
                onClick={onLogout}
                className="p-2 text-stone-400 hover:text-red-700 hover:bg-red-50/50 rounded-full transition-colors"
                title="退出登录"
              >
                <ICONS.LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
        {children}
      </main>
    </div>
  );
};

export default Layout;