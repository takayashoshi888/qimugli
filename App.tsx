import React, { useState, useEffect } from 'react';
import { User, UserRole, ThemeConfig } from './types';
import { DataService } from './services/mockData';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Users, ShieldCheck, ArrowRight } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Theme State
  const [theme, setTheme] = useState<ThemeConfig>({
      mode: 'light',
      primaryColor: '37 99 235' // Default Blue
  });

  useEffect(() => {
      // Apply theme to document root
      const root = document.documentElement;
      
      // Handle Dark Mode Class
      if (theme.mode === 'dark') {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }

      // Handle CSS Variables for Colors
      root.style.setProperty('--color-primary', theme.primaryColor);
  }, [theme]);

  const allUsers = DataService.getUsers();
  const adminUser = allUsers.find(u => u.role === UserRole.ADMIN);
  const staffUser = allUsers.find(u => u.role === UserRole.STAFF);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // Login Screen
  if (!currentUser) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop")',
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        {/* Dark Overlay for contrast */}
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"></div>

        <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
            <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transition-all duration-300">
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl text-white mb-6 shadow-lg shadow-blue-500/30 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Users size={40} />
                </div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">FieldLink <span className="text-blue-600">Pro</span></h1>
                <p className="text-gray-500 mt-2 font-medium">智能现场人员综合管理系统</p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2 after:content-[''] after:h-px after:flex-1 after:bg-gray-200">
                    请选择登录身份 (演示)
                  </h3>
                  
                  <div className="space-y-4">
                    {/* Admin Login Simulation */}
                    <button
                      disabled={!adminUser}
                      onClick={() => adminUser && handleLogin(adminUser)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 transition-all duration-200 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                          <ShieldCheck size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-lg">系统管理员</p>
                          <p className="text-xs text-gray-500 group-hover:text-indigo-600 transition-colors">管理数据、用户与报表</p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                         <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-600" />
                      </div>
                    </button>

                    {/* Staff Login Simulation */}
                    <button
                       disabled={!staffUser}
                       onClick={() => staffUser && handleLogin(staffUser)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-gray-100 rounded-xl hover:border-blue-500 hover:shadow-lg hover:shadow-blue-100 transition-all duration-200 group text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                          <Users size={24} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-800 text-lg">现场工作人员</p>
                          <p className="text-xs text-gray-500 group-hover:text-blue-600 transition-colors">填报工时、查看记录</p>
                        </div>
                      </div>
                      <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                         <ArrowRight size={16} className="text-gray-300 group-hover:text-blue-600" />
                      </div>
                    </button>
                  </div>
                </div>
                
                <div className="text-center pt-6 border-t border-gray-100/50">
                   <p className="text-xs text-gray-400">© 2024 FieldLink Inc. All rights reserved.</p>
                   <p className="text-[10px] text-gray-300 mt-1">Powered by Google Gemini AI</p>
                </div>
              </div>
            </div>
        </div>
      </div>
    );
  }

  // Main App Layout
  return (
    <div className="min-h-screen bg-background text-content transition-colors duration-300">
      {currentUser.role === UserRole.ADMIN ? (
        <AdminDashboard user={currentUser} onLogout={handleLogout} theme={theme} setTheme={setTheme} />
      ) : (
        <>
            <div className="fixed top-4 right-4 z-50">
                <button 
                    onClick={handleLogout}
                    className="bg-surface/80 backdrop-blur-md px-4 py-2 rounded-full text-sm shadow-md border border-gray-100 dark:border-gray-700 hover:bg-surface hover:text-red-600 hover:shadow-lg transition-all font-medium text-muted flex items-center gap-2 group"
                >
                    <span>退出登录</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </div>
            <ClientDashboard user={currentUser} />
        </>
      )}
    </div>
  );
};

export default App;