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
import { TasksPage } from './pages/TasksPage';
import { ImportLeadsPage } from './pages/ImportLeadsPage';
import { EmailEditorPage } from './pages/EmailEditorPage';
import { DatabaseChatPage } from './pages/DatabaseChatPage';
import { ProductsPage } from './pages/ProductsPage';
import { MarketplacePage } from './pages/MarketplacePage';
import { RoviInternalWorkspacePage } from './pages/RoviInternalWorkspacePage';
import { RoviAIControlTowerPage } from './pages/RoviAIControlTowerPage';
import { VibeLabPage } from './pages/VibeLabPage';
import { RentalsPage } from './pages/RentalsPage';
import { EncuentraLeadsPage } from './pages/EncuentraLeadsPage';
import { ModuleTrackerPage } from './pages/ModuleTrackerPage';
import { LandingPage } from './pages/LandingPage';
import { BrokerLandingPage } from './pages/BrokerLandingPage';
import { DemoRequestPage } from './pages/DemoRequestPage';
import { LeadSearchDashboard } from './pages/LeadSearchDashboard';
import { PricingCalculatorPage } from './pages/PricingCalculatorPage';
import { BrokerLinkPage } from './pages/BrokerLinkPage';
import { CopimPresentationPage } from './pages/CopimPresentationPage';
import { CopimDashboardDemoPage } from './pages/CopimDashboardDemoPage';
import { CopimOverviewPage } from './pages/CopimOverviewPage';
import { CopimAssociationsPage } from './pages/CopimAssociationsPage';
import { CopimMembersPage } from './pages/CopimMembersPage';
import { CopimMemberImportPage } from './pages/CopimMemberImportPage';
import { CopimMembershipsPage } from './pages/CopimMembershipsPage';
import { CopimInvoicesPage } from './pages/CopimInvoicesPage';
import { CopimEventsPage } from './pages/CopimEventsPage';
import { CopimAssociationProfilePage } from './pages/CopimAssociationProfilePage';
import { CopimAssociationCampaignsPage } from './pages/CopimAssociationCampaignsPage';
import { CopimAssociationPropertiesPage } from './pages/CopimAssociationPropertiesPage';
import { CopimAssociationCoursesPage } from './pages/CopimAssociationCoursesPage';
import { CopimAssociationCommunityPage } from './pages/CopimAssociationCommunityPage';
import { CopimAssociationModulesPage } from './pages/CopimAssociationModulesPage';
import { CopimCoursesWorkspacePage } from './pages/CopimCoursesWorkspacePage';
import { CopimMemberHomePage } from './pages/CopimMemberHomePage';
import { CopimMemberProfilePage } from './pages/CopimMemberProfilePage';
import { CopimMemberCampaignsPage } from './pages/CopimMemberCampaignsPage';
import { CopimMemberPropertiesPage } from './pages/CopimMemberPropertiesPage';
import { CopimMemberCoursesPage } from './pages/CopimMemberCoursesPage';
import { CopimMemberMembershipPage } from './pages/CopimMemberMembershipPage';
import { CopimMemberPaymentsPage } from './pages/CopimMemberPaymentsPage';
import { CopimMemberCredentialPage } from './pages/CopimMemberCredentialPage';
import { CopimMemberEventsPage } from './pages/CopimMemberEventsPage';
import { CopimMemberCommunityPage } from './pages/CopimMemberCommunityPage';
import { CopimMemberModulesPage } from './pages/CopimMemberModulesPage';
import { CopimMemberDirectoryPage } from './pages/CopimMemberDirectoryPage';
import { NegotiationStrategiesPage } from './pages/NegotiationStrategiesPage';
import {
  canManageCopimWorkspace,
  isCopimLocalAssociationUser,
  isCopimMemberUser,
  isCopimNationalUser,
  isPropertyManagerUser,
  isRoviControlTowerOwner,
  isRoviInternalUser,
  resolveAuthenticatedHome,
} from './lib/copimAccess';
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
  const { isAuthenticated, loading, user, appMode } = useAuth();
  const nextPath = new URLSearchParams(window.location.search).get('next');

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
    if (nextPath && nextPath.startsWith('/')) {
      return <Navigate to={nextPath} replace />;
    }
    return <Navigate to={resolveAuthenticatedHome(user, appMode)} replace />;
  }

  return children;
};

const CopimModuleRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={`/login?next=${encodeURIComponent(window.location.pathname)}`} replace />;
  }

  if (user && !user.onboarding_completed) {
    return <Navigate to="/onboarding" replace />;
  }

  return children;
};

const CopimAssociationRoute = ({ children }) => {
  const { user } = useAuth();

  if (isCopimMemberUser(user)) {
    return <Navigate to="/copim/member" replace />;
  }

  if (!canManageCopimWorkspace(user)) {
    return <Navigate to="/copim-demo" replace />;
  }

  return children;
};

