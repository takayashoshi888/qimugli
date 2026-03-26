
import React, { useState, useEffect, useCallback } from 'react';
import { User, WorkRecord, Site, Team, ThemeConfig } from '../types';
import { DataService, subscribeToDataChanges } from '../services/mockData';
import { dataSyncManager } from '../services/dataSync';
import { generateAvatarUrl, resolveAvatar } from '../src/avatar';

import { Card, Button, Input, Select, Badge, Modal } from '../components/UIComponents';
import { CalendarView } from '../components/CalendarView';
import { Plus, History, Calendar as CalendarIcon, MapPin, Users, DollarSign, Briefcase, FileDown, CheckCircle2, Palette, Sun, Moon, X } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface ClientDashboardProps {
  user: User;
  theme: ThemeConfig;
  setTheme: (theme: ThemeConfig) => void;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user, theme, setTheme }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history' | 'calendar'>('new');
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  
  // Calendar Detail Modal
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateRecords, setSelectedDateRecords] = useState<WorkRecord[]>([]);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    siteId: '',
    headCount: 1,
    parking: 0,
    transport: 0,
    highway: 0,
    notes: '',
    workMode: 'individual' as 'individual' | 'team',
    selectedTeamId: ''
  });

  // Theme Helpers
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

  const refreshData = useCallback(async () => {
    try {
      await dataSyncManager.initialize();
      
      const [recordsData, sitesData, teamsData, usersData] = await Promise.all([
        dataSyncManager.getRecords(user.id),
        DataService.getSites(),
        DataService.getTeams(),
        DataService.getUsers()
      ]);
      
      setRecords(recordsData);
      
      const activeSites = sitesData.filter(s => s.status === 'active');
      setSites(activeSites);
      setTeams(teamsData);
      setAllUsers(usersData);
      
      await dataSyncManager.syncPendingRecords();
      
      if (activeSites.length > 0 && !formData.siteId) {
        setFormData(prev => ({ ...prev, siteId: activeSites[0].id }));
      }
    } catch (error) {
      console.error('Data refresh failed:', error);
    }
  }, [formData.siteId, user.id]);

  useEffect(() => {
    refreshData();

    const unsubscribe = subscribeToDataChanges((entity) => {
      if (!entity || ['records', 'sites', 'teams', 'users'].includes(entity)) {
        refreshData();
      }
    });

    return unsubscribe;
  }, [refreshData]);


  const handleWorkModeChange = (mode: 'individual' | 'team') => {
    if (mode === 'individual') {
      setFormData(prev => ({ 
        ...prev, 
        workMode: mode, 
        headCount: 1, 
        selectedTeamId: '' 
      }));
    } else {
      const userTeamId = user.teamId || (teams.length > 0 ? teams[0].id : '');
      const teamSize = calculateTeamSize(userTeamId);
      setFormData(prev => ({ 
        ...prev, 
        workMode: mode, 
        selectedTeamId: userTeamId,
        headCount: teamSize
      }));
    }
  };

  const handleTeamChange = (teamId: string) => {
    const teamSize = calculateTeamSize(teamId);
    setFormData(prev => ({
      ...prev,
      selectedTeamId: teamId,
      headCount: teamSize
    }));
  };

  const calculateTeamSize = (teamId: string): number => {
    if (!teamId) return 1;
    const count = allUsers.filter(u => u.teamId === teamId).length;
    return count > 0 ? count : 1;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSite = sites.find(s => s.id === formData.siteId);
    if (!selectedSite) return;

    if (formData.workMode === 'team' && !formData.selectedTeamId) {
      alert('请选择团队');
      return;
    }

    let teamName = undefined;
    if (formData.workMode === 'team' && formData.selectedTeamId) {
        const team = teams.find(t => t.id === formData.selectedTeamId);
        teamName = team?.name;
    }

    const dayOfWeek = new Date(formData.date).toLocaleDateString('zh-CN', { weekday: 'long' });

    const newRecord: WorkRecord = {
      id: Date.now().toString(),
      userId: user.id,
      userName: user.name,
      date: formData.date,
      dayOfWeek,
      siteId: formData.siteId,
      siteName: selectedSite.name,
      headCount: Number(formData.headCount),
      costs: {
        parking: Number(formData.parking),
        transport: Number(formData.transport),
        highway: Number(formData.highway)
      },
      notes: formData.notes,
      status: 'submitted',
      teamId: formData.workMode === 'team' ? formData.selectedTeamId : undefined,
      teamName: teamName
    };

    try {
      await DataService.addRecord(newRecord);
      const syncResult = await dataSyncManager.saveRecords([newRecord], user.id);
      
      await refreshData();
      setActiveTab('history');
      setFormData(prev => ({ ...prev, parking: 0, transport: 0, highway: 0 }));
      
      alert(`提交成功，${syncResult.message}，并已同步到管理面板。`);
    } catch (error: any) {
      alert(error?.message || '提交失败，请重试');
      console.error(error);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      try {
        await DataService.deleteRecord(id);
        await dataSyncManager.removeRecord(id, user.id);
        await refreshData();
      } catch (error: any) {
        alert(error?.message || '删除失败，请稍后重试');
      }
    }
  };


  // Improved PDF Export using html2canvas to support Chinese characters
  const handleExportPDF = async () => {
    const title = `${user.name}_工作记录报表`;
    
    // Create a temporary container for the table
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '0';
    container.style.width = '210mm'; // A4 width
    container.style.backgroundColor = '#ffffff';
    container.style.padding = '20px';
    container.style.fontFamily = '"SimHei", "Microsoft YaHei", sans-serif'; // Try to use system Chinese fonts

    let totalCost = 0;
    
    const rowsHtml = records.map((record, index) => {
        const cost = record.costs.parking + record.costs.transport + record.costs.highway;
        totalCost += cost;
        const type = record.teamName ? `团队 (${record.teamName})` : "个人";
        const statusLabel = {
            submitted: '待审核',
            approved: '已通过',
            rejected: '已驳回'
        }[record.status] || record.status;

        return `
            <tr style="background-color: ${index % 2 === 0 ? '#f9fafb' : '#ffffff'};">
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${record.date}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${record.siteName}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${type}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${record.headCount}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">¥${cost}</td>
                <td style="border: 1px solid #e5e7eb; padding: 8px; font-size: 12px;">${statusLabel}</td>
            </tr>
        `;
    }).join('');

    const htmlContent = `
        <div style="margin-bottom: 20px;">
            <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 8px;">工作记录报表</h1>
            <p style="font-size: 12px; color: #6b7280;">员工: ${user.name}</p>
            <p style="font-size: 12px; color: #6b7280;">生成日期: ${new Date().toLocaleDateString()}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <thead>
                <tr style="background-color: #2563eb; color: white;">
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">日期</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">现场</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">类型</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">人数</th>
                    <th style="border: 1px solid #2563eb; padding: 8px; font-size: 12px;">总费用</th>
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
            scale: 2, // Higher scale for better quality
            useCORS: true,
            logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
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

  return (
    <div className="max-w-3xl mx-auto p-4 pb-20 relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">你好, {user.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">今日是 {new Date().toLocaleDateString('zh-CN')}</p>
        </div>
        <div className="flex items-center gap-3">
             {/* Theme Button */}
             <button 
                onClick={() => setIsThemePanelOpen(!isThemePanelOpen)}
                className="p-2 rounded-full bg-surface border border-gray-200 dark:border-gray-700 text-muted hover:text-primary shadow-sm transition-all hover:scale-105 active:scale-95"
            >
                <Palette size={20} />
            </button>

            <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white dark:border-gray-700 shadow-sm">
                <img
                  src={resolveAvatar(user.avatar, user.id || user.username, user.name)}
                  alt={user.name}
                  className="h-full w-full object-cover"
                  onError={(event) => {
                    event.currentTarget.src = generateAvatarUrl(user.id || user.username, user.name);
                  }}
                />
            </div>

        </div>
      </div>

      {/* Theme Panel (Dropdown style) */}
      {isThemePanelOpen && (
        <div className="absolute right-4 top-20 z-50 w-72 bg-surface rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 p-5 animate-in fade-in zoom-in duration-200 origin-top-right">
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

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg overflow-x-auto">
        <button 
          onClick={() => setActiveTab('new')}
          className={`flex-1 min-w-[100px] py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'new' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          <Plus size={18} /> 新建记录
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 min-w-[100px] py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          <History size={18} /> 历史列表
        </button>
        <button 
          onClick={() => setActiveTab('calendar')}
          className={`flex-1 min-w-[100px] py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'calendar' ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
        >
          <CalendarIcon size={18} /> 日历视图
        </button>
      </div>

      {activeTab === 'new' && (
        <Card className="animate-in slide-in-from-bottom-4 fade-in duration-300">
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-content">
              <CalendarIcon className="text-blue-500" size={20}/> 日常工作填报
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input 
                label="日期" 
                type="date" 
                required
                value={formData.date} 
                onChange={e => setFormData({...formData, date: e.target.value})} 
              />
              <Select 
                label="工作现场" 
                value={formData.siteId}
                onChange={e => setFormData({...formData, siteId: e.target.value})}
              >
                <option value="" disabled>请选择现场</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">填报模式</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleWorkModeChange('individual')}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                formData.workMode === 'individual' 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                                : 'bg-surface border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Users size={16} /> 个人
                        </button>
                        <button
                            type="button"
                            onClick={() => handleWorkModeChange('team')}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                formData.workMode === 'team' 
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-500 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500' 
                                : 'bg-surface border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            <Briefcase size={16} /> 团队
                        </button>
                    </div>
                </div>
                {formData.workMode === 'team' ? (
                    <Select 
                        label="选择团队" 
                        value={formData.selectedTeamId}
                        onChange={e => handleTeamChange(e.target.value)}
                        required={formData.workMode === 'team'}
                    >
                        <option value="" disabled>请选择团队</option>
                        {teams.map(team => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                        ))}
                    </Select>
                ) : (
                   <div className="hidden md:block"></div> 
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                    label="作业人数" 
                    type="number" 
                    min="1"
                    required
                    value={formData.headCount} 
                    onChange={e => setFormData({...formData, headCount: Number(e.target.value)})} 
                />
            </div>

            <div className="border-t border-gray-100 dark:border-gray-700 my-4 pt-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-green-600"/> 费用明细 (円)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <Input label="停车费" type="number" min="0" value={formData.parking} onChange={e => setFormData({...formData, parking: Number(e.target.value)})} />
                    <Input label="交通费" type="number" min="0" value={formData.transport} onChange={e => setFormData({...formData, transport: Number(e.target.value)})} />
                    <Input label="高速费" type="number" min="0" value={formData.highway} onChange={e => setFormData({...formData, highway: Number(e.target.value)})} />
                </div>
            </div>

            <Button type="submit" className="w-full mt-4 flex items-center justify-center gap-2 shadow-blue-500/20">
              提交记录
            </Button>
          </form>
        </Card>
      )}

      {activeTab === 'history' && (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="flex justify-between items-center">
             <h2 className="text-lg font-bold text-content">记录明细</h2>
             {records.length > 0 && (
                 <Button variant="secondary" onClick={handleExportPDF} className="text-xs py-1.5 h-auto flex items-center gap-1">
                     <FileDown size={14} /> 导出报表(PDF)
                 </Button>
             )}
          </div>
          
          <div className="space-y-4 rounded-lg">
              {records.length === 0 && (
                <div className="text-center py-12 text-gray-400 dark:text-gray-500 bg-surface rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                    <History size={48} className="mx-auto mb-2 opacity-20"/>
                    暂无历史记录
                </div>
              )}
              {records.map(record => (
                <Card key={record.id} className="hover:shadow-md transition-all border-l-4 border-l-blue-500 dark:border-l-blue-400">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-800 dark:text-white">{record.date}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{record.dayOfWeek}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300 text-sm mt-1">
                        <MapPin size={14} className="text-blue-500" /> {record.siteName}
                      </div>
                      {record.teamName && (
                          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-300 text-sm mt-1">
                              <Briefcase size={14} /> <span className="text-xs font-medium bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded">{record.teamName}</span>
                          </div>
                      )}
                    </div>
                    <Badge status={record.status} />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 dark:text-gray-300 mt-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-lg">
                    <div className="flex items-center gap-2">
                        <Users size={14} className="text-muted"/> {record.headCount} 人
                    </div>
                    <div className="flex items-center gap-2">
                        <DollarSign size={14} className="text-muted"/> 
                        费用: {(record.costs.parking + record.costs.transport + record.costs.highway).toLocaleString()}円
                    </div>
                  </div>
                  
                  {record.status === 'submitted' && (
                    <div className="mt-3 flex justify-between items-center border-t border-gray-100 dark:border-gray-700 pt-3">
                      <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                         <CheckCircle2 size={12}/> 已同步至后台
                      </span>
                      <button 
                        onClick={() => handleDelete(record.id)}
                        className="text-red-500 dark:text-red-400 text-sm hover:text-red-700 font-medium hover:underline"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </Card>
              ))}
          </div>
        </div>
      )}

      {activeTab === 'calendar' && (
          <div className="space-y-4">
              <CalendarView 
                records={records} 
                onDateClick={(date, dailyRecords) => {
                    setSelectedDate(date);
                    setSelectedDateRecords(dailyRecords);
                    setIsDetailModalOpen(true);
                }}
              />
              <div className="text-xs text-muted text-center">点击日期查看详情</div>
          </div>
      )}

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
                            <span className="font-bold text-sm text-content">{r.siteName}</span>
                            <Badge status={r.status} />
                        </div>
                        <div className="text-xs text-muted space-y-1">
                            <div>人数: {r.headCount} | 模式: {r.teamName || '个人'}</div>
                            <div>总费用: {(r.costs.parking + r.costs.transport + r.costs.highway).toLocaleString()}円</div>
                        </div>
                    </div>
                ))
            )}
          </div>
      </Modal>
    </div>
  );
};

export default ClientDashboard;
