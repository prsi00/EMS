import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Users, Phone, Calendar as CalendarIcon, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
    const [phone, setPhone] = useState('');
    const [dob, setDob] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!phone || phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }
        if (!dob) {
            setError('Please select your Date of Birth');
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await login(phone, dob);
            if (result.success) {
                // Redirect to where they were trying to go, or default based on role
                const from = location.state?.from?.pathname;
                if (from) {
                    navigate(from, { replace: true });
                } else if (result.user.role === 'admin') {
                    navigate('/admin/employees', { replace: true });
                } else {
                    navigate('/dashboard', { replace: true });
                }
            } else {
                setError(result.error || 'Invalid login credentials');
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-0 left-0 w-full h-80 bg-indigo-600 rounded-b-[40%] shadow-lg hidden md:block" />

            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 z-10 relative">
                <div className="flex flex-col items-center mb-8">
                    <div className="bg-indigo-100 p-3 rounded-xl mb-4 text-indigo-600">
                        <Users size={32} />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 text-center">EMS Hub</h2>
                    <p className="text-slate-500 text-sm mt-2 text-center">Sign in to manage your HR profile</p>
                </div>

                {error && (
                    <div className="mb-6 flex items-center gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700 border border-red-200">
                        <AlertCircle className="h-5 w-5 flex-shrink-0" />
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-2">
                        <label htmlFor="phone" className="block text-sm font-medium text-slate-700">
                            Phone Number
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <Phone className="h-5 w-5" />
                            </div>
                            <input
                                type="tel"
                                id="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter 10-digit number"
                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-400 text-slate-800"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="dob" className="block text-sm font-medium text-slate-700">
                            Date of Birth
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                                <CalendarIcon className="h-5 w-5" />
                            </div>
                            <input
                                type="date"
                                id="dob"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-slate-800"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" />
                                Signing in...
                            </>
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
