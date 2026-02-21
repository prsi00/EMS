import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { CalendarCheck, CalendarDays, CheckCircle2, IndianRupee, AlertCircle } from 'lucide-react';
import MonthSelector from '../components/MonthSelector';

const EmployeeDashboard = () => {
    const { user } = useAuth();

    // Default to current month YYYY-MM
    const [monthInput, setMonthInput] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const [salaries, setSalaries] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]);
    const [attendanceStats, setAttendanceStats] = useState({ present: 0, absent: 0, leave: 0 });
    const [loading, setLoading] = useState(true);

    // Convert YYYY-MM to display format
    const getFormattedMonthYear = (input) => {
        if (!input) return '';
        const [year, month] = input.split('-');
        const date = new Date(year, month - 1, 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };
    const displayMonth = getFormattedMonthYear(monthInput);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;

            try {
                setLoading(true);
                // Fetch salaries (All history for the table, though we could filter by month, usually they want to see all or latest)
                // Let's keep it bringing all to show history, but we'll focus the cards on the selected month
                const { data: salaryData } = await supabase
                    .from('salaries')
                    .select('*')
                    .eq('employee_id', user.id)
                    .order('id', { ascending: false });

                if (salaryData) {
                    setSalaries(salaryData);
                }

                // Fetch attendance for selected month
                const [year, month] = monthInput.split('-');
                const firstDayOfMonth = new Date(year, month - 1, 1).toISOString().split('T')[0];
                const lastDayOfMonth = new Date(year, month, 0).toISOString().split('T')[0];

                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('employee_id', user.id)
                    .gte('date', firstDayOfMonth)
                    .lte('date', lastDayOfMonth)
                    .order('date', { ascending: false });

                if (attendanceData) {
                    setAttendanceRecords(attendanceData);

                    let p = 0, a = 0, l = 0;
                    attendanceData.forEach(record => {
                        if (record.status === 'Present') p++;
                        if (record.status === 'Absent') a++;
                        if (record.status === 'Leave') l++;
                    });
                    setAttendanceStats({ present: p, absent: a, leave: l });
                } else {
                    setAttendanceRecords([]);
                    setAttendanceStats({ present: 0, absent: 0, leave: 0 });
                }

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user, monthInput]);

    const latestSalary = salaries.length > 0 ? salaries[0] : null; // Most recent overall
    const selectedMonthSalary = salaries.find(s => s.month_year === displayMonth);

    if (loading && salaries.length === 0) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Welcome back, {user?.name}</h1>
                    <p className="text-slate-500 mt-1">Here's your overview for <span className="font-semibold text-indigo-600">{displayMonth}</span></p>
                </div>

                <MonthSelector
                    selectedMonth={monthInput}
                    onMonthChange={setMonthInput}
                />
            </div>

            {/* Overview Cards targeting the selected month */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Present Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Days Present</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">{attendanceStats.present}</h3>
                    </div>
                    <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                        <CalendarCheck size={24} />
                    </div>
                </div>

                {/* Absent/Leave Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Absent / Leave</p>
                        <h3 className="text-2xl font-bold text-slate-800 mt-1">
                            {attendanceStats.absent} <span className="text-slate-300 text-lg">/</span> {attendanceStats.leave}
                        </h3>
                    </div>
                    <div className="p-3 bg-red-100 text-red-600 rounded-xl">
                        <AlertCircle size={24} />
                    </div>
                </div>

                {/* Selected Month Salary Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-5">
                        <IndianRupee size={100} />
                    </div>
                    <p className="text-sm font-medium text-slate-500 relative z-10">Salary ({displayMonth})</p>
                    <h3 className="text-2xl font-bold text-slate-800 mt-1 relative z-10">
                        {selectedMonthSalary ? `₹${selectedMonthSalary.amount}` : 'Pending'}
                    </h3>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Account Status</p>
                        <h3 className="text-xl font-bold text-slate-800 mt-1 capitalize">{user?.role}</h3>
                        <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1 font-medium">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> Active
                        </p>
                    </div>
                    <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                        <CheckCircle2 size={24} />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                {/* Detailed Attendance List */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col max-h-[500px]">
                    <div className="px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                        <h2 className="text-lg font-semibold text-slate-800">Attendance Log ({displayMonth})</h2>
                    </div>
                    <div className="overflow-y-auto flex-1 p-2">
                        {loading ? (
                            <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div></div>
                        ) : attendanceRecords.length === 0 ? (
                            <div className="text-center py-12 text-slate-500">No attendance records found for this month.</div>
                        ) : (
                            <div className="space-y-1">
                                {attendanceRecords.map((record) => {
                                    let statusColor = "bg-slate-100 text-slate-700";
                                    if (record.status === 'Present') statusColor = "bg-emerald-100 text-emerald-700";
                                    if (record.status === 'Absent') statusColor = "bg-red-100 text-red-700";
                                    if (record.status === 'Leave') statusColor = "bg-amber-100 text-amber-700";

                                    return (
                                        <div key={record.id} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-lg transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="text-slate-400">
                                                    <CalendarDays size={18} />
                                                </div>
                                                <span className="font-medium text-slate-700">
                                                    {new Date(record.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </span>
                                            </div>
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${statusColor}`}>
                                                {record.status}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Salary History Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col max-h-[500px]">
                    <div className="px-6 py-5 border-b border-slate-100 sticky top-0 bg-white rounded-t-2xl z-10">
                        <h2 className="text-lg font-semibold text-slate-800">All Salary History</h2>
                    </div>
                    <div className="overflow-y-auto flex-1">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 bg-slate-50 z-10">
                                <tr className="text-slate-500 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">Month</th>
                                    <th className="px-6 py-3 font-medium">Credit Date</th>
                                    <th className="px-6 py-3 font-medium">Amount</th>
                                    <th className="px-6 py-3 font-medium text-right">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {salaries.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-slate-500">
                                            No salary records found.
                                        </td>
                                    </tr>
                                ) : (
                                    salaries.map((salary) => (
                                        <tr key={salary.id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-800">
                                                {salary.month_year}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {salary.credited_date ? new Date(salary.credited_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                ₹{parseFloat(salary.amount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                                    Credited
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
        </div>
    );
};

export default EmployeeDashboard;
