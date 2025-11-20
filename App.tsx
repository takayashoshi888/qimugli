
import React, { useState, useEffect } from 'react';
import { User, UserRole, ThemeConfig } from './types';
import { DataService } from './services/mockData';
import ClientDashboard from './pages/ClientDashboard';
import AdminDashboard from './pages/AdminDashboard';
import { Users, ArrowRight, LogIn, UserPlus, Lock, User as UserIcon, AlertCircle, CheckCircle } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  
  // Auth Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (!username || !password) {
        setAuthError('请输入用户名和密码');
        return;
    }

    const user = DataService.login(username, password);
    if (user) {
        setCurrentUser(user);
        setAuthError('');
        setPassword(''); // Clear sensitive data
    } else {
        setAuthError('用户名或密码错误');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');

    if (!username || !password || !fullName || !confirmPassword) {
        setAuthError('请填写所有必填项');
        return;
    }

    if (password !== confirmPassword) {
        setAuthError('两次输入的密码不一致');
        return;
    }

    const result = DataService.register(fullName, username, password);
    if (result.success) {
        setAuthSuccess('注册成功！请使用新账号登录。');
        setIsRegistering(false);
        // Reset form but keep username for convenience
        setPassword('');
        setConfirmPassword('');
        setFullName('');
    } else {
        setAuthError(result.message || '注册失败，请重试');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setUsername('');
    setPassword('');
  };

  const toggleAuthMode = () => {
      setIsRegistering(!isRegistering);
      setAuthError('');
      setAuthSuccess('');
      setPassword('');
      setConfirmPassword('');
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
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl text-white mb-4 shadow-lg shadow-blue-500/30">
                  <Users size={32} />
                </div>
                <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">FieldLink <span className="text-blue-600">Pro</span></h1>
                <p className="text-gray-500 text-sm mt-1 font-medium">智能现场人员综合管理系统</p>
              </div>

              {authError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center gap-2">
                      <AlertCircle size={16} /> {authError}
                  </div>
              )}
              
              {authSuccess && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 text-sm rounded-lg flex items-center gap-2">
                      <CheckCircle size={16} /> {authSuccess}
                  </div>
              )}

              <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
                  {isRegistering && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">姓名</label>
                        <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="请输入真实姓名"
                            />
                        </div>
                      </div>
                  )}

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">用户名</label>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="请输入用户名"
                        />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-500 ml-1">密码</label>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                            placeholder="请输入密码"
                        />
                    </div>
                  </div>

                  {isRegistering && (
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 ml-1">确认密码</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input 
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                placeholder="请再次输入密码"
                            />
                        </div>
                      </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
                  >
                      {isRegistering ? <UserPlus size={20}/> : <LogIn size={20}/>}
                      {isRegistering ? '立即注册' : '登录系统'}
                  </button>
              </form>

              <div className="mt-6 text-center">
                  <button 
                    onClick={toggleAuthMode}
                    className="text-sm text-gray-500 hover:text-blue-600 font-medium transition-colors"
                  >
                      {isRegistering ? '已有账号？去登录' : '没有账号？注册新员工'}
                  </button>
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
