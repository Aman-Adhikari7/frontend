import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AdminRoute, PublicRoute } from './components/common/ProtectedRoute';
import Sidebar from './components/layout/Sidebar';

// ── Lazy-loaded pages ─────────────────────────────────────────────────────────
const Login        = lazy(() => import('./pages/Auth/Login'));
const Register     = lazy(() => import('./pages/Auth/Register'));
const Dashboard    = lazy(() => import('./pages/Dashboard/Dashboard'));
const Events       = lazy(() => import('./pages/Events/Events'));
const ScanQR       = lazy(() => import('./pages/Attendance/ScanQR'));
const Wallet       = lazy(() => import('./pages/Wallet/Wallet'));
const Store        = lazy(() => import('./pages/Store/Store'));
const AILearning   = lazy(() => import('./pages/AI/AILearning'));
const Leaderboard  = lazy(() => import('./pages/Leaderboard/Leaderboard'));
const Tasks        = lazy(() => import('./pages/Tasks/Tasks'));
const Polls        = lazy(() => import('./pages/Polls/Polls'));
const Profile      = lazy(() => import('./pages/Profile/Profile'));
const AdminPanel   = lazy(() => import('./pages/Admin/AdminPanel'));

// Page loader fallback
const PageLoader = () => (
  <div className="page-loader">
    <div className="spinner" />
    <span>Loading...</span>
  </div>
);

// Layout wrapper for authenticated pages (sidebar + content)
const AppLayout = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <main className="main-content animate-fade-in">
      {children}
    </main>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#1a1c26',
              color: '#f0f0f8',
              border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: '10px',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#22d9a0', secondary: '#1a1c26' },
            },
            error: {
              iconTheme: { primary: '#ff4f6a', secondary: '#1a1c26' },
            },
          }}
        />

        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* ── Public routes (redirect to dashboard if logged in) ── */}
            <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

            {/* ── Protected routes ── */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <AppLayout><Dashboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/events" element={
              <ProtectedRoute>
                <AppLayout><Events /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/scan" element={
              <ProtectedRoute>
                <AppLayout><ScanQR /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/wallet" element={
              <ProtectedRoute>
                <AppLayout><Wallet /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/store" element={
              <ProtectedRoute>
                <AppLayout><Store /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/ai" element={
              <ProtectedRoute>
                <AppLayout><AILearning /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/leaderboard" element={
              <ProtectedRoute>
                <AppLayout><Leaderboard /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/tasks" element={
              <ProtectedRoute>
                <AppLayout><Tasks /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/polls" element={
              <ProtectedRoute>
                <AppLayout><Polls /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/profile" element={
              <ProtectedRoute>
                <AppLayout><Profile /></AppLayout>
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AppLayout><AdminPanel /></AppLayout>
              </AdminRoute>
            } />

            {/* ── Redirects ── */}
            <Route path="/"   element={<Navigate to="/dashboard" replace />} />
            <Route path="*"   element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;