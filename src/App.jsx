import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import ParentDashboard from './pages/parent/ParentDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Authentication Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Role-Based Dashboards */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher"
            element={
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <ProtectedRoute allowedRoles={['parent']}>
                <ParentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Catch-all redirect back to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;