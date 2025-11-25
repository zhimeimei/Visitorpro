
import React, { useState } from 'react';
import { dataService } from '../services/dataService';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = dataService.login(username, code);
    if (user) {
      onLoginSuccess();
    } else {
      setError('账号或登录码错误');
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-start pt-44 p-6 overflow-hidden">
      
      {/* Background Image Container */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-[60s] hover:scale-105"
          style={{ 
            backgroundImage: `url('https://raw.githubusercontent.com/zhimeimei/-/refs/heads/main/%E5%BE%AE%E4%BF%A1%E5%9B%BE%E7%89%87_20251124202134_177_3.jpg')` 
          }}
        ></div>
        
        {/* Overlay Layer - Extremely light to ensure landmark is visible */}
        <div className="absolute inset-0 bg-gradient-to-t from-stone-900/30 via-transparent to-transparent"></div>
      </div>

      {/* Main Content Card - Glassmorphism */}
      <div className="w-full max-w-[360px] z-10 animate-slide-up relative">
        
        {/* Glass Card Container - Added darker background for visibility */}
        <div className="bg-stone-900/50 backdrop-blur-md border border-white/20 shadow-2xl rounded-xl overflow-hidden p-8">
          
          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-8">
            <div className="space-y-6">
              <div className="group relative">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-transparent border-b border-white/60 py-3 text-center text-white placeholder-white/70 focus:border-white focus:outline-none transition-all font-serif tracking-widest text-xl placeholder:text-lg shadow-black/20 drop-shadow-md"
                  placeholder="账号"
                  required
                />
              </div>
              
              <div className="group relative">
                <input
                  type="password"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-transparent border-b border-white/60 py-3 text-center text-white placeholder-white/70 focus:border-white focus:outline-none transition-all font-serif tracking-widest text-xl placeholder:text-lg shadow-black/20 drop-shadow-md"
                  placeholder="登录码"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="text-red-100 text-sm text-center font-serif bg-red-900/40 py-2 rounded border border-red-200/20 backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                className="w-full bg-white/90 text-stone-900 py-3.5 rounded-lg font-serif font-bold hover:bg-white hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-500 tracking-[0.1em] text-lg backdrop-blur-sm"
              >
                愿爱指挥我们
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
