import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin, Users } from 'lucide-react';
import { WorkRecord } from '../types';
import { Card, Badge } from './UIComponents';

interface CalendarViewProps {
  records: WorkRecord[];
  onDateClick?: (date: string, records: WorkRecord[]) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ records, onDateClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Generate calendar grid
  const days = [];
  // Empty cells for days before the first of the month
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  // Days of the month
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  const getRecordsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return records.filter(r => r.date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch(status) {
        case 'approved': return 'bg-green-500';
        case 'submitted': return 'bg-yellow-500';
        case 'rejected': return 'bg-red-500';
        default: return 'bg-gray-400';
    }
  };

  return (
    <Card className="p-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6">
        <button onClick={prevMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-content">
          {year}年 {month + 1}月
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <ChevronRight size={20} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className="text-xs font-bold text-muted uppercase py-2">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {days.map((day, index) => {
          const dayRecords = day ? getRecordsForDay(day) : [];
          const isToday = day && 
            new Date().getDate() === day && 
            new Date().getMonth() === month && 
            new Date().getFullYear() === year;

          return (
            <div 
              key={index} 
              onClick={() => day && onDateClick && onDateClick(`${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`, dayRecords)}
              className={`
                min-h-[80px] border rounded-lg p-1 md:p-2 relative flex flex-col transition-all
                ${!day ? 'bg-transparent border-transparent' : 'bg-surface border-gray-100 dark:border-gray-700 hover:border-primary cursor-pointer hover:shadow-sm'}
                ${isToday ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-gray-900' : ''}
              `}
            >
              {day && (
                <>
                  <span className={`text-sm font-medium mb-1 ${isToday ? 'text-primary' : 'text-muted'}`}>
                    {day}
                  </span>
                  
                  <div className="flex flex-col gap-1 flex-1 overflow-hidden">
                    {dayRecords.slice(0, 3).map((record, i) => (
                        <div key={record.id} className="flex items-center gap-1 text-[10px] truncate bg-gray-50 dark:bg-gray-800 rounded px-1 py-0.5">
                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${getStatusColor(record.status)}`}></div>
                            <span className="hidden md:inline truncate text-content">{record.siteName}</span>
                        </div>
                    ))}
                    {dayRecords.length > 3 && (
                        <div className="text-[10px] text-muted text-center bg-gray-50 dark:bg-gray-800 rounded">
                            +{dayRecords.length - 3} 更多
                        </div>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs justify-end text-muted">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> 审核中</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> 已通过</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> 已驳回</div>
      </div>
    </Card>
  );
};