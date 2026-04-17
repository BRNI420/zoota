import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Client pages
import Onboarding from './pages/client/Onboarding';
import Dashboard from './pages/client/Dashboard';
import Workouts from './pages/client/Workouts';
import Nutrition from './pages/client/Nutrition';
import AICoach from './pages/client/AICoach';
import News from './pages/client/News';
import Learn from './pages/client/Learn';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientList from './pages/admin/ClientList';
import VideoManager from './pages/admin/VideoManager';
import PlanEditor from './pages/admin/PlanEditor';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" replace />;

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-lg">טוען ZOOTA...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace /> : <Register />} />

      {/* Client routes */}
      <Route path="/onboarding" element={
        <ProtectedRoute>
          <Onboarding />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Layout><Dashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/workouts" element={
        <ProtectedRoute>
          <Layout><Workouts /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/nutrition" element={
        <ProtectedRoute>
          <Layout><Nutrition /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/coach" element={
        <ProtectedRoute>
          <Layout><AICoach /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/news" element={
        <ProtectedRoute>
          <Layout><News /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/learn" element={
        <ProtectedRoute>
          <Layout><Learn /></Layout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute adminOnly>
          <Layout><AdminDashboard /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/clients" element={
        <ProtectedRoute adminOnly>
          <Layout><ClientList /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/videos" element={
        <ProtectedRoute adminOnly>
          <Layout><VideoManager /></Layout>
        </ProtectedRoute>
      } />
      <Route path="/admin/plans" element={
        <ProtectedRoute adminOnly>
          <Layout><PlanEditor /></Layout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={
        user
          ? <Navigate to={user.role === 'admin' ? '/admin' : '/dashboard'} replace />
          : <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
