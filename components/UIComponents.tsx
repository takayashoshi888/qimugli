import React from 'react';
import { X } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className = '' }) => (
  <div className={`bg-surface rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 transition-colors duration-300 ${className}`}>
    {children}
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ 
  children, variant = 'primary', className = '', ...props 
}) => {
  const variants = {
    primary: 'bg-primary text-white hover:opacity-90 shadow-lg shadow-primary/20 border-transparent',
    secondary: 'bg-surface text-content border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700',
    danger: 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-transparent hover:bg-red-100 dark:hover:bg-red-900/30'
  };
  return (
    <button 
      className={`px-4 py-2 rounded-lg font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed border ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-muted mb-1">{label}</label>
    <input 
      className={`w-full px-3 py-2 bg-surface border border-gray-300 dark:border-gray-600 text-content rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors placeholder-gray-400 ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label: string }> = ({ label, children, className = '', ...props }) => (
  <div className="mb-4">
    <label className="block text-sm font-medium text-muted mb-1">{label}</label>
    <select 
      className={`w-full px-3 py-2 bg-surface border border-gray-300 dark:border-gray-600 text-content rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);

export const Badge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    submitted: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    active: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    completed: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  };
  
  const labels: Record<string, string> = {
    submitted: '待审核',
    approved: '已通过',
    rejected: '已驳回',
    active: '进行中',
    completed: '已完工',
    pending: '筹备中'
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border border-transparent ${styles[status] || 'bg-gray-100'}`}>
      {labels[status] || status}
    </span>
  );
};

export const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ 
  isOpen, onClose, title, children 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-surface rounded-2xl shadow-2xl w-full max-w-md animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center p-5 border-b dark:border-gray-700">
          <h3 className="font-bold text-lg text-content">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-content p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};