import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from './components/ui/sonner';
import { Layout } from './components/Layout';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { LeadsPage } from './pages/LeadsPage';
import { BrokersPage } from './pages/BrokersPage';
import { GamificationPage } from './pages/GamificationPage';
import { ScriptsPage } from './pages/ScriptsPage';
import { SettingsPage } from './pages/SettingsPage';
import { CalendarPage } from './pages/CalendarPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AutomationsPage } from './pages/AutomationsPage';
import { ImportLeadsPage } from './pages/ImportLeadsPage';
import { EmailEditorPage } from './pages/EmailEditorPage';
import { DatabaseChatPage } from './pages/DatabaseChatPage';
import { ProductsPage } from './pages/ProductsPage';
import { EncuentraLeadsPage } from './pages/EncuentraLeadsPage';
import { ModuleTrackerPage } from './pages/ModuleTrackerPage';
import { LandingPage } from './pages/LandingPage';
import { DemoRequestPage } from './pages/DemoRequestPage';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to onboarding if not completed
  if (user && !user.onboarding_completed && window.location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

// Public Route component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    if (user && !user.onboarding_completed) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Page - Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />

      {/* Demo Request Page - Public */}
      <Route path="/demo-request" element={<DemoRequestPage />} />
      <Route path="/contact-sales" element={<DemoRequestPage enterprise />} />

      {/* Public routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />

      {/* Onboarding */}
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute>
            <OnboardingPage />
          </ProtectedRoute>
        }
      />

      {/* Protected routes with Layout */}
      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/brokers" element={<BrokersPage />} />
        <Route path="/gamification" element={<GamificationPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/automations" element={<AutomationsPage />} />
        <Route path="/import" element={<ImportLeadsPage />} />
        <Route path="/encuentra-leads" element={<EncuentraLeadsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/module-tracker" element={<ModuleTrackerPage />} />
        <Route path="/scripts" element={<ScriptsPage />} />
        <Route path="/database-chat" element={<DatabaseChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Email Editor - Full screen without Layout */}
      <Route 
        path="/email-templates/new" 
        element={
          <ProtectedRoute>
            <EmailEditorPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/email-templates/:templateId" 
        element={
          <ProtectedRoute>
            <EmailEditorPage />
          </ProtectedRoute>
        } 
      />

      {/* Default redirect */}
      <Route path="*" element={<LandingPage />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
