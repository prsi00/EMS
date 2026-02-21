import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Users, CalendarCheck, FileSpreadsheet, AlertCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalEmployees: 0,
        todayAttendance: {
            present: 0,
            absent: 0,
            leave: 0,
            unmarked: 0
        },
        latestSalary: {
            month: '',
            totalAmount: 0
        }
    });

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                setLoading(true);
                // 1. Total Employees
                const { count: empCount, error: empError } = await supabase
                    .from('employees')
                    .select('*', { count: 'exact', head: true })
                    .eq('role', 'employee'); // Or all including admin, up to business logic. Let's count all non-admins as actual employees for HR metric.

                // 2. Today's Attendance
                const todayStr = new Date().toISOString().split('T')[0];
                const { data: attData, error: attError } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('date', todayStr);

                let present = 0, absent = 0, leave = 0;
                if (attData) {
                    attData.forEach(record => {
                        if (record.status === 'Present') present++;
                        if (record.status === 'Absent') absent++;
                        if (record.status === 'Leave') leave++;
                    });
                }

                // Calculate unmarked if we have total employee count
                const totalStaffCount = empCount || 0;
                const totalMarked = present + absent + leave;
                const unmarked = Math.max(0, totalStaffCount - totalMarked);

                // 3. Latest Salary Month & Total
                // Get the most recent month from salaries
                const { data: latestDateData } = await supabase
                    .from('salaries')
                    .select('month_year')
                    .order('id', { ascending: false })
                    .limit(1);

                let latestMonth = '';
                let totalAmount = 0;

                if (latestDateData && latestDateData.length > 0) {
                    latestMonth = latestDateData[0].month_year;
                    // Sum up amounts for this month
                    const { data: monthSalaries } = await supabase
                        .from('salaries')
                        .select('amount')
                        .eq('month_year', latestMonth);

                    if (monthSalaries) {
                        totalAmount = monthSalaries.reduce((sum, record) => sum + parseFloat(record.amount || 0), 0);
                    }
                }

                setStats({
                    totalEmployees: totalStaffCount,
                    todayAttendance: { present, absent, leave, unmarked },
                    latestSalary: { month: latestMonth, totalAmount }
                });

            } catch (error) {
                console.error("Error fetching admin stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardStats();
    }, []);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800">Admin Overview</h1>
                <p className="text-slate-500 mt-1">Real-time pulse of your organization as of {new Date().toLocaleDateString()}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* Total Employees */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl">
                            <Users size={24} />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700">Total Workforce</h2>
                    </div>
                    <div>
                        <h3 className="text-4xl font-bold text-slate-800">{stats.totalEmployees}</h3>
                        <p className="text-sm text-slate-500 mt-1">Active employee accounts</p>
                    </div>
                </div>

                {/* Today's Attendance Overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                            <CalendarCheck size={24} />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700">Today's Attendance</h2>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Present</span>
                            <span className="font-semibold text-slate-800">{stats.todayAttendance.present}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Absent</span>
                            <span className="font-semibold text-slate-800">{stats.todayAttendance.absent}</span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Leave</span>
                            <span className="font-semibold text-slate-800">{stats.todayAttendance.leave}</span>
                        </div>
                        {stats.todayAttendance.unmarked > 0 && (
                            <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center text-xs text-amber-600 font-medium bg-amber-50 p-2 rounded-lg">
                                <span className="flex items-center gap-1.5"><AlertCircle size={14} /> Unmarked</span>
                                <span>{stats.todayAttendance.unmarked}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Latest Payroll */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col justify-between">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                            <FileSpreadsheet size={24} />
                        </div>
                        <h2 className="text-lg font-semibold text-slate-700">Latest Payroll</h2>
                    </div>
                    <div>
                        {stats.latestSalary.month ? (
                            <>
                                <h3 className="text-3xl font-bold text-slate-800">₹{stats.latestSalary.totalAmount.toLocaleString()}</h3>
                                <p className="text-sm text-slate-500 mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
                                    Total dispersed in {stats.latestSalary.month}
                                </p>
                            </>
                        ) : (
                            <div className="text-slate-400 py-4 text-sm font-medium">No salary records.</div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminDashboard;
