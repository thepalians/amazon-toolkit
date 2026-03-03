import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { CountryProvider } from './context/CountryContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import ProfitCalculator from './components/ProfitCalculator/ProfitCalculator';
import KeywordResearch from './components/KeywordResearch/KeywordResearch';
import ListingOptimizer from './components/ListingOptimizer/ListingOptimizer';
import CompetitorMonitor from './components/CompetitorMonitor/CompetitorMonitor';
import AuthPage from './components/Auth/AuthPage';
import AdminLogin from './components/Admin/AdminLogin';
import AdminLayout from './components/Admin/AdminLayout';
import AdminDashboard from './components/Admin/AdminDashboard';
import AdminUsers from './components/Admin/AdminUsers';
import AdminApiKeys from './components/Admin/AdminApiKeys';
import AdminSettings from './components/Admin/AdminSettings';
import AdminLogs from './components/Admin/AdminLogs';
import PricingPage from './components/Subscription/PricingPage';
import AdminLicenseKeys from './components/Admin/AdminLicenseKeys';
import AdminPlans from './components/Admin/AdminPlans';
import AdminSubscriptions from './components/Admin/AdminSubscriptions';
import TermsOfService from './components/Legal/TermsOfService';
import PrivacyPolicy from './components/Legal/PrivacyPolicy';
import ActivatePage from './components/Activate/ActivatePage';
import KeyManagement from './components/Admin/KeyManagement';

function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} />
      <div className="main-content">
        <Navbar onToggleSidebar={() => setSidebarOpen((o) => !o)} />
        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}

function PrivateRoute({ children }) {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem('adminToken');
  return token ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter basename="/amazon-seller-toolkit">
      <ThemeProvider>
        <CountryProvider>
          <Routes>
          {/* Regular user routes */}
          <Route path="/login" element={<AuthPage mode="login" />} />
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/profit"
            element={
              <PrivateRoute>
                <AppLayout>
                  <ProfitCalculator />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/keywords"
            element={
              <PrivateRoute>
                <AppLayout>
                  <KeywordResearch />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/listing"
            element={
              <PrivateRoute>
                <AppLayout>
                  <ListingOptimizer />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/competitor"
            element={
              <PrivateRoute>
                <AppLayout>
                  <CompetitorMonitor />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/pricing"
            element={
              <PrivateRoute>
                <AppLayout>
                  <PricingPage />
                </AppLayout>
              </PrivateRoute>
            }
          />
          <Route
            path="/activate"
            element={
              <PrivateRoute>
                <AppLayout>
                  <ActivatePage />
                </AppLayout>
              </PrivateRoute>
            }
          />

          {/* Legal routes (public) */}
          <Route path="/terms" element={<AppLayout><TermsOfService /></AppLayout>} />
          <Route path="/privacy" element={<AppLayout><PrivacyPolicy /></AppLayout>} />

          {/* Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminLayout />
              </AdminRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="api-keys" element={<AdminApiKeys />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="logs" element={<AdminLogs />} />
            <Route path="plans" element={<AdminPlans />} />
            <Route path="license-keys" element={<AdminLicenseKeys />} />
            <Route path="subscriptions" element={<AdminSubscriptions />} />
            <Route path="activation-keys" element={<KeyManagement />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </CountryProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
