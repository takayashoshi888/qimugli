
import React, { useState, useEffect } from 'react';
import { User, WorkRecord, Site, Team, ThemeConfig } from '../types';
import { DataService } from '../services/mockData';
import { generateInsightReport } from '../services/geminiService';
import { Card, Badge, Button, Modal, Input, Select } from '../components/UIComponents';
import { CalendarView } from '../components/CalendarView';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

import { LayoutDashboard, FileText, Users, Map, Wand2, Loader2, MapPin, Download, Edit, Trash2, Plus, UserPlus, Building2, Briefcase, UserCog, UserMinus, FileDown, Menu, LogOut, Settings, Sun, Moon, Palette, ChevronRight, X, Calendar as CalendarIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AdminDashboardProps {
  user: User;
  onLogout: () => void;
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

type ViewType = 'dashboard' | 'records' | 'calendar' | 'sites' | 'users' | 'teams';

type ChartSize = {
  width: number;
  height: number;
};

const MeasuredChart: React.FC<{
  children: (size: ChartSize) => React.ReactNode;
  className?: string;
  minHeight?: number;
}> = ({ children, className = '', minHeight = 250 }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<ChartSize>({ width: 0, height: minHeight });

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateSize = () => {
      const rect = element.getBoundingClientRect();
      const nextSize = {
        width: Math.max(Math.floor(rect.width), 0),
        height: Math.max(Math.floor(rect.height), minHeight),
      };

      setSize((prev) => (
        prev.width === nextSize.width && prev.height === nextSize.height ? prev : nextSize
      ));
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    if (typeof ResizeObserver === 'undefined') {
      return () => window.removeEventListener('resize', updateSize);
    }

    const observer = new ResizeObserver(updateSize);
    observer.observe(element);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateSize);
    };
  }, [minHeight]);

  const isReady = size.width > 0 && size.height > 0;

  return (
    <div ref={containerRef} className={className} style={{ minHeight }}>
      {isReady ? (
        children(size)
      ) : (
        <div className="h-full flex items-center justify-center text-muted text-sm">
          图表加载中...
        </div>
      )}
    </div>
  );
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, onLogout, theme, setTheme }) => {

  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [aiReport, setAiReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'site' | 'user' | 'team' | 'teamMembers' | 'record'>('site');
  const [editingItem, setEditingItem] = useState<any>({});
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');

  // Calendar Detail Modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateRecords, setSelectedDateRecords] = useState<WorkRecord[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Filters
  const [filterSite, setFilterSite] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const refreshData = async () => {
    const [recordsData, sitesData, usersData, teamsData] = await Promise.all([
      DataService.getRecords(),
      DataService.getSites(),
      DataService.getUsers(),
      DataService.getTeams()
    ]);
    setRecords(recordsData);
    setSites(sitesData);
    setUsers(usersData);
    setTeams(teamsData);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- Theme Helpers ---
  const colorOptions = [
      { name: '商务蓝', value: '37 99 235', hex: '#2563eb' },
      { name: '极光紫', value: '124 58 237', hex: '#7c3aed' },
      { name: '森林绿', value: '5 150 105', hex: '#059669' },
      { name: '活力橙', value: '234 88 12', hex: '#ea580c' },
      { name: '玫瑰红', value: '225 29 72', hex: '#e11d48' },
  ];

  const changePrimaryColor = (colorValue: string) => {
      setTheme({ ...theme, primaryColor: colorValue });
  };

  // --- Data Processing ---
  const costData = records.reduce((acc, curr) => {
    const total = curr.costs.parking + curr.costs.transport + curr.costs.highway;
    const existing = acc.find(a => a.name === curr.siteName);
    if (existing) {
      existing.value += total;
    } else {
      acc.push({ name: curr.siteName, value: total });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const statusData = [
    { name: '待审核', value: records.filter(r => r.status === 'submitted').length, color: '#eab308' },
    { name: '已通过', value: records.filter(r => r.status === 'approved').length, color: '#22c55e' },
    { name: '已驳回', value: records.filter(r => r.status === 'rejected').length, color: '#ef4444' },
  ];

  // --- Handlers ---
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setAiReport('');
    const report = await generateInsightReport(records);
    setAiReport(report);
    setIsGenerating(false);
  };

  const handleApprove = async (id: string) => { await DataService.updateRecordStatus(id, 'approved'); await refreshData(); };
  const handleReject = async (id: string) => { await DataService.updateRecordStatus(id, 'rejected'); await refreshData(); };
  const handleDeleteRecord = async (id: string) => { if (confirm('确定要删除?')) { await DataService.deleteRecord(id); await refreshData(); }};

  const handleExportCSV = () => {
     const headers = ['ID,日期,星期,类型,员工/团队,现场,人数,停车费,交通费,高速费,总费用,状态,备注'];
    const csvRows = records.map(r => {
        const total = r.costs.parking + r.costs.transport + r.costs.highway;
        const type = r.teamName ? '团队' : '个人';
        const name = r.teamName ? r.teamName : r.userName;
        return `${r.id},${r.date},${r.dayOfWeek},${type},${name},${r.siteName},${r.headCount},${r.costs.parking},${r.costs.transport},${r.costs.highway},${total},${r.status},"${r.notes || ''}"`;
    });
    const csvContent = "\uFEFF" + [headers, ...csvRows].join('\n'); 
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FieldLink_Report.csv`;
    link.click();
  };

  // Improved PDF Export using html2canvas
  const handleExportPDF = async () => {
    const title = "FieldLink_Pro_管理报表";

    // Create a temporary container for the table
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '0';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = '"SimHei", "Microsoft YaHei", sans-serif'; 

    let totalCost = 0;

    const rowsHtml = records.map((r, index) => {
        const cost = r.costs.parking + r.costs.transport + r.costs.highway;
        totalCost += cost;
        const name = r.teamName ? `${r.teamName} (团队)` : r.userName;
        
        return `
            <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${r.date}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${name}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${r.siteName}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${r.headCount}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">¥${cost}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${r.status.toUpperCase()}</td>
            </tr>
        `;
    }).join('');

    const htmlContent = `
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px;">管理数据报表</h1>
            <p style="font-size: 12px; color: #6b7280;">FieldLink Pro - Admin Report</p>
            <p style="font-size: 12px; color: #6b7280;">生成日期: ${new Date().toLocaleDateString()}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="background-color: #2563eb; color: white;">
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">日期</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">员工/团队</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">现场</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">人数</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">费用</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">状态</th>
                </tr>
            </thead>
            <tbody>
                ${rowsHtml}
            </tbody>
            <tfoot>
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                     <td colspan="4" style="border: 1px solid #e5e7eb; padding: 8px; text-align: right; font-size: 12px;">合计:</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">¥${totalCost}</td>
                    <td style="border: 1px solid #e5e7eb; padding: 8px;"></td>
                </tr>
            </tfoot>
        </table>
    `;

    container.innerHTML = htmlContent;
    document.body.appendChild(container);

    try {
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${title}.pdf`);
    } catch (error) {
        console.error("PDF generation failed:", error);
        alert("PDF 生成失败，请重试");
    } finally {
        document.body.removeChild(container);
    }
  };

  const handleAddMemberToTeam = () => {
      if (!selectedUserIdToAdd || !editingItem?.id) return;
      const user = users.find(u => u.id === selectedUserIdToAdd);
      if (user) {
          DataService.saveUser({ ...user, teamId: editingItem.id });
          refreshData();
          setSelectedUserIdToAdd('');
      }
  };

  const handleRemoveMemberFromTeam = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          DataService.saveUser({ ...user, teamId: undefined });
          refreshData();
      }
  };

  // --- Modal & Item Management ---
  const openModal = (type: any, item?: any) => {
    setModalType(type);
    
    if (type === 'user' && !item) {
        // For new users, set default role and empty credentials
        setEditingItem({ role: 'STAFF', username: '', password: '', name: '' });
    } else if (type === 'site' && !item) {
        // For new sites, set default status to active so it appears in client dashboard
        setEditingItem({ name: '', address: '', status: 'active' });
    } else if (type === 'team' && !item) {
        setEditingItem({ name: '', leaderId: '' });
    } else {
        setEditingItem(item ? JSON.parse(JSON.stringify(item)) : {});
    }
    
    setSelectedUserIdToAdd('');
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const item = editingItem;

    try {
      if (modalType === 'site') {
        await DataService.saveSite(item);
      }

      if (modalType === 'team') {
        if (!item.name?.trim()) {
          alert('请输入团队名称');
          return;
        }

        await DataService.saveTeam({ ...item, name: item.name.trim() });
      }

      if (modalType === 'user') {
          // Basic validation for users
          if (!item.username || !item.password) {
              alert("请输入用户名和密码");
              return;
          }
          await DataService.saveUser(item);
      }

      if (modalType !== 'teamMembers') {
          setIsModalOpen(false);
          await refreshData();
      }
    } catch (error: any) {
      alert(error?.message || '保存失败，请稍后重试');
    }
  };


  const handleDeleteItem = (type: 'site' | 'user' | 'team', id: string) => {
      if (confirm('确定删除?')) {
          if (type === 'site') DataService.deleteSite(id);
          if (type === 'team') DataService.deleteTeam(id);
          if (type === 'user') DataService.deleteUser(id);
          refreshData();
      }
  };

  // --- Navigation Components ---
  const NavItem = ({ view, icon: Icon, label }: { view: ViewType; icon: any; label: string }) => (
    <button 
        onClick={() => { setCurrentView(view); setIsMobileMenuOpen(false); }}
        className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 font-medium ${
            currentView === view 
            ? 'bg-primary text-white shadow-md shadow-primary/30' 
            : 'text-muted hover:bg-gray-100 dark:hover:bg-white/5 hover:text-content'
        }`}
    >
      <Icon size={20} />
      <span>{label}</span>
      {currentView === view && <ChevronRight size={16} className="ml-auto opacity-60" />}
    </button>
  );

  const SidebarContent = () => (
      <div className="flex flex-col h-full">
          <div className="p-6 mb-2">
            <h2 className="text-2xl font-extrabold text-primary tracking-tight flex items-center gap-2">
               <div className="w-8 h-8 bg-gradient-to-br from-primary to-blue-400 rounded-lg flex items-center justify-center text-white shadow-lg shadow-primary/30">
                    <Briefcase size={18} />
               </div>
               FieldLink
            </h2>
            <p className="text-xs font-medium text-muted mt-1 ml-10 tracking-wider uppercase">Pro Admin</p>
          </div>
          
          <nav className="flex-1 px-4 space-y-1 overflow-y-auto custom-scrollbar">
            <div className="text-xs font-bold text-muted uppercase tracking-wider px-4 py-2 mb-1 mt-2">概览</div>
            <NavItem view="dashboard" icon={LayoutDashboard} label="数据仪表盘" />
            
            <div className="text-xs font-bold text-muted uppercase tracking-wider px-4 py-2 mb-1 mt-6">业务管理</div>
            <NavItem view="records" icon={FileText} label="工时记录" />
            <NavItem view="calendar" icon={CalendarIcon} label="排班日历" />
            <NavItem view="sites" icon={Map} label="现场管理" />
            
            <div className="text-xs font-bold text-muted uppercase tracking-wider px-4 py-2 mb-1 mt-6">人员组织</div>
            <NavItem view="teams" icon={Building2} label="团队管理" />
            <NavItem view="users" icon={Users} label="用户管理" />
          </nav>

          <div className="p-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-gray-700">
                <img src={user.avatar || "https://picsum.photos/100/100"} alt="Admin" className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-600 shadow-sm" />
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-content truncate">{user.name}</p>
                    <p className="text-xs text-muted truncate">超级管理员</p>
                </div>
                <button onClick={onLogout} className="text-muted hover:text-red-500 p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="退出登录">
                    <LogOut size={18} />
                </button>
            </div>
          </div>
      </div>
  );

  // --- Render Functions ---
  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="relative overflow-hidden !p-0 border-0">
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-blue-400 opacity-90"></div>
                <div className="relative p-6 text-white">
                    <h3 className="text-blue-100 text-sm font-medium mb-1">本月总支出</h3>
                    <p className="text-3xl font-bold">¥ {records.reduce((acc, r) => acc + r.costs.parking + r.costs.transport + r.costs.highway, 0).toLocaleString()}</p>
                    <div className="mt-4 bg-white/20 backdrop-blur-sm inline-block px-3 py-1 rounded-full text-xs">
                        较上月 +12%
                    </div>
                </div>
            </Card>
            <Card className="flex flex-col justify-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h3 className="text-muted text-sm font-medium">总工时记录</h3>
                        <p className="text-2xl font-bold text-content">{records.length} <span className="text-sm text-muted font-normal">条</span></p>
                    </div>
                </div>
            </Card>
            <Card className="flex flex-col justify-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                        <MapPin size={24} />
                    </div>
                    <div>
                        <h3 className="text-muted text-sm font-medium">活跃现场</h3>
                        <p className="text-2xl font-bold text-content">{sites.filter(s => s.status === 'active').length} <span className="text-sm text-muted font-normal">个</span></p>
                    </div>
                </div>
            </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-[400px] flex flex-col">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-content text-lg">各现场费用支出</h3>
                </div>
                {costData.length > 0 ? (
                    <MeasuredChart className="flex-1 w-full" minHeight={250}>
                        {({ width, height }) => (
                            <BarChart width={width} height={height} data={costData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.mode === 'dark' ? '#374151' : '#e5e7eb'} />
                                <XAxis dataKey="name" tick={{fontSize: 12, fill: theme.mode === 'dark' ? '#9ca3af' : '#4b5563'}} interval={0} />
                                <YAxis tick={{fontSize: 12, fill: theme.mode === 'dark' ? '#9ca3af' : '#4b5563'}} />
                                <Tooltip 
                                    cursor={{fill: theme.mode === 'dark' ? '#374151' : '#f3f4f6'}}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="value" fill={theme.mode === 'dark' ? theme.primaryColor : `rgb(${theme.primaryColor})`} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        )}
                    </MeasuredChart>
                ) : (
                    <div className="flex-1 w-full min-h-[250px] flex items-center justify-center text-muted text-sm">
                        暂无数据
                    </div>
                )}
            </Card>
            <Card className="h-[400px] flex flex-col">
                <h3 className="font-bold text-content text-lg mb-6">记录状态分布</h3>
                {records.length > 0 ? (
                    <MeasuredChart className="flex-1 w-full" minHeight={250}>
                        {({ width, height }) => {
                            const outerRadius = Math.max(Math.min(Math.min(width, height) * 0.28, 110), 70);
                            const innerRadius = Math.max(outerRadius - 30, 40);

                            return (
                                <PieChart width={width} height={height}>
                                    <Pie 
                                        data={statusData} 
                                        dataKey="value" 
                                        nameKey="name" 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={innerRadius} 
                                        outerRadius={outerRadius} 
                                        paddingAngle={5}
                                    >
                                        {statusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '8px' }} />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            );
                        }}
                    </MeasuredChart>
                ) : (
                    <div className="flex-1 w-full min-h-[250px] flex items-center justify-center text-muted text-sm">
                        暂无数据
                    </div>
                )}
            </Card>
        </div>


        <Card className="border-primary/20 bg-primary/5 relative overflow-hidden">
             <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center mb-4 relative z-10">
                <h3 className="font-bold text-content flex items-center gap-2">
                    <Wand2 size={20} className="text-primary" /> AI 智能分析报告 (Gemini 2.5)
                </h3>
                <Button onClick={handleGenerateReport} disabled={isGenerating} className="flex items-center gap-2 text-sm shadow-none">
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    {isGenerating ? '分析中...' : '生成报告'}
                </Button>
            </div>
            <div className="bg-surface p-6 rounded-xl border border-primary/10 min-h-[100px] text-sm leading-relaxed text-content whitespace-pre-line shadow-sm relative z-10">
                {aiReport || "点击生成按钮，让 AI 助手深入分析当前工作数据，提供优化建议。"}
            </div>
        </Card>
    </div>
  );

  // Simple View Renderers
  const renderTable = (columns: any[], data: any[], actions: (item: any) => React.ReactNode) => (
    <Card className="overflow-hidden border-0 shadow-sm">
        <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left text-sm text-muted" id="records-table">
                <thead className="bg-gray-50 dark:bg-white/5 text-content font-semibold border-b dark:border-gray-700">
                    <tr>{columns.map((c, i) => <th key={i} className="p-4 whitespace-nowrap">{c}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {data.map((item) => actions(item))}
                </tbody>
            </table>
        </div>
    </Card>
  );

  const renderRecords = () => {
      const filteredRecords = records.filter(r => {
          const matchSite = !filterSite || r.siteName === filterSite;
          const matchUser = !filterUser || r.userName === filterUser;
          const matchStatus = !filterStatus || r.status === filterStatus;
          return matchSite && matchUser && matchStatus;
      });

      return (
          <div className="space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-xl font-bold text-content">工时记录</h2>
                <div className="flex gap-2">
                    <Button variant="secondary" onClick={handleExportPDF} className="flex items-center gap-2 text-xs"><FileDown size={14}/> 导出PDF</Button>
                    <Button variant="secondary" onClick={handleExportCSV} className="flex items-center gap-2 text-xs"><Download size={14}/> 导出CSV</Button>
                </div>
            </div>

            <Card className="p-4 border-0 shadow-sm bg-gray-50/50 dark:bg-white/5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Select 
                        value={filterSite} 
                        onChange={e => setFilterSite(e.target.value)}
                        label="按现场筛选"
                    >
                        <option value="">全部现场</option>
                        {sites.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </Select>
                    <Select 
                        value={filterUser} 
                        onChange={e => setFilterUser(e.target.value)}
                        label="按填报人筛选"
                    >
                        <option value="">全部人员</option>
                        {users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                    </Select>
                    <Select 
                        value={filterStatus} 
                        onChange={e => setFilterStatus(e.target.value)}
                        label="按状态筛选"
                    >
                        <option value="">全部状态</option>
                        <option value="submitted">待审核</option>
                        <option value="approved">已通过</option>
                        <option value="rejected">已驳回</option>
                    </Select>
                </div>
            </Card>

            {renderTable(
                ['日期', '填报人', '性质', '现场', '人数', '总费用', '状态', '审核', '操作'],
                filteredRecords,
                (r) => (
                    <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4">{r.date}</td>
                        <td className="p-4 font-medium text-content">{r.userName}</td>
                        <td className="p-4">{r.teamName ? <Badge status="active"/> : <span className="text-xs text-muted">个人</span>}</td>
                        <td className="p-4">{r.siteName}</td>
                        <td className="p-4">{r.headCount}</td>
                        <td className="p-4 font-mono">¥{(r.costs.parking + r.costs.transport + r.costs.highway).toLocaleString()}</td>
                        <td className="p-4"><Badge status={r.status} /></td>
                        <td className="p-4">
                            {r.status === 'submitted' && (
                                <div className="flex gap-2">
                                    <button onClick={() => handleApprove(r.id)} className="text-green-600 text-xs font-bold hover:underline">通过</button>
                                    <button onClick={() => handleReject(r.id)} className="text-red-500 text-xs font-bold hover:underline">驳回</button>
                                </div>
                            )}
                        </td>
                        <td className="p-4 flex gap-2">
                            <button onClick={() => openModal('record', r)} className="text-primary hover:bg-primary/10 p-1 rounded"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteRecord(r.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={16}/></button>
                        </td>
                    </tr>
                )
            )}
          </div>
      );
  };

  // --- Main Layout ---
  return (
    <div className="min-h-screen bg-background transition-colors duration-300 flex">
      {/* Desktop Sidebar */}
      <aside className="w-72 bg-surface border-r border-gray-200 dark:border-gray-800 h-screen sticky top-0 hidden md:block shadow-xl shadow-gray-200/50 dark:shadow-none z-20">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
              <div className="absolute left-0 top-0 bottom-0 w-3/4 max-w-xs bg-surface shadow-2xl animate-in slide-in-from-left duration-300">
                  <SidebarContent />
              </div>
          </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col h-screen">
         {/* Mobile Header */}
         <header className="md:hidden h-16 bg-surface border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-10">
             <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 -ml-2 text-content">
                 <Menu size={24} />
             </button>
             <span className="font-bold text-lg text-primary">FieldLink Admin</span>
             <button onClick={() => setIsThemePanelOpen(true)} className="p-2 -mr-2 text-content">
                 <Settings size={20} />
             </button>
         </header>

         {/* Desktop Header (Theme Toggle only mainly) */}
         <header className="hidden md:flex h-16 items-center justify-end px-8 gap-4 bg-background/80 backdrop-blur sticky top-0 z-10">
            <button 
                onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
                className="p-2 rounded-full bg-surface border border-gray-200 dark:border-gray-700 text-muted hover:text-primary shadow-sm transition-all hover:scale-105 active:scale-95"
            >
                <Palette size={20} />
            </button>
         </header>

         {/* Content Scroll Area */}
         <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24 scroll-smooth">
             {/* Theme Panel (Dropdown style) */}
             {isThemePanelOpen && (
                 <div className="fixed md:absolute right-4 top-16 md:right-8 md:top-16 w-72 bg-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 z-40 animate-in fade-in zoom-in duration-200 origin-top-right">
                     <div className="flex justify-between items-center mb-4">
                         <h3 className="font-bold text-content">界面设置</h3>
                         <button onClick={() => setIsThemePanelOpen(false)}><X size={16} className="text-muted"/></button>
                     </div>
                     
                     <div className="mb-6">
                         <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">模式</label>
                         <div className="grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                             <button 
                                onClick={() => setTheme({...theme, mode: 'light'})}
                                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${theme.mode === 'light' ? 'bg-white text-primary shadow-sm' : 'text-muted'}`}
                             >
                                 <Sun size={16} /> 浅色
                             </button>
                             <button 
                                onClick={() => setTheme({...theme, mode: 'dark'})}
                                className={`flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${theme.mode === 'dark' ? 'bg-gray-700 text-white shadow-sm' : 'text-muted'}`}
                             >
                                 <Moon size={16} /> 深色
                             </button>
                         </div>
                     </div>

                     <div>
                         <label className="text-xs font-semibold text-muted uppercase tracking-wider mb-3 block">主题色</label>
                         <div className="grid grid-cols-5 gap-2">
                             {colorOptions.map(color => (
                                 <button
                                    key={color.value}
                                    onClick={() => changePrimaryColor(color.value)}
                                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 ${theme.primaryColor === color.value ? 'ring-2 ring-offset-2 ring-offset-surface ring-gray-400' : ''}`}
                                    style={{ backgroundColor: color.hex }}
                                    title={color.name}
                                 >
                                     {theme.primaryColor === color.value && <div className="w-2 h-2 bg-white rounded-full" />}
                                 </button>
                             ))}
                         </div>
                     </div>
                 </div>
             )}

             {/* Dynamic View Rendering */}
             <div className="max-w-6xl mx-auto">
                {currentView === 'dashboard' && renderDashboard()}
                {currentView === 'records' && renderRecords()}
                {currentView === 'calendar' && (
                     <div className="space-y-4">
                         <h2 className="text-xl font-bold text-content">全员排班日历</h2>
                         <CalendarView 
                            records={records} 
                            onDateClick={(date, dailyRecords) => {
                                setSelectedDate(date);
                                setSelectedDateRecords(dailyRecords);
                                setIsDetailModalOpen(true);
                            }}
                         />
                     </div>
                )}
                {currentView === 'sites' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold text-content">现场管理</h2>
                            <Button onClick={() => openModal('site')}><Plus size={18} className="mr-1"/> 新增</Button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {sites.map(site => (
                                <Card key={site.id} className="group relative hover:border-primary/50 transition-colors">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-lg text-content">{site.name}</h3>
                                            <p className="text-muted text-sm mt-1 flex items-center gap-1"><MapPin size={14}/> {site.address}</p>
                                        </div>
                                        <Badge status={site.status}/>
                                    </div>
                                    <div className="mt-4 pt-4 border-t dark:border-gray-700 flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                                        <Button variant="secondary" className="text-xs py-1" onClick={() => openModal('site', site)}>编辑</Button>
                                        <Button variant="danger" className="text-xs py-1" onClick={() => handleDeleteItem('site', site.id)}>删除</Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
                {currentView === 'users' && (
                     <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h2 className="text-xl font-bold text-content">用户列表</h2>
                             <Button onClick={() => openModal('user')}><UserPlus size={18} className="mr-1"/> 新增</Button>
                         </div>
                         {renderTable(['用户', '角色', '团队', '操作'], users, (u) => (
                             <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                 <td className="p-4 flex items-center gap-3">
                                     <img src={u.avatar} className="w-8 h-8 rounded-full"/>
                                     <div>
                                         <div className="font-medium text-content">{u.name}</div>
                                         <div className="text-xs text-muted">@{u.username}</div>
                                     </div>
                                 </td>
                                 <td className="p-4"><span className={`text-xs px-2 py-1 rounded ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{u.role}</span></td>
                                 <td className="p-4 text-muted">{teams.find(t => t.id === u.teamId)?.name || '-'}</td>
                                 <td className="p-4 flex gap-2">
                                    <button onClick={() => openModal('user', u)} className="text-primary p-1"><Edit size={16}/></button>
                                    <button onClick={() => handleDeleteItem('user', u.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                                 </td>
                             </tr>
                         ))}
                     </div>
                )}
                {currentView === 'teams' && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                             <h2 className="text-xl font-bold text-content">团队列表</h2>
                             <Button onClick={() => openModal('team')}><Plus size={18} className="mr-1"/> 创建团队</Button>
                         </div>
                         {renderTable(['团队名称', '负责人', '操作'], teams, (t) => (
                             <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-white/5">
                                 <td className="p-4 font-medium text-content">{t.name}</td>
                                 <td className="p-4 text-muted">{users.find(u => u.id === t.leaderId)?.name || '未分配'}</td>
                                 <td className="p-4 flex gap-2">
                                     <Button variant="secondary" className="text-xs py-1 flex items-center gap-1" onClick={() => openModal('teamMembers', t)}><UserCog size={14}/> 成员</Button>
                                     <button onClick={() => openModal('team', t)} className="text-primary p-1"><Edit size={16}/></button>
                                     <button onClick={() => handleDeleteItem('team', t.id)} className="text-red-500 p-1"><Trash2 size={16}/></button>
                                 </td>
                             </tr>
                         ))}
                    </div>
                )}
             </div>
         </div>
      </main>

      {/* Modals (Generic + Specific) */}
      <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title={modalType === 'teamMembers' ? `成员管理 - ${editingItem?.name}` : '编辑信息'}
      >
         {modalType === 'teamMembers' ? (
             <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                    <label className="text-xs font-bold text-muted uppercase mb-2 block">添加成员</label>
                    <div className="flex gap-2">
                        <select 
                            className="flex-1 bg-surface border border-gray-300 dark:border-gray-600 rounded-lg text-sm px-3 py-2 outline-none text-content"
                            value={selectedUserIdToAdd}
                            onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                        >
                            <option value="">选择用户...</option>
                            {users.filter(u => u.teamId !== editingItem?.id).map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <Button onClick={handleAddMemberToTeam} disabled={!selectedUserIdToAdd} className="whitespace-nowrap">添加</Button>
                    </div>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {users.filter(u => u.teamId === editingItem?.id).map(member => (
                        <div key={member.id} className="py-3 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <img src={member.avatar} className="w-8 h-8 rounded-full"/>
                                <span className="text-sm font-medium text-content">{member.name}</span>
                            </div>
                            <button onClick={() => handleRemoveMemberFromTeam(member.id)} className="text-red-500 p-1 hover:bg-red-50 rounded"><UserMinus size={16}/></button>
                        </div>
                    ))}
                </div>
             </div>
         ) : (
            <form onSubmit={handleModalSubmit} className="space-y-4">
                 {modalType === 'site' && (
                     <>
                        <Input label="名称" value={editingItem?.name || ''} onChange={e=>setEditingItem({...editingItem, name: e.target.value})} />
                        <Input label="地址" value={editingItem?.address || ''} onChange={e=>setEditingItem({...editingItem, address: e.target.value})} />
                        <Select 
                            label="状态" 
                            value={editingItem?.status || 'active'} 
                            onChange={e=>setEditingItem({...editingItem, status: e.target.value})}
                        >
                            <option value="active">进行中 (Active)</option>
                            <option value="pending">筹备中 (Pending)</option>
                            <option value="completed">已完工 (Completed)</option>
                        </Select>
                     </>
                 )}
                 {modalType === 'record' && (
                     <>
                        <Input type="date" label="日期" value={editingItem?.date} onChange={e => setEditingItem({...editingItem, date: e.target.value})}/>
                        <Input type="number" label="人数" value={editingItem?.headCount} onChange={e => setEditingItem({...editingItem, headCount: e.target.value})}/>
                        <div className="grid grid-cols-3 gap-2">
                            <Input label="停车" type="number" value={editingItem?.costs?.parking} onChange={e => setEditingItem({...editingItem, costs: {...editingItem.costs, parking: Number(e.target.value)}})}/>
                            <Input label="交通" type="number" value={editingItem?.costs?.transport} onChange={e => setEditingItem({...editingItem, costs: {...editingItem.costs, transport: Number(e.target.value)}})}/>
                            <Input label="高速" type="number" value={editingItem?.costs?.highway} onChange={e => setEditingItem({...editingItem, costs: {...editingItem.costs, highway: Number(e.target.value)}})}/>
                        </div>
                     </>
                 )}
                 {modalType === 'user' && (
                    <>
                        <Input label="姓名" value={editingItem?.name || ''} onChange={e=>setEditingItem({...editingItem, name: e.target.value})} />
                        <Input label="用户名 (登录账号)" value={editingItem?.username || ''} onChange={e=>setEditingItem({...editingItem, username: e.target.value})} />
                        <Input type="password" label="密码" value={editingItem?.password || ''} onChange={e=>setEditingItem({...editingItem, password: e.target.value})} />
                        <Select label="角色" value={editingItem?.role || 'STAFF'} onChange={e=>setEditingItem({...editingItem, role: e.target.value})}>
                            <option value="STAFF">现场人员</option>
                            <option value="ADMIN">管理员</option>
                        </Select>
                    </>
                 )}
                 {modalType === 'team' && (
                    <Input label="名称" value={editingItem?.name || ''} onChange={e=>setEditingItem({...editingItem, name: e.target.value})} />
                 )}
                 
                 <Button type="submit" className="w-full">保存更改</Button>
            </form>
         )}
      </Modal>

      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        title={`${selectedDate} 记录详情`}
      >
          <div className="space-y-3">
            {selectedDateRecords.length === 0 ? (
                <p className="text-muted text-center py-4">当日无记录</p>
            ) : (
                selectedDateRecords.map(r => (
                    <div key={r.id} className="border border-gray-100 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-white/5">
                        <div className="flex justify-between mb-2">
                            <div>
                                <span className="font-bold text-sm text-content">{r.userName}</span>
                                <span className="text-xs text-muted ml-2">{r.siteName}</span>
                            </div>
                            <Badge status={r.status} />
                        </div>
                        <div className="text-xs text-muted space-y-1">
                            <div>人数: {r.headCount} | 模式: {r.teamName || '个人'}</div>
                            <div>总费用: ¥{(r.costs.parking + r.costs.transport + r.costs.highway).toLocaleString()}</div>
                        </div>
                    </div>
                ))
            )}
          </div>
      </Modal>
    </div>
  );
};

export default AdminDashboard;