const CopimNationalRoute = ({ children }) => {
  const { user } = useAuth();

  if (isCopimMemberUser(user)) {
    return <Navigate to="/copim/member" replace />;
  }

  if (isCopimLocalAssociationUser(user)) {
    return <Navigate to="/copim/association/profile" replace />;
  }

  if (!isCopimNationalUser(user)) {
    return <Navigate to="/copim-demo" replace />;
  }

  return children;
};

const CopimLocalAssociationRoute = ({ children }) => {
  const { user } = useAuth();

  if (isCopimMemberUser(user)) {
    return <Navigate to="/copim/member" replace />;
  }

  if (isCopimNationalUser(user)) {
    return <Navigate to="/copim/dashboard" replace />;
  }

  if (!isCopimLocalAssociationUser(user)) {
    return <Navigate to="/copim-demo" replace />;
  }

  return children;
};

const CopimMemberPortalRoute = ({ children }) => {
  const { user } = useAuth();

  if (!isCopimMemberUser(user)) {
    return <Navigate to={
      isCopimLocalAssociationUser(user)
        ? '/copim/association/profile'
        : canManageCopimWorkspace(user)
          ? '/copim/dashboard'
          : '/copim-demo'
    } replace />;
  }

  return children;
};

const RoviInternalRoute = ({ children, ownerOnly = false }) => {
  const { user } = useAuth();

  if (!isRoviInternalUser(user)) {
    return <Navigate to={resolveAuthenticatedHome(user)} replace />;
  }

  if (ownerOnly && !isRoviControlTowerOwner(user)) {
    return <Navigate to="/rovi/dashboard" replace />;
  }

  return children;
};

const PropertyManagerRoute = ({ children }) => {
  const { user } = useAuth();

  if (!isPropertyManagerUser(user)) {
    return <Navigate to={resolveAuthenticatedHome(user)} replace />;
  }

  return children;
};

const SalesCrmRoute = ({ children }) => {
  const { user } = useAuth();
  const role = user?.active_workspace?.role || user?.role;
  const tenantType = user?.active_workspace?.tenant_type || user?.account_type;
  const isSalesWorkspace = ['individual', 'agency'].includes(tenantType) || ['owner', 'admin', 'manager', 'broker'].includes(role);

  if (!isSalesWorkspace || isPropertyManagerUser(user) || isCopimMemberUser(user) || isCopimLocalAssociationUser(user) || isCopimNationalUser(user) || isRoviInternalUser(user)) {
    return <Navigate to={resolveAuthenticatedHome(user)} replace />;
  }

  return children;
};

const CopimHomeRedirect = () => {
  const { user } = useAuth();
  if (isCopimMemberUser(user)) {
    return <Navigate to="/copim/member" replace />;
  }

  if (isCopimLocalAssociationUser(user)) {
    return <Navigate to="/copim/association/profile" replace />;
  }

  if (canManageCopimWorkspace(user)) {
    return <Navigate to="/copim/dashboard" replace />;
  }

  return <Navigate to="/copim-demo" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Landing Pages - Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/landing" element={<LandingPage />} />
      <Route path="/for-brokers" element={<BrokerLandingPage />} />

      {/* Demo Request Page - Public */}
      <Route path="/demo-request" element={<DemoRequestPage />} />
      <Route path="/contact-sales" element={<DemoRequestPage enterprise />} />

      {/* Module Tracker - Public */}
      <Route path="/module-tracker" element={<ModuleTrackerPage />} />
      <Route path="/pricing-calculator" element={<PricingCalculatorPage />} />
      <Route path="/negotiation-strategies" element={<NegotiationStrategiesPage />} />
      <Route path="/copim-presentacion" element={<CopimPresentationPage />} />
      <Route path="/copim-memberships" element={<CopimPresentationPage />} />
      <Route path="/copim-demo" element={<CopimDashboardDemoPage />} />
      <Route path="/copim-dashboard-demo" element={<CopimDashboardDemoPage />} />

      {/* Public routes */}
      <Route path="/link-broker" element={<BrokerLinkPage />} />
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

      {/* Lead Search - Public (sin autenticación) */}
      <Route path="/lead-search" element={<LeadSearchDashboard />} />

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
        <Route
          path="/tasks"
          element={
            <SalesCrmRoute>
              <TasksPage />
            </SalesCrmRoute>
          }
        />
        <Route path="/import" element={<ImportLeadsPage />} />
        <Route path="/encuentra-leads" element={<EncuentraLeadsPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route
          path="/rentals/*"
          element={
            <PropertyManagerRoute>
              <RentalsPage />
            </PropertyManagerRoute>
          }
        />
        <Route path="/marketplace" element={<MarketplacePage />} />
        <Route path="/scripts" element={<ScriptsPage />} />
        <Route path="/database-chat" element={<DatabaseChatPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/rovi" element={<Navigate to="/rovi/dashboard" replace />} />
        <Route
          path="/rovi/dashboard"
          element={
            <RoviInternalRoute>
              <RoviInternalWorkspacePage view="dashboard" />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/prospects"
          element={
            <RoviInternalRoute>
              <RoviInternalWorkspacePage view="prospects" />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/service-plans"
          element={
            <RoviInternalRoute>
              <RoviInternalWorkspacePage view="plans" />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/campaigns"
          element={
            <RoviInternalRoute>
              <RoviInternalWorkspacePage view="campaigns" />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/analytics"
          element={
            <RoviInternalRoute>
              <RoviInternalWorkspacePage view="analytics" />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/team"
          element={
            <RoviInternalRoute>
              <RoviInternalWorkspacePage view="team" />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/marketplace"
          element={
            <RoviInternalRoute>
              <MarketplacePage />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/ai-control"
          element={
            <RoviInternalRoute ownerOnly>
              <RoviAIControlTowerPage />
            </RoviInternalRoute>
          }
        />
        <Route
          path="/rovi/vibe-lab"
          element={
            <RoviInternalRoute>
              <VibeLabPage />
            </RoviInternalRoute>
          }
        />
        <Route path="/copim" element={<CopimHomeRedirect />} />
        <Route
          path="/copim/dashboard"
          element={
            <CopimModuleRoute>
              <CopimNationalRoute>
                <CopimOverviewPage />
              </CopimNationalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/associations"
          element={
            <CopimModuleRoute>
              <CopimNationalRoute>
                <CopimAssociationsPage />
              </CopimNationalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/courses"
          element={
            <CopimModuleRoute>
              <CopimNationalRoute>
                <CopimCoursesWorkspacePage />
              </CopimNationalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/association/profile"
          element={
            <CopimModuleRoute>
              <CopimLocalAssociationRoute>
                <CopimAssociationProfilePage />
              </CopimLocalAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/association/campaigns"
          element={
            <CopimModuleRoute>
              <CopimLocalAssociationRoute>
                <CopimAssociationCampaignsPage />
              </CopimLocalAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/association/properties"
          element={
            <CopimModuleRoute>
              <CopimLocalAssociationRoute>
                <CopimAssociationPropertiesPage />
              </CopimLocalAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/association/courses"
          element={
            <CopimModuleRoute>
              <CopimLocalAssociationRoute>
                <CopimAssociationCoursesPage />
              </CopimLocalAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/association/community"
          element={
            <CopimModuleRoute>
              <CopimLocalAssociationRoute>
                <CopimAssociationCommunityPage />
              </CopimLocalAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/association/modules"
          element={
            <CopimModuleRoute>
              <CopimLocalAssociationRoute>
                <CopimAssociationModulesPage />
              </CopimLocalAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/members"
          element={
            <CopimModuleRoute>
              <CopimAssociationRoute>
                <CopimMembersPage />
              </CopimAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/members/import"
          element={
            <CopimModuleRoute>
              <CopimAssociationRoute>
                <CopimMemberImportPage />
              </CopimAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/memberships"
          element={
            <CopimModuleRoute>
              <CopimAssociationRoute>
                <CopimMembershipsPage />
              </CopimAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/invoices"
          element={
            <CopimModuleRoute>
              <CopimAssociationRoute>
                <CopimInvoicesPage />
              </CopimAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/events"
          element={
            <CopimModuleRoute>
              <CopimAssociationRoute>
                <CopimEventsPage />
              </CopimAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/marketplace"
          element={
            <CopimModuleRoute>
              <CopimAssociationRoute>
                <MarketplacePage />
              </CopimAssociationRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/community"
          element={
            <CopimModuleRoute>
              <CopimNationalRoute>
                <CopimDashboardDemoPage workspaceMode embeddedMode initialModule="community" />
              </CopimNationalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/intelligence"
          element={
            <CopimModuleRoute>
              <CopimNationalRoute>
                <CopimDashboardDemoPage workspaceMode embeddedMode initialModule="intelligence" />
              </CopimNationalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberHomePage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/profile"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberProfilePage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/campaigns"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberCampaignsPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/properties"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberPropertiesPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/courses"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberCoursesPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/membership"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberMembershipPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/payments"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberPaymentsPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/credential"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberCredentialPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/events"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberEventsPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/community"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberCommunityPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/modules"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberModulesPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/marketplace"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <MarketplacePage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
        <Route
          path="/copim/member/directory"
          element={
            <CopimModuleRoute>
              <CopimMemberPortalRoute>
                <CopimMemberDirectoryPage />
              </CopimMemberPortalRoute>
            </CopimModuleRoute>
          }
        />
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
