
import React, { useState } from 'react';
import { Visit } from '../types';
import { ICONS } from '../constants';

interface CalendarViewProps {
  visits: Visit[];
  onSelectVisit: (visit: Visit) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ visits, onSelectVisit }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun
    // Adjust for Monday start
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    
    const result = [];
    // Previous month filler
    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = startOffset - 1; i >= 0; i--) {
      result.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    // Current month
    for (let i = 1; i <= days; i++) {
      result.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    // Next month filler
    const remaining = 42 - result.length; // 6 rows * 7 cols
    for (let i = 1; i <= remaining; i++) {
      result.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    return result;
  };

  const calendarDays = getDaysInMonth(currentDate);

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Helper to check if a visit happens on a specific day
  const getVisitsForDay = (day: Date) => {
    const dayStr = day.toISOString().split('T')[0];
    return visits.filter(v => v.startDate <= dayStr && v.endDate >= dayStr);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Calendar Header */}
      <div className="p-6 flex items-center justify-between border-b border-stone-100 bg-white">
        <h2 className="text-2xl font-bold font-serif text-zen-900 flex items-center gap-2">
          {currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月
        </h2>
        <div className="flex gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition">
            <ICONS.ChevronLeft size={20} />
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm bg-stone-100 hover:bg-stone-200 rounded-lg text-stone-600 font-medium transition">
            今天
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-stone-100 rounded-lg text-stone-600 transition">
            <ICONS.ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Responsive Calendar Container: Supports horizontal scroll on mobile */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]"> 
          {/* Grid Header */}
          <div className="grid grid-cols-7 bg-stone-50 border-b border-stone-200">
            {['一', '二', '三', '四', '五', '六', '日'].map(day => (
              <div key={day} className="py-4 text-center text-sm font-serif font-bold text-stone-500">
                周{day}
              </div>
            ))}
          </div>

          {/* Grid Body */}
          <div className="grid grid-cols-7 auto-rows-fr bg-stone-100 gap-px">
            {calendarDays.map((cell, idx) => {
              const dayVisits = getVisitsForDay(cell.date);
              const isToday = cell.date.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={idx} 
                  className={`min-h-[140px] p-2 relative group transition hover:bg-white
                    ${!cell.isCurrentMonth ? 'bg-stone-50/50 text-stone-300' : 'bg-white text-stone-700'}
                  `}
                >
                  <span className={`
                    text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-2
                    ${isToday ? 'bg-zen-600 text-white shadow-md' : 'text-stone-500'}
                  `}>
                    {cell.date.getDate()}
                  </span>

                  <div className="space-y-1.5">
                    {dayVisits.map(v => (
                      <button
                        key={v.id}
                        onClick={() => onSelectVisit(v)}
                        className={`
                          w-full text-left text-xs px-2.5 py-1.5 rounded-md shadow-sm border-l-2 truncate transition-all transform hover:-translate-y-0.5
                          ${v.color} bg-opacity-10 border-opacity-100 text-stone-800 hover:shadow-md
                        `}
                        style={{ borderColor: 'var(--tw-bg-opacity)' }}
                        title={v.visitorName}
                      >
                        <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1.5 ${v.color}`}></span>
                        {v.visitorName}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;