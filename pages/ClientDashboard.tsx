import React, { useState, useEffect } from 'react';
import { User, WorkRecord, Site, Team } from '../types';
import { DataService } from '../services/mockData';
import { Card, Button, Input, Select, Badge } from '../components/UIComponents';
import { Plus, History, Calendar, MapPin, Users, DollarSign, Briefcase } from 'lucide-react';

interface ClientDashboardProps {
  user: User;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('new');
  const [records, setRecords] = useState<WorkRecord[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  
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

  useEffect(() => {
    const allRecords = DataService.getRecords();
    setRecords(allRecords.filter(r => r.userId === user.id));
    setSites(DataService.getSites().filter(s => s.status === 'active')); // Only show active sites
    setTeams(DataService.getTeams());
    
    // Set default site if available
    const availableSites = DataService.getSites().filter(s => s.status === 'active');
    if (availableSites.length > 0) {
      setFormData(prev => ({ ...prev, siteId: availableSites[0].id }));
    }
  }, [user.id]);

  // Handle work mode change
  const handleWorkModeChange = (mode: 'individual' | 'team') => {
    if (mode === 'individual') {
      setFormData(prev => ({ 
        ...prev, 
        workMode: mode, 
        headCount: 1, 
        selectedTeamId: '' 
      }));
    } else {
      // When switching to team, try to find user's team or default to first available
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

  // Handle team selection change
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
    const users = DataService.getUsers();
    const count = users.filter(u => u.teamId === teamId).length;
    return count > 0 ? count : 1;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedSite = sites.find(s => s.id === formData.siteId);
    if (!selectedSite) return;

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

    const updatedRecords = DataService.addRecord(newRecord);
    setRecords(updatedRecords.filter(r => r.userId === user.id));
    setActiveTab('history');
    
    // Reset form costs but keep context
    setFormData(prev => ({ ...prev, parking: 0, transport: 0, highway: 0 }));
    alert('提交成功！');
  };

  const handleDelete = (id: string) => {
    if (confirm('确定要删除这条记录吗？')) {
      DataService.deleteRecord(id);
      setRecords(prev => prev.filter(r => r.id !== id));
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">你好, {user.name}</h1>
          <p className="text-gray-500">今日是 {new Date().toLocaleDateString('zh-CN')}</p>
        </div>
        <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden border-2 border-white shadow-sm">
            <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 bg-gray-100 p-1 rounded-lg">
        <button 
          onClick={() => setActiveTab('new')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'new' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <Plus size={18} /> 新建记录
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          <History size={18} /> 历史记录
        </button>
      </div>

      {activeTab === 'new' ? (
        <Card>
          <form onSubmit={handleSubmit}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Calendar className="text-blue-500" size={20}/> 日常工作填报
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
                {/* Work Mode Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">填报模式</label>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => handleWorkModeChange('individual')}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                formData.workMode === 'individual' 
                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Users size={16} /> 个人
                        </button>
                        <button
                            type="button"
                            onClick={() => handleWorkModeChange('team')}
                            className={`flex-1 py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                                formData.workMode === 'team' 
                                ? 'bg-blue-50 border-blue-500 text-blue-700 ring-1 ring-blue-500' 
                                : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Briefcase size={16} /> 团队
                        </button>
                    </div>
                </div>

                {/* Conditional Input: Team Select or just placeholder */}
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

            <div className="border-t border-gray-100 my-4 pt-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-green-600"/> 费用明细 (円)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                    <Input 
                        label="停车费" 
                        type="number" 
                        min="0"
                        value={formData.parking} 
                        onChange={e => setFormData({...formData, parking: Number(e.target.value)})} 
                    />
                    <Input 
                        label="交通费" 
                        type="number" 
                        min="0"
                        value={formData.transport} 
                        onChange={e => setFormData({...formData, transport: Number(e.target.value)})} 
                    />
                    <Input 
                        label="高速费" 
                        type="number" 
                        min="0"
                        value={formData.highway} 
                        onChange={e => setFormData({...formData, highway: Number(e.target.value)})} 
                    />
                </div>
            </div>

            <Button type="submit" className="w-full mt-4 flex items-center justify-center gap-2">
              提交记录
            </Button>
          </form>
        </Card>
      ) : (
        <div className="space-y-4">
          {records.length === 0 && (
            <div className="text-center py-12 text-gray-400">暂无记录</div>
          )}
          {records.map(record => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800">{record.date}</span>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{record.dayOfWeek}</span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-600 text-sm mt-1">
                    <MapPin size={14} /> {record.siteName}
                  </div>
                  {record.teamName && (
                      <div className="flex items-center gap-1 text-blue-600 text-sm mt-1">
                          <Briefcase size={14} /> <span className="text-xs font-medium bg-blue-50 px-1.5 py-0.5 rounded">{record.teamName}</span>
                      </div>
                  )}
                </div>
                <Badge status={record.status} />
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mt-3 bg-gray-50 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                    <Users size={14} /> {record.headCount} 人
                </div>
                <div className="flex items-center gap-2">
                    <DollarSign size={14} /> 
                    总费用: {(record.costs.parking + record.costs.transport + record.costs.highway).toLocaleString()}円
                </div>
              </div>
              
              {record.status === 'submitted' && (
                <div className="mt-3 flex justify-end">
                  <button 
                    onClick={() => handleDelete(record.id)}
                    className="text-red-500 text-sm hover:text-red-700 font-medium"
                  >
                    删除
                  </button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;