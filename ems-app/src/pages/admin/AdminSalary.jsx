import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Calendar, Save, Loader2, CheckCircle2, AlertCircle, IndianRupee } from 'lucide-react';
import MonthSelector from '../../components/MonthSelector';

const AdminSalary = () => {
    // Default to current month, format YYYY-MM for the input
    const [monthInput, setMonthInput] = useState(() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    });

    const [employees, setEmployees] = useState([]);
    const [salaries, setSalaries] = useState({}); // { employee_id: amount }
    const [creditedDates, setCreditedDates] = useState({}); // { employee_id: 'YYYY-MM-DD' }
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState(null);

    // Convert YYYY-MM to "Month Year" for saving to DB
    const getFormattedMonthYear = (input) => {
        if (!input) return '';
        const [year, month] = input.split('-');
        const date = new Date(year, month - 1, 1);
        return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    };

    const formattedMonthYear = getFormattedMonthYear(monthInput);

    const fetchData = async () => {
        if (!formattedMonthYear) return;

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

            // Fetch salaries for selected month_year
            const { data: salaryData, error: salaryError } = await supabase
                .from('salaries')
                .select('*')
                .eq('month_year', formattedMonthYear);

            if (salaryError) throw salaryError;

            // Map existing salaries
            const salaryMap = {};
            const dateMap = {};
            if (salaryData) {
                salaryData.forEach(record => {
                    salaryMap[record.employee_id] = record.amount;
                    if (record.credited_date) {
                        dateMap[record.employee_id] = record.credited_date;
                    }
                });
            }
            setSalaries(salaryMap);
            setCreditedDates(dateMap);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [monthInput]);

    const handleAmountChange = (employeeId, value) => {
        // Only allow numbers and one decimal point
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
            setSalaries(prev => ({
                ...prev,
                [employeeId]: value
            }));

            // Set default date to today if amount is entered and no date exists
            if (value !== '' && !creditedDates[employeeId]) {
                setCreditedDates(prev => ({
                    ...prev,
                    [employeeId]: new Date().toISOString().split('T')[0]
                }));
            }

            setSaveStatus(null);
        }
    };

    const handleDateChange = (employeeId, value) => {
        setCreditedDates(prev => ({
            ...prev,
            [employeeId]: value
        }));
        setSaveStatus(null);
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveStatus(null);

        try {
            // Safest bulk update approach: delete existing for this month, then insert new.
            const { error: deleteError } = await supabase
                .from('salaries')
                .delete()
                .eq('month_year', formattedMonthYear);

            if (deleteError) throw deleteError;

            const recordsToInsert = Object.entries(salaries)
                .filter(([_, amount]) => amount && amount !== '' && parseFloat(amount) > 0)
                .map(([employee_id, amount]) => ({
                    employee_id,
                    month_year: formattedMonthYear,
                    amount: parseFloat(amount),
                    credited_date: creditedDates[employee_id] || new Date().toISOString().split('T')[0]
                }));

            if (recordsToInsert.length > 0) {
                const { error: insertError } = await supabase
                    .from('salaries')
                    .insert(recordsToInsert);

                if (insertError) throw insertError;
            }

            setSaveStatus('success');
            setTimeout(() => setSaveStatus(null), 3000); // Clear success message after 3s
        } catch (error) {
            console.error('Error saving salaries:', error);
            setSaveStatus('error');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Process Salary</h1>
                    <p className="text-slate-500 text-sm mt-1">Bulk enter payroll for your team.</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                    <MonthSelector
                        selectedMonth={monthInput}
                        onMonthChange={setMonthInput}
                    />

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
                    <p className="font-medium text-sm">Salaries saved successfully for {formattedMonthYear}!</p>
                </div>
            )}

            {saveStatus === 'error' && (
                <div className="flex items-center gap-2 bg-red-50 text-red-700 p-4 rounded-lg border border-red-200">
                    <AlertCircle size={20} />
                    <p className="font-medium text-sm">Failed to save salaries. Please try again.</p>
                </div>
            )}

            {/* Aggregate Payroll Summary */}
            {!loading && employees.length > 0 && (
                <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl shadow-sm p-5 text-white flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <p className="text-indigo-100 text-sm font-medium">Estimated Payroll for {formattedMonthYear}</p>
                        <h2 className="text-3xl font-bold mt-1">
                            ₹{Object.values(salaries).reduce((sum, val) => sum + (parseFloat(val) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                    </div>
                    <div className="flex gap-4 text-sm bg-white/10 px-4 py-2 rounded-lg backdrop-blur-sm">
                        <div>
                            <span className="text-indigo-200 mr-2">Records:</span>
                            <span className="font-semibold">{Object.values(salaries).filter(v => parseFloat(v) > 0).length} / {employees.length}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <h2 className="font-semibold text-slate-700">Salary Entry — <span className="text-indigo-600 font-bold">{formattedMonthYear}</span></h2>
                    <p className="text-xs text-slate-500">Leaving an amount empty will result in no salary record for that employee this month.</p>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 text-slate-500 text-xs uppercase tracking-wider border-b border-slate-200">
                                <th className="px-6 py-4 font-medium">Employee</th>
                                <th className="px-6 py-4 font-medium text-right">Amount (₹) & Credit Date</th>
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
                                                    <p className="text-xs text-slate-500">{employee.role}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col sm:flex-row justify-end gap-2">
                                                <div className="relative w-full sm:w-40">
                                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                                        <IndianRupee size={16} />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={salaries[employee.id] || ''}
                                                        onChange={(e) => handleAmountChange(employee.id, e.target.value)}
                                                        placeholder="Amount"
                                                        className="block w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800 text-right text-sm"
                                                    />
                                                </div>
                                                <div className="relative w-full sm:w-40">
                                                    <input
                                                        type="date"
                                                        value={creditedDates[employee.id] || ''}
                                                        onChange={(e) => handleDateChange(employee.id, e.target.value)}
                                                        className="block w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 bg-white text-sm"
                                                        title="Credit Date"
                                                    />
                                                </div>
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

export default AdminSalary;
