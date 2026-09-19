import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X, Check } from 'lucide-react';

export default function GlobalCalendar({ selectedDate, onDateChange, isRange = false, onRangeChange, selectedRange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const popoverRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatDateDisplay = (d) => {
    if (!d) return 'All Dates';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    return dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const handleDateClick = (dateStr) => {
    onDateChange && onDateChange(dateStr);
    setIsOpen(false);
  };

  const clearDate = (e) => {
    e.stopPropagation();
    onDateChange && onDateChange(null);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="global-calendar-container" ref={popoverRef} style={{ position: 'relative' }}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="calendar-trigger-btn"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          background: selectedDate ? '#e0f2fe' : '#f1f5f9',
          color: selectedDate ? '#0284c7' : '#0f172a',
          border: selectedDate ? '1px solid #0284c7' : '1px solid #e2e8f0',
          padding: '8px 14px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <CalendarIcon size={16} color={selectedDate ? '#0284c7' : '#64748b'} />
        <span>{selectedDate ? formatDateDisplay(selectedDate) : 'Select Date'}</span>
        {selectedDate && (
          <span 
            onClick={clearDate} 
            style={{ display: 'inline-flex', alignItems: 'center', padding: '2px', marginLeft: '4px', borderRadius: '50%', background: '#bae6fd' }}
            title="Clear date filter"
          >
            <X size={12} color="#0284c7" />
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="calendar-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            background: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(15, 23, 42, 0.15)',
            border: '1px solid #e2e8f0',
            padding: '16px',
            width: '280px',
            zIndex: 100,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
            <button type="button" onClick={prevMonth} style={{ padding: '4px', borderRadius: '6px' }}>
              <ChevronLeft size={18} color="#64748b" />
            </button>
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
              {monthNames[month]} {year}
            </span>
            <button type="button" onClick={nextMonth} style={{ padding: '4px', borderRadius: '6px' }}>
              <ChevronRight size={18} color="#64748b" />
            </button>
          </div>

          {/* Weekday headers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', textAlign: 'center', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '8px' }}>
            <span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span>
          </div>

          {/* Days Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isSelected = selectedDate === dateString;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleDateClick(dateString)}
                  style={{
                    padding: '8px 0',
                    fontSize: '12px',
                    fontWeight: isSelected ? 800 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    background: isSelected ? '#0284c7' : 'transparent',
                    color: isSelected ? '#ffffff' : '#0f172a',
                    cursor: 'pointer',
                    transition: 'background 0.15s'
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = '#f1f5f9'; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Presets */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', marginTop: '14px', paddingTop: '10px' }}>
            <button 
              type="button" 
              onClick={() => handleDateClick(new Date().toISOString().split('T')[0])}
              style={{ fontSize: '12px', fontWeight: 600, color: '#0284c7' }}
            >
              Today
            </button>
            <button 
              type="button" 
              onClick={() => { onDateChange && onDateChange(null); setIsOpen(false); }}
              style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}
            >
              All Dates
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
