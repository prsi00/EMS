import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Users, CalendarCheck, DollarSign, LogOut, Menu, X, LayoutDashboard, FileBarChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Layout = () => {
    const { user, isAdmin, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const adminNavItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
        { name: 'Employees', path: '/admin/employees', icon: Users },
        { name: 'Daily Attendance', path: '/admin/attendance', icon: CalendarCheck },
        { name: 'Monthly Report', path: '/admin/monthly-attendance', icon: FileBarChart },
        { name: 'Salary', path: '/admin/salary', icon: DollarSign },
    ];

    const employeeNavItems = [
        { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    ];

    const navItems = isAdmin ? adminNavItems : employeeNavItems;

    const SidebarContent = () => (
        <div className="flex h-full flex-col bg-slate-900 text-white">
            <div className="flex items-center px-6 py-5 border-b border-slate-700">
                <div className="flex items-center gap-2 font-bold text-xl tracking-wide">
                    <div className="bg-indigo-500 p-1.5 rounded-lg">
                        <Users className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-white">EMS Pro</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4">
                <ul className="space-y-2">
                    {navItems.map((item) => (
                        <li key={item.path}>
                            <NavLink
                                to={item.path}
                                onClick={() => setMobileMenuOpen(false)}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${isActive
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                                    }`
                                }
                            >
                                <item.icon className="h-5 w-5 flex-shrink-0" />
                                {item.name}
                            </NavLink>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="border-t border-slate-700 p-4">
                <div className="flex items-center gap-3 px-4 py-3">
                    <div className="h-9 w-9 rounded-full bg-slate-700 flex items-center justify-center font-semibold text-sm">
                        {user?.name?.charAt(0) || 'U'}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium leading-none">{user?.name}</span>
                        <span className="text-xs text-slate-400 mt-1 capitalize">{user?.role}</span>
                    </div>
                </div>
                <button
                    onClick={handleLogout}
                    className="mt-2 flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-slate-300 hover:bg-red-500/10 hover:text-red-500 transition-colors"
                >
                    <LogOut className="h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    );

    return (
        <div className="flex h-screen w-full bg-slate-50 font-sans">
            {/* Mobile Sidebar Backdrop */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-slate-900/50 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Desktop & Mobile */}
            <div
                className={`fixed inset-y-0 left-0 z-50 w-64 transform transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                <SidebarContent />
            </div>

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Mobile Header */}
                <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
                    <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
                        <div className="bg-indigo-500 p-1.5 rounded-lg leading-none">
                            <Users className="h-4 w-4 text-white" />
                        </div>
                        <span>EMS Pro</span>
                    </div>

                    <button
                        onClick={() => setMobileMenuOpen(true)}
                        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                    >
                        <Menu className="h-6 w-6" />
                    </button>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-8">
                    <div className="mx-auto max-w-6xl">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;
