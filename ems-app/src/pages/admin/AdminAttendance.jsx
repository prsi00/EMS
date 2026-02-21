import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Calendar, Save, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

const AdminAttendance = () => {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [employees, setEmployees] = useState([]);
    const [attendance, setAttendance] = useState({}); // { employee_id: status }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null); // 'success' or 'error'

    const fetchData = async () => {
        setLoading(true);
        setSaveStatus(null);
        try {
            // Fetch all employees
            const { data: empData, error: empError } = await supabase
                .from('employees')
                .select('*')
                .order('name');

            if (empError) throw empError;
            setEmployees(empData || []);

            // Fetch attendance for selected date
            const { data: attData, error: attError } = await supabase
                .from('attendance')
                .select('*')
                .eq('date', date);

            if (attError) throw attError;

            // Map existing attendance
            const attMap = {};
            if (attData) {
                attData.forEach(record => {
                    attMap[record.employee_id] = record.status;
                });
            }
            setAttendance(attMap);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const handleStatusChange = (employeeId, status) => {
        setAttendance(prev => ({
            ...prev,
            [employeeId]: status
        }));
        setSaveStatus(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus(null);

        try {
            // Since there's no guaranteed unique constraint on (employee_id, date),
            // safest bulk update approach is deleting existing for this date, then inserting new.

            const { error: deleteError } = await supabase
                .from('attendance')
                .delete()
                .eq('date', date);

            if (deleteError) throw deleteError;

            const recordsToInsert = Object.entries(attendance).map(([employee_id, status]) => ({
                employee_id,
                date,
                status
            }));

            if (recordsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('attendance')
                    .insert(recordsToInsert);

                if (insertError) throw insertError;
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000); // Clear success message after 3s
        } catch (error) {
            console.error('Error saving attendance:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    const markAll = (status) => {
        const newAtt = {};
        employees.forEach(emp => {
            newAtt[emp.id] = status;
        });
        setAttendance(newAtt);
        setSaveStatus(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Mark Attendance</h1>
                    <p className="text-slate-500 text-sm mt-1">Record daily presence for all employees.</p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-48">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                            <Calendar size={18} />
                        </div>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm font-medium text-slate-700 bg-white"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-70 disabled:cursor-not-allowed min-w-[120px]"
                    >
                        {saving ? (
                            <Loader2 className="animate-spin h-5 w-5" />
                        ) : (
                            <>
                                <Save size={18} />
                                Save All
                            </>
                        )}
                    </button>
                </div>
            </div>

            {saveStatus === 'success' && (
                <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-200 animate-in fade-in slide-in-from-top-2">
                    <CheckCircle2 size={20} />
                    <p className="font-medium text-sm">Attendance saved successfully for {date}!</p>
                </div>
            )}

            {saveStatus === 'error' && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                    <AlertCircle size={20} />
                    <p className="font-medium text-sm">Failed to save attendance. Please try again.</p>
                </div>
            )}

            {/* Daily Summary Stats */}
            {!loading && employees.length > 0 && (
                <div className="flex flex-wrap gap-4 mb-2">
                    <div className="px-4 py-2 bg-white border border-slate-200 rounded-lg shadow-sm text-sm">
                        <span className="text-slate-500 mr-2">Total Staff:</span>
                        <span className="font-bold text-slate-800">{employees.length}</span>
                    </div>
                    <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-lg shadow-sm text-sm">
                        <span className="text-emerald-600 mr-2">Present:</span>
                        <span className="font-bold text-emerald-700">
                            {Object.values(attendance).filter(s => s === 'Present').length}
                        </span>
                    </div>
                    <div className="px-4 py-2 bg-red-50 border border-red-100 rounded-lg shadow-sm text-sm">
                        <span className="text-red-600 mr-2">Absent:</span>
                        <span className="font-bold text-red-700">
                            {Object.values(attendance).filter(s => s === 'Absent').length}
                        </span>
                    </div>
                    <div className="px-4 py-2 bg-amber-50 border border-amber-100 rounded-lg shadow-sm text-sm">
                        <span className="text-amber-600 mr-2">Leave:</span>
                        <span className="font-bold text-amber-700">
                            {Object.values(attendance).filter(s => s === 'Leave').length}
                        </span>
                    </div>
                    <div className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg shadow-sm text-sm">
                        <span className="text-slate-500 mr-2">Unmarked:</span>
                        <span className="font-bold text-slate-700">
                            {employees.length - Object.values(attendance).length}
                        </span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
                    <h2 className="font-semibold text-slate-700">Employee List</h2>
                    <div className="flex gap-2">
                        <button onClick={() => markAll('Present')} className="text-xs font-medium px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-md hover:bg-emerald-200 transition-colors">Mark All Present</button>
                        <button onClick={() => markAll('Absent')} className="text-xs font-medium px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors">Mark All Absent</button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="px-6 py-4 font-medium">Employee</th>
                                <th className="px-6 py-4 font-medium text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="2" className="px-6 py-12 text-center text-slate-500">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : employees.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="px-6 py-12 text-center text-slate-500">
                                        No employees found. Add employees first.
                                    </td>
                                </tr>
                            ) : (
                                employees.map((employee) => (
                                    <tr key={employee.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm shrink-0">
                                                    {employee.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-slate-800">{employee.name}</p>
                                                    <p className="text-xs text-slate-500">{employee.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex justify-end gap-2">
                                                {['Present', 'Absent', 'Leave'].map((statusOption) => {
                                                    const isSelected = attendance[employee.id] === statusOption;
                                                    let colors = "bg-slate-100 text-slate-600 hover:bg-slate-200 border-transparent";

                                                    if (isSelected) {
                                                        if (statusOption === 'Present') colors = "bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm ring-1 ring-emerald-500";
                                                        else if (statusOption === 'Absent') colors = "bg-red-100 text-red-700 border-red-300 shadow-sm ring-1 ring-red-500";
                                                        else colors = "bg-amber-100 text-amber-700 border-amber-300 shadow-sm ring-1 ring-amber-500";
                                                    }

                                                    return (
                                                        <button
                                                            key={statusOption}
                                                            onClick={() => handleStatusChange(employee.id, statusOption)}
                                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all duration-200 ${colors}`}
                                                        >
                                                            {statusOption}
                                                        </button>
                                                    );
                                                })}
                                            </div>
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

export default AdminAttendance;
