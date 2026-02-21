import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthGuard from './components/AuthGuard';
import Layout from './components/Layout';

// Pages
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminEmployees from './pages/admin/AdminEmployees';
import AdminAttendance from './pages/admin/AdminAttendance';
import AdminMonthlyAttendance from './pages/admin/AdminMonthlyAttendance';
import AdminSalary from './pages/admin/AdminSalary';

// Dynamic Dashboard component based on role
const RoleBasedDashboard = () => {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <EmployeeDashboard />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Authenticated Routes with Sidebar */}
          <Route path="/" element={<AuthGuard><Layout /></AuthGuard>}>
            {/* Redirect root to appropriate dashboard based on role? Let's default to dashboard, the AuthGuard or Dashboard could redirect admins to employees if needed. For now just root -> dashboard */}
            <Route index element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard Route (resolves based on role) */}
            <Route path="dashboard" element={<RoleBasedDashboard />} />

            {/* Admin Routes */}
            <Route
              path="admin/employees"
              element={
                <AuthGuard requireAdmin>
                  <AdminEmployees />
                </AuthGuard>
              }
            />
            <Route
              path="admin/attendance"
              element={
                <AuthGuard requireAdmin>
                  <AdminAttendance />
                </AuthGuard>
              }
            />
            <Route
              path="admin/monthly-attendance"
              element={
                <AuthGuard requireAdmin>
                  <AdminMonthlyAttendance />
                </AuthGuard>
              }
            />
            <Route
              path="admin/salary"
              element={
                <AuthGuard requireAdmin>
                  <AdminSalary />
                </AuthGuard>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
