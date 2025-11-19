import React, { useState, useEffect } from 'react';
import { User, WorkRecord, Site, Team, UserRole } from '../types';
import { DataService } from '../services/mockData';
import { generateInsightReport } from '../services/geminiService';
import { Card, Badge, Button, Modal, Input, Select } from '../components/UIComponents';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { LayoutDashboard, FileText, Users, Map, Wand2, Loader2, MapPin, Download, Edit, Trash2, Plus, UserPlus, Building2, Briefcase, UserCog, UserMinus, FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface AdminDashboardProps {
  user: User;
}

type ViewType = 'dashboard' | 'records' | 'sites' | 'users' | 'teams';

const AdminDashboard: React.FC<AdminDashboardProps> = () => {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [aiReport, setAiReport] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Modal State - Initialize as empty object to prevent null access errors during render
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'site' | 'user' | 'team' | 'teamMembers' | 'record'>('site');
  const [editingItem, setEditingItem] = useState<any>({});
  
  // State for adding a member in the team modal
  const [selectedUserIdToAdd, setSelectedUserIdToAdd] = useState('');

  // Refresh Data
  const refreshData = () => {
    setRecords(DataService.getRecords());
    setSites(DataService.getSites());
    setUsers(DataService.getUsers());
    setTeams(DataService.getTeams());
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- Data Processing for Charts ---
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

  // --- Actions ---
  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setAiReport('');
    const report = await generateInsightReport(records);
    setAiReport(report);
    setIsGenerating(false);
  };

  const handleApprove = (id: string) => {
    DataService.updateRecordStatus(id, 'approved');
    refreshData();
  };

  const handleReject = (id: string) => {
    DataService.updateRecordStatus(id, 'rejected');
    refreshData();
  };

  const handleDeleteRecord = (id: string) => {
      if (confirm('确定要删除这条记录吗？此操作不可恢复。')) {
          DataService.deleteRecord(id);
          refreshData();
      }
  };

  const handleExportCSV = () => {
    const headers = ['ID,日期,星期,类型,员工/团队,现场,人数,停车费,交通费,高速费,总费用,状态,备注'];
    const csvRows = records.map(r => {
        const total = r.costs.parking + r.costs.transport + r.costs.highway;
        const type = r.teamName ? '团队' : '个人';
        const name = r.teamName ? r.teamName : r.userName;
        return `${r.id},${r.date},${r.dayOfWeek},${type},${name},${r.siteName},${r.headCount},${r.costs.parking},${r.costs.transport},${r.costs.highway},${total},${r.status},"${r.notes || ''}"`;
    });
    const csvContent = "\uFEFF" + [headers, ...csvRows].join('\n'); // Add BOM for Excel
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FieldLink_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportPDF = () => {
    const input = document.getElementById('records-table-container');
    if (input) {
        // Using html2canvas to capture the table as an image to ensure Chinese characters are rendered correctly
        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
            
            // Add title
            pdf.setFontSize(16);
            pdf.text(`FieldLink Report - ${new Date().toLocaleDateString()}`, 10, 10);
            
            // Add image
            pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
            pdf.save(`FieldLink_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        });
    }
  };

  // --- Team Member Management ---
  const handleAddMemberToTeam = () => {
      if (!selectedUserIdToAdd || !editingItem?.id) return;
      const user = users.find(u => u.id === selectedUserIdToAdd);
      if (user) {
          DataService.saveUser({ ...user, teamId: editingItem.id });
          refreshData();
          setSelectedUserIdToAdd(''); // Reset selection
      }
  };

  const handleRemoveMemberFromTeam = (userId: string) => {
      const user = users.find(u => u.id === userId);
      if (user) {
          DataService.saveUser({ ...user, teamId: undefined }); // Remove team association
          refreshData();
      }
  };

  // --- Modal Handlers ---
  const openModal = (type: 'site' | 'user' | 'team' | 'teamMembers' | 'record', item?: any) => {
    setModalType(type);
    setEditingItem(item ? JSON.parse(JSON.stringify(item)) : {}); // Deep copy to avoid direct mutation
    setSelectedUserIdToAdd(''); // Reset specific state
    setIsModalOpen(true);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = editingItem;
    
    if (modalType === 'site') {
       const newSite: Site = {
           id: item?.id || '',
           name: item.name,
           address: item.address,
           status: item.status || 'active'
       };
       DataService.saveSite(newSite);
    } else if (modalType === 'team') {
        const newTeam: Team = {
            id: item?.id || '',
            name: item.name,
            leaderId: item.leaderId
        };
        DataService.saveTeam(newTeam);
    } else if (modalType === 'user') {
        const newUser: User = {
            id: item?.id || '',
            name: item.name,
            role: item.role || UserRole.STAFF,
            teamId: item.teamId
        };
        DataService.saveUser(newUser);
    } else if (modalType === 'record') {
        // Handle Record Update
        const selectedSite = sites.find(s => s.id === item.siteId);
        const updatedRecord: WorkRecord = {
            ...item,
            siteName: selectedSite?.name || item.siteName,
            costs: {
                parking: Number(item.costs.parking),
                transport: Number(item.costs.transport),
                highway: Number(item.costs.highway)
            },
            headCount: Number(item.headCount)
        };
        // Recalculate day of week if date changed
        updatedRecord.dayOfWeek = new Date(updatedRecord.date).toLocaleDateString('zh-CN', { weekday: 'long' });
        
        DataService.updateRecord(updatedRecord);
    }

    if (modalType !== 'teamMembers') {
        setIsModalOpen(false);
        refreshData();
    }
  };

  const handleDeleteItem = (type: 'site' | 'user' | 'team', id: string) => {
      if (!confirm('确定要删除吗？此操作不可恢复。')) return;
      if (type === 'site') DataService.deleteSite(id);
      if (type === 'team') DataService.deleteTeam(id);
      if (type === 'user') DataService.deleteUser(id);
      refreshData();
  };

  // --- Views ---
  const renderSidebar = () => (
    <div className="w-64 bg-white border-r h-screen fixed left-0 top-0 hidden md:flex flex-col z-10">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
           FieldLink <span className="text-gray-400 text-sm font-normal">Admin</span>
        </h2>
      </div>
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        <button onClick={() => setCurrentView('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <LayoutDashboard size={20} /> 数据总览
        </button>
        <button onClick={() => setCurrentView('records')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'records' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <FileText size={20} /> 记录管理
        </button>
        <div className="pt-4 pb-2 text-xs font-semibold text-gray-400 px-4">基础数据管理</div>
        <button onClick={() => setCurrentView('sites')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'sites' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Map size={20} /> 现场管理
        </button>
        <button onClick={() => setCurrentView('teams')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'teams' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Building2 size={20} /> 团队管理
        </button>
        <button onClick={() => setCurrentView('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}>
          <Users size={20} /> 用户管理
        </button>
      </nav>
      <div className="p-4 border-t">
        <div className="flex items-center gap-3">
             <div className="h-8 w-8 rounded-full bg-gray-200 overflow-hidden">
                <img src="https://picsum.photos/100/100?random=1" alt="Admin" />
            </div>
            <div className="text-sm">
                <p className="font-medium">管理员</p>
                <p className="text-gray-400 text-xs">系统管理</p>
            </div>
        </div>
      </div>
    </div>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 border-none text-white">
                <h3 className="text-blue-100 text-sm font-medium mb-1">本月总支出</h3>
                <p className="text-3xl font-bold">¥ {records.reduce((acc, r) => acc + r.costs.parking + r.costs.transport + r.costs.highway, 0).toLocaleString()}</p>
            </Card>
            <Card>
                <h3 className="text-gray-500 text-sm font-medium mb-1">总工时记录</h3>
                <p className="text-3xl font-bold text-gray-800">{records.length} <span className="text-sm text-gray-400 font-normal">条</span></p>
            </Card>
            <Card>
                <h3 className="text-gray-500 text-sm font-medium mb-1">活跃现场</h3>
                <p className="text-3xl font-bold text-gray-800">{sites.filter(s => s.status === 'active').length} <span className="text-sm text-gray-400 font-normal">个</span></p>
            </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="h-80">
                <h3 className="font-bold text-gray-700 mb-4">各现场费用支出分布 (円)</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <BarChart data={costData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" tick={{fontSize: 12}} interval={0} />
                        <YAxis tick={{fontSize: 12}} />
                        <Tooltip cursor={{fill: '#f3f4f6'}} formatter={(value) => `${Number(value).toLocaleString()} 円`} />
                        <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </Card>
            <Card className="h-80">
                <h3 className="font-bold text-gray-700 mb-4">记录状态占比</h3>
                <ResponsiveContainer width="100%" height="90%">
                    <PieChart>
                        <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                            {statusData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
            </Card>
        </div>

        {/* AI Report */}
        <Card className="border-blue-100 bg-blue-50/50">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                    <Wand2 size={20} className="text-purple-600" /> 智能分析报告 (Gemini)
                </h3>
                <Button 
                    onClick={handleGenerateReport} 
                    disabled={isGenerating}
                    variant="primary"
                    className="flex items-center gap-2 text-sm"
                >
                    {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Wand2 size={16} />}
                    {isGenerating ? '分析中...' : '生成报告'}
                </Button>
            </div>
            <div className="bg-white p-4 rounded-lg border border-blue-100 min-h-[100px] text-sm leading-relaxed text-gray-700 whitespace-pre-line">
                {aiReport || "点击生成按钮，让 AI 助手分析当前工作数据。"}
            </div>
        </Card>
    </div>
  );

  const renderRecords = () => (
    <Card className="overflow-hidden">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">全部工作记录</h2>
            <div className="flex gap-2">
                <Button variant="secondary" onClick={handleExportPDF} className="flex items-center gap-2 text-sm">
                    <FileDown size={16} /> 导出PDF
                </Button>
                <Button variant="secondary" onClick={handleExportCSV} className="flex items-center gap-2 text-sm">
                    <Download size={16} /> 导出CSV
                </Button>
            </div>
        </div>
        <div className="overflow-x-auto" id="records-table-container">
            <table className="w-full text-left text-sm text-gray-600" id="records-table">
                <thead className="bg-gray-50 text-gray-800 font-medium border-b">
                    <tr>
                        <th className="p-3">日期</th>
                        <th className="p-3">填报人</th>
                        <th className="p-3">性质</th>
                        <th className="p-3">现场</th>
                        <th className="p-3 text-right">人数</th>
                        <th className="p-3 text-right">总费用(円)</th>
                        <th className="p-3 text-center">状态</th>
                        <th className="p-3 text-center">审核</th>
                        <th className="p-3 text-center">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {records.map(r => (
                        <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                            <td className="p-3">{r.date}</td>
                            <td className="p-3 font-medium">{r.userName}</td>
                            <td className="p-3">
                                {r.teamName ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs">
                                        <Briefcase size={12} /> {r.teamName}
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs">
                                        <Users size={12} /> 个人
                                    </span>
                                )}
                            </td>
                            <td className="p-3">{r.siteName}</td>
                            <td className="p-3 text-right">{r.headCount}</td>
                            <td className="p-3 text-right">{(r.costs.parking + r.costs.transport + r.costs.highway).toLocaleString()}</td>
                            <td className="p-3 text-center"><Badge status={r.status} /></td>
                            <td className="p-3 text-center">
                                {r.status === 'submitted' && (
                                    <div className="flex justify-center gap-2">
                                        <button onClick={() => handleApprove(r.id)} className="text-green-600 hover:text-green-800 font-medium text-xs">通过</button>
                                        <button onClick={() => handleReject(r.id)} className="text-red-600 hover:text-red-800 font-medium text-xs">驳回</button>
                                    </div>
                                )}
                            </td>
                            <td className="p-3 flex justify-center gap-2">
                                <button onClick={() => openModal('record', r)} className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50" title="编辑"><Edit size={16}/></button>
                                <button onClick={() => handleDeleteRecord(r.id)} className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-50" title="删除"><Trash2 size={16}/></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </Card>
  );

  const renderSites = () => (
      <div>
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">现场管理</h2>
              <Button onClick={() => openModal('site')} className="flex items-center gap-2">
                  <Plus size={18} /> 添加现场
              </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sites.map(site => (
                <Card key={site.id} className="hover:shadow-md transition-shadow relative group">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">{site.name}</h3>
                            <p className="text-gray-500 text-sm mt-1 flex items-center gap-1"><MapPin size={14}/> {site.address}</p>
                        </div>
                        <Badge status={site.status} />
                    </div>
                    <div className="mt-4 pt-4 border-t flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" className="text-xs py-1" onClick={() => openModal('site', site)}>编辑</Button>
                        <Button variant="danger" className="text-xs py-1" onClick={() => handleDeleteItem('site', site.id)}>删除</Button>
                    </div>
                </Card>
            ))}
          </div>
      </div>
  );

  const renderTeams = () => (
      <Card>
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-800">团队管理</h2>
              <Button onClick={() => openModal('team')} className="flex items-center gap-2">
                  <Plus size={18} /> 创建团队
              </Button>
          </div>
          <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-800 font-medium border-b">
                  <tr>
                      <th className="p-3">团队名称</th>
                      <th className="p-3">负责人</th>
                      <th className="p-3 text-center">操作</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                  {teams.map(team => (
                      <tr key={team.id} className="group">
                          <td className="p-3 font-medium">{team.name}</td>
                          <td className="p-3">{users.find(u => u.id === team.leaderId)?.name || '未分配'}</td>
                          <td className="p-3 flex justify-center gap-2">
                              <button onClick={() => openModal('teamMembers', team)} className="p-1 text-gray-500 hover:text-purple-600 rounded hover:bg-purple-50" title="成员管理"><UserCog size={16}/></button>
                              <button onClick={() => openModal('team', team)} className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50" title="编辑团队"><Edit size={16}/></button>
                              <button onClick={() => handleDeleteItem('team', team.id)} className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-50" title="删除团队"><Trash2 size={16}/></button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </Card>
  );

  const renderUsers = () => (
    <Card>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">用户管理</h2>
            <Button onClick={() => openModal('user')} className="flex items-center gap-2">
                <UserPlus size={18} /> 添加用户
            </Button>
        </div>
        <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-800 font-medium border-b">
                <tr>
                    <th className="p-3">头像</th>
                    <th className="p-3">姓名</th>
                    <th className="p-3">角色</th>
                    <th className="p-3">所属团队</th>
                    <th className="p-3 text-center">操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
                {users.map(u => (
                    <tr key={u.id} className="group">
                        <td className="p-3">
                            <img src={u.avatar} alt={u.name} className="w-8 h-8 rounded-full bg-gray-200" />
                        </td>
                        <td className="p-3 font-medium">{u.name}</td>
                        <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                                {u.role === 'ADMIN' ? '管理员' : '员工'}
                            </span>
                        </td>
                        <td className="p-3">{teams.find(t => t.id === u.teamId)?.name || '-'}</td>
                        <td className="p-3 flex justify-center gap-2">
                            <button onClick={() => openModal('user', u)} className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-blue-50"><Edit size={16}/></button>
                            <button onClick={() => handleDeleteItem('user', u.id)} className="p-1 text-gray-500 hover:text-red-600 rounded hover:bg-red-50"><Trash2 size={16}/></button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {renderSidebar()}
      <div className="flex-1 md:ml-64 p-8 relative">
        {/* Mobile Header Placeholder */}
        <div className="md:hidden mb-6 pb-4 border-b overflow-x-auto">
             <h1 className="text-xl font-bold text-blue-600">FieldLink Admin</h1>
             <div className="flex gap-2 mt-4">
                <Button variant="secondary" onClick={() => setCurrentView('dashboard')} className="whitespace-nowrap text-xs py-1">总览</Button>
                <Button variant="secondary" onClick={() => setCurrentView('records')} className="whitespace-nowrap text-xs py-1">记录</Button>
                <Button variant="secondary" onClick={() => setCurrentView('sites')} className="whitespace-nowrap text-xs py-1">现场</Button>
                <Button variant="secondary" onClick={() => setCurrentView('users')} className="whitespace-nowrap text-xs py-1">用户</Button>
             </div>
        </div>

        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'records' && renderRecords()}
        {currentView === 'sites' && renderSites()}
        {currentView === 'teams' && renderTeams()}
        {currentView === 'users' && renderUsers()}

        {/* Generic Modal */}
        <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            title={
                modalType === 'site' ? (editingItem?.id ? '编辑现场' : '添加现场') : 
                modalType === 'team' ? (editingItem?.id ? '编辑团队' : '创建团队') :
                modalType === 'teamMembers' ? `成员管理 - ${editingItem?.name}` :
                modalType === 'record' ? '编辑记录' :
                (editingItem?.id ? '编辑用户' : '添加用户')
            }
        >
            {/* Render Form based on type */}
            {modalType !== 'teamMembers' ? (
                <form onSubmit={handleModalSubmit}>
                    {modalType === 'site' && (
                        <>
                            <Input label="现场名称" required value={editingItem?.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                            <Input label="详细地址" required value={editingItem?.address || ''} onChange={e => setEditingItem({...editingItem, address: e.target.value})} />
                            <Select label="状态" value={editingItem?.status || 'active'} onChange={e => setEditingItem({...editingItem, status: e.target.value})}>
                                <option value="active">进行中</option>
                                <option value="pending">筹备中</option>
                                <option value="completed">已完工</option>
                            </Select>
                        </>
                    )}
                    {modalType === 'team' && (
                        <>
                            <Input label="团队名称" required value={editingItem?.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                            <Select label="负责人" value={editingItem?.leaderId || ''} onChange={e => setEditingItem({...editingItem, leaderId: e.target.value})}>
                                <option value="">选择负责人</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </Select>
                        </>
                    )}
                    {modalType === 'user' && (
                        <>
                             <Input label="姓名" required value={editingItem?.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                             <Select label="角色" value={editingItem?.role || 'STAFF'} onChange={e => setEditingItem({...editingItem, role: e.target.value})}>
                                <option value="STAFF">现场员工</option>
                                <option value="ADMIN">管理员</option>
                            </Select>
                            <Select label="所属团队" value={editingItem?.teamId || ''} onChange={e => setEditingItem({...editingItem, teamId: e.target.value})}>
                                <option value="">无 / 独立</option>
                                {teams.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </Select>
                        </>
                    )}
                    {modalType === 'record' && (
                         <>
                             <Input 
                                label="日期" 
                                type="date" 
                                required
                                value={editingItem?.date || ''} 
                                onChange={e => setEditingItem({...editingItem, date: e.target.value})} 
                             />
                             <Select 
                                label="工作现场" 
                                value={editingItem?.siteId || ''}
                                onChange={e => setEditingItem({...editingItem, siteId: e.target.value})}
                             >
                                {sites.map(site => (
                                  <option key={site.id} value={site.id}>{site.name}</option>
                                ))}
                             </Select>
                             <Input 
                                label="作业人数" 
                                type="number" 
                                min="1"
                                required
                                value={editingItem?.headCount || 0} 
                                onChange={e => setEditingItem({...editingItem, headCount: Number(e.target.value)})} 
                             />
                             <div className="grid grid-cols-3 gap-2 mb-4">
                                <Input 
                                    label="停车费" 
                                    type="number" 
                                    min="0"
                                    value={editingItem?.costs?.parking || 0} 
                                    onChange={e => setEditingItem({...editingItem, costs: {...editingItem.costs, parking: Number(e.target.value)}})} 
                                />
                                <Input 
                                    label="交通费" 
                                    type="number" 
                                    min="0"
                                    value={editingItem?.costs?.transport || 0} 
                                    onChange={e => setEditingItem({...editingItem, costs: {...editingItem.costs, transport: Number(e.target.value)}})} 
                                />
                                <Input 
                                    label="高速费" 
                                    type="number" 
                                    min="0"
                                    value={editingItem?.costs?.highway || 0} 
                                    onChange={e => setEditingItem({...editingItem, costs: {...editingItem.costs, highway: Number(e.target.value)}})} 
                                />
                             </div>
                             <Select 
                                label="状态" 
                                value={editingItem?.status || 'submitted'} 
                                onChange={e => setEditingItem({...editingItem, status: e.target.value})}
                             >
                                <option value="submitted">待审核</option>
                                <option value="approved">已通过</option>
                                <option value="rejected">已驳回</option>
                             </Select>
                         </>
                    )}
                    <Button type="submit" className="w-full mt-4">保存</Button>
                </form>
            ) : (
                /* Team Members Management View */
                <div className="space-y-4">
                    <div className="bg-blue-50 p-3 rounded-lg">
                         <label className="block text-sm font-medium text-gray-700 mb-1">添加新成员</label>
                         <div className="flex gap-2">
                            <select 
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                value={selectedUserIdToAdd}
                                onChange={(e) => setSelectedUserIdToAdd(e.target.value)}
                            >
                                <option value="">选择用户...</option>
                                {users.filter(u => u.teamId !== editingItem?.id).map(u => (
                                    <option key={u.id} value={u.id}>{u.name} {u.teamId ? '(已在其他团队)' : ''}</option>
                                ))}
                            </select>
                            <Button onClick={handleAddMemberToTeam} disabled={!selectedUserIdToAdd} className="whitespace-nowrap">添加</Button>
                         </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <Users size={16} /> 现有成员 ({users.filter(u => u.teamId === editingItem?.id).length})
                        </h4>
                        <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                            {users.filter(u => u.teamId === editingItem?.id).length === 0 ? (
                                <p className="p-4 text-center text-gray-400 text-sm">该团队暂无成员</p>
                            ) : (
                                users.filter(u => u.teamId === editingItem?.id).map(member => (
                                    <div key={member.id} className="p-3 flex justify-between items-center hover:bg-gray-50">
                                        <div className="flex items-center gap-3">
                                            <img src={member.avatar} className="w-8 h-8 rounded-full bg-gray-200" alt=""/>
                                            <span className="text-sm font-medium text-gray-700">{member.name}</span>
                                            {editingItem?.leaderId === member.id && (
                                                <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded">负责人</span>
                                            )}
                                        </div>
                                        <button 
                                            onClick={() => handleRemoveMemberFromTeam(member.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                                            title="移出团队"
                                        >
                                            <UserMinus size={16} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Modal>
      </div>
    </div>
  );
};

export default AdminDashboard;