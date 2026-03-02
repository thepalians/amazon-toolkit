import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

import { CountryProvider } from './context/CountryContext';
import Navbar from './components/Layout/Navbar';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard/Dashboard';
import ProfitCalculator from './components/ProfitCalculator/ProfitCalculator';
import KeywordResearch from './components/KeywordResearch/KeywordResearch';
import ListingOptimizer from './components/ListingOptimizer/ListingOptimizer';
import CompetitorMonitor from './components/CompetitorMonitor/CompetitorMonitor';
import AuthPage from './components/Auth/AuthPage';

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

export default function App() {
  return (
    <BrowserRouter basename="/amazon-seller-toolkit">
      <CountryProvider>
        <Routes>
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </CountryProvider>
    </BrowserRouter>
  );
}
