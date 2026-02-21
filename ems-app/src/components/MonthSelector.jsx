import React, { useState, useEffect, useRef } from 'react';
import { CalendarDays, ChevronDown, ChevronUp } from 'lucide-react';

const MonthSelector = ({ selectedMonth, onMonthChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Parse current selected 'YYYY-MM'
    const currentYear = parseInt(selectedMonth.split('-')[0], 10);
    const currentMonthIdx = parseInt(selectedMonth.split('-')[1], 10) - 1;

    const [displayYear, setDisplayYear] = useState(currentYear);

    const months = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMonthSelect = (monthIdx) => {
        const newMonthValue = `${displayYear}-${String(monthIdx + 1).padStart(2, '0')}`;
        onMonthChange(newMonthValue);
        setIsOpen(false);
    };

    const formattedDisplay = `${months[currentMonthIdx]} ${currentYear}`;

    return (
        <div className="relative w-full sm:w-48" ref={dropdownRef}>
            {/* Dropdown Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between px-3 py-2.5 border border-slate-300 rounded-lg bg-white text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-medium text-sm shadow-sm"
            >
                <div className="flex items-center gap-2">
                    <CalendarDays size={18} className="text-slate-400" />
                    <span>{formattedDisplay}</span>
                </div>
                {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
            </button>

            {/* Dropdown Content */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 rounded-xl shadow-lg z-50 p-3 animate-in fade-in slide-in-from-top-2">
                    {/* Year Navigator */}
                    <div className="flex items-center justify-between mb-3 px-1">
                        <button
                            onClick={() => setDisplayYear(prev => prev - 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                        >
                            &larr;
                        </button>
                        <span className="font-semibold text-slate-700">{displayYear}</span>
                        <button
                            onClick={() => setDisplayYear(prev => prev + 1)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-500 transition-colors"
                        >
                            &rarr;
                        </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 gap-2">
                        {months.map((month, idx) => {
                            const isSelected = displayYear === currentYear && idx === currentMonthIdx;
                            return (
                                <button
                                    key={month}
                                    onClick={() => handleMonthSelect(idx)}
                                    className={`py-2 text-sm font-medium rounded-lg transition-colors ${isSelected
                                            ? 'bg-indigo-600 text-white shadow-sm'
                                            : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                        }`}
                                >
                                    {month}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MonthSelector;
