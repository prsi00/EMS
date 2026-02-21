import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FileBarChart, Loader2, Download } from 'lucide-react';
import MonthSelector from '../../components/MonthSelector';

const AdminMonthlyAttendance = () => {
    // Default to current month, format YYYY-MM
    const [monthInput, setMonthInput] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const [employees, setEmployees] = useState([]);
    const [attendanceData, setAttendanceData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Convert YYYY-MM to display format
    const getFormattedMonthYear = (input) => {
        if (!input) return '';
        const [year, month] = input.split('-');
        const date = new Date(year, month - 1, 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };
    const formattedMonthYear = getFormattedMonthYear(monthInput);

    useEffect(() => {
        const fetchReportData = async () => {
            if (!monthInput) return;
            setLoading(true);

            try {
                // 1. Fetch all employees
                const { data: empData, error: empError } = await supabase
                    .from('employees')
                    .select('id, name, phone, role')
                    .order('name');

                if (empError) throw empError;
                setEmployees(empData || []);

                // 2. Fetch all attendance for the selected month
                const [year, month] = monthInput.split('-');
                const firstDayOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
                const lastDayOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

                const { data: attData, error: attError } = await supabase
                    .from('attendance')
                    .select('employee_id, status')
                    .gte('date', firstDayOfMonth)
                    .lte('date', lastDayOfMonth);

                if (attError) throw attError;

                // 3. Aggregate data per employee
                const aggregated = {};
                empData?.forEach(emp => {
                    aggregated[emp.id] = { present: 0, absent: 0, leave: 0 };
                });

                attData?.forEach(record => {
                    if (aggregated[record.employee_id]) {
                        if (record.status === 'Present') aggregated[record.employee_id].present++;
                        if (record.status === 'Absent') aggregated[record.employee_id].absent++;
                        if (record.status === 'Leave') aggregated[record.employee_id].leave++;
                    }
                });

                // Convert aggregated object to array matching employees list
                const reportList = empData?.map(emp => ({
                    ...emp,
                    ...aggregated[emp.id],
                    totalMarked: aggregated[emp.id].present + aggregated[emp.id].absent + aggregated[emp.id].leave
                })) || [];

                setAttendanceData(reportList);

            } catch (error) {
                console.error('Error fetching monthly report:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [monthInput]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <FileBarChart className="text-indigo-600" size={28} />
                        Monthly Attendance Report
                    </h1>
                    <p className="text-slate-500 text-sm mt-1">Aggregated employee attendance view across the entire month.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <MonthSelector
                        selectedMonth={monthInput}
                        onMonthChange={setMonthInput}
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="font-semibold text-slate-700">Report Data — <span className="text-indigo-600 font-bold">{formattedMonthYear}</span></h2>

                    <div className="flex gap-4 text-xs font-semibold">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Present
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-red-500"></span> Absent
                        </div>
                        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span> Leave
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="px-6 py-4 font-medium">Employee</th>
                                <th className="px-6 py-4 font-medium text-center">Present</th>
                                <th className="px-6 py-4 font-medium text-center">Absent</th>
                                <th className="px-6 py-4 font-medium text-center">Leave</th>
                                <th className="px-6 py-4 font-medium text-right">Total Marked</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center">
                                            <Loader2 className="animate-spin h-6 w-6 text-indigo-600" />
                                        </div>
                                    </td>
                                </tr>
                            ) : attendanceData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                                        No records found for this month.
                                    </td>
                                </tr>
                            ) : (
                                attendanceData.map((record) => (
                                    <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {record.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{record.name}</p>
                                                    <p className="text-xs text-slate-500">{record.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold ${record.present > 0 ? 'bg-emerald-100 text-emerald-700' : 'text-slate-400 bg-slate-50'}`}>
                                                {record.present}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold ${record.absent > 0 ? 'bg-red-100 text-red-700' : 'text-slate-400 bg-slate-50'}`}>
                                                {record.absent}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center justify-center px-4 py-1.5 rounded-full text-sm font-bold ${record.leave > 0 ? 'bg-amber-100 text-amber-700' : 'text-slate-400 bg-slate-50'}`}>
                                                {record.leave}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className="text-slate-600 font-medium text-sm">
                                                {record.totalMarked} <span className="text-slate-400 font-normal">days</span>
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminMonthlyAttendance;
