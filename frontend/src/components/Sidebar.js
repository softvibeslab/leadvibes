import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  getAccountTypeLabel,
  getEffectiveRole,
  getRoleLabel,
  getVisibleWorkspaces,
  getWorkspaceTypeLabel,
  isCopimLocalAssociationUser,
  isCopimMemberUser,
  isPropertyManagerUser,
  isRoviControlTowerOwner,
  isRoviInternalUser,
  resolveAuthenticatedHome,
} from '../lib/copimAccess';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarDays,
  FileText,
  Settings,
  LogOut,
  Sun,
  Moon,
  Leaf,
  Trophy,
  X,
  Radio,
  Upload,
  BarChart3,
  Zap,
  Database,
  Package,
  Building2,
  WalletCards,
  Bot,
  MessageSquareShare,
  MessageCircle,
  CreditCard,
  IdCard,
  ListChecks,
  FolderKanban,
  BriefcaseBusiness,
  Store,
  FlaskConical,
  SlidersHorizontal,
  Images,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

// Navigation items for individual users
const individualNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: FolderKanban, label: 'Pipeline de Leads' },
  { to: '/import', icon: Upload, label: 'Importador' },
  { to: '/products', icon: Package, label: 'Propiedades' },
  { to: '/media', icon: Images, label: 'Media Hub' },
  { to: '/tasks', icon: ListChecks, label: 'Tareas' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/ai-agents', icon: Bot, label: 'Agentes IA' },
  { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { to: '/automations', icon: Zap, label: 'Automatizaciones' },
  { to: '/analytics', icon: BarChart3, label: 'Analiticas' },
  { to: '/scripts', icon: FileText, label: 'Scripts' },
  { to: '/database-chat', icon: Database, label: 'Chat BD' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

// Navigation items for agency users
const agencyNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: FolderKanban, label: 'Pipeline de Leads' },
  { to: '/import', icon: Upload, label: 'Importador' },
  { to: '/products', icon: Package, label: 'Propiedades' },
  { to: '/media', icon: Images, label: 'Media Hub' },
  { to: '/brokers/manage', icon: UserCircle, label: 'Brokers' },
  { to: '/tasks', icon: ListChecks, label: 'Tareas' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/ai-agents', icon: Bot, label: 'Agentes IA' },
  { to: '/agent-studio', icon: SlidersHorizontal, label: 'Agent Studio', adminOnly: true },
  { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp' },
  { to: '/automations', icon: Zap, label: 'Automatizaciones' },
  { to: '/scripts', icon: FileText, label: 'Scripts' },
  { to: '/analytics', icon: BarChart3, label: 'Analiticas' },
  { to: '/database-chat', icon: Database, label: 'Chat BD' },
  { to: '/gamification', icon: Trophy, label: 'Gamificacion' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

const roviInternalNavItems = [
  { to: '/rovi/dashboard', icon: LayoutDashboard, label: 'Revenue HQ' },
  { to: '/rovi/prospects', icon: Users, label: 'Prospectos SaaS' },
  { to: '/rovi/service-plans', icon: Package, label: 'Planes ROVI' },
  { to: '/rovi/campaigns', icon: Radio, label: 'Campanas' },
  { to: '/rovi/analytics', icon: BarChart3, label: 'Revenue Analytics' },
  { to: '/rovi/team', icon: UserCircle, label: 'Equipo Interno' },
  { to: '/rovi/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/rovi/ai-control', icon: Bot, label: 'AI Control' },
  { to: '/rovi/vibe-lab', icon: FlaskConical, label: 'VibeLab' },
  { to: '/database-chat', icon: Database, label: 'Estratega IA' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

const propertyManagerNavItems = [
  { to: '/rentals', icon: LayoutDashboard, label: 'Rentas HQ' },
  { to: '/rentals/properties', icon: Package, label: 'Propiedades' },
  { to: '/rentals/bookings', icon: CalendarDays, label: 'Reservas' },
  { to: '/rentals/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/rentals/tasks', icon: FolderKanban, label: 'Tareas' },
  { to: '/rentals/staff', icon: BriefcaseBusiness, label: 'Staff' },
  { to: '/rentals/financials', icon: WalletCards, label: 'Finanzas' },
  { to: '/rentals/integrations', icon: Zap, label: 'Integraciones' },
  { to: '/rentals/import', icon: Upload, label: 'Importador' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/campaigns', icon: Radio, label: 'Campanas' },
  { to: '/analytics', icon: BarChart3, label: 'Analiticas' },
  { to: '/database-chat', icon: Database, label: 'Estratega IA' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

const copimNationalNavItems = [
  { to: '/copim/dashboard', icon: LayoutDashboard, label: 'Resumen' },
  { to: '/copim/associations', icon: Building2, label: 'Asociaciones' },
  { to: '/copim/members', icon: Users, label: 'Socios' },
  { to: '/copim/memberships', icon: WalletCards, label: 'Membresias' },
  { to: '/copim/invoices', icon: FileText, label: 'Facturacion' },
  { to: '/copim/events', icon: CalendarDays, label: 'Eventos' },
  { to: '/copim/courses', icon: Trophy, label: 'Cursos' },
  { to: '/copim/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/copim/community', icon: MessageSquareShare, label: 'Comunidad' },
  { to: '/copim/intelligence', icon: Bot, label: 'Inteligencia' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

const copimLocalAssociationNavItems = [
  { to: '/copim/association/profile', icon: Building2, label: 'Mi asociacion' },
  { to: '/copim/members', icon: Users, label: 'Socios' },
  { to: '/copim/memberships', icon: WalletCards, label: 'Membresias' },
  { to: '/copim/invoices', icon: FileText, label: 'Cobranza' },
  { to: '/copim/events', icon: CalendarDays, label: 'Eventos' },
  { to: '/copim/association/campaigns', icon: Radio, label: 'Campanas' },
  { to: '/copim/association/properties', icon: Package, label: 'Inventario' },
  { to: '/copim/association/courses', icon: Trophy, label: 'Cursos' },
  { to: '/copim/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/copim/association/community', icon: MessageSquareShare, label: 'Comunidad' },
  { to: '/copim/association/modules', icon: Bot, label: 'Revenue share' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

const copimMemberNavItems = [
  { to: '/copim/member', icon: LayoutDashboard, label: 'Mi portal' },
  { to: '/copim/member/profile', icon: UserCircle, label: 'Mi perfil' },
  { to: '/copim/member/campaigns', icon: Radio, label: 'Mis campanas' },
  { to: '/copim/member/properties', icon: Package, label: 'Mi inventario' },
  { to: '/copim/member/courses', icon: Trophy, label: 'Mis cursos' },
  { to: '/copim/member/marketplace', icon: Store, label: 'Marketplace' },
  { to: '/copim/member/membership', icon: WalletCards, label: 'Mi membresia' },
  { to: '/copim/member/payments', icon: CreditCard, label: 'Pagos y facturas' },
  { to: '/copim/member/credential', icon: IdCard, label: 'Mi credencial' },
  { to: '/copim/member/events', icon: CalendarDays, label: 'Eventos' },
  { to: '/copim/member/community', icon: MessageSquareShare, label: 'Comunidad' },
  { to: '/copim/member/modules', icon: Bot, label: 'Mis modulos' },
  { to: '/copim/member/directory', icon: FolderKanban, label: 'Directorio' },
];

export const Sidebar = ({ onClose }) => {
  const { user, logout, isIndividual, switchWorkspace, appMode, setAppMode, hasCopimAccess } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [switchingWorkspace, setSwitchingWorkspace] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const workspaces = getVisibleWorkspaces(user).filter((workspace) => workspace?.status === 'active');
  const activeWorkspace = user?.active_workspace;
  const activeRole = activeWorkspace?.role || user?.role;
  const canAccessAgentStudio = activeRole === 'admin';
  const isMemberPortal = isCopimMemberUser(user);
  const isLocalAssociationWorkspace = isCopimLocalAssociationUser(user);
  const isRoviInternalWorkspace = isRoviInternalUser(user);
  const isControlTowerOwner = isRoviControlTowerOwner(user);
  const isPropertyManagerWorkspace = isPropertyManagerUser(user);

  const handleWorkspaceChange = async (tenantId) => {
    if (!tenantId || tenantId === activeWorkspace?.tenant_id) return;
    setSwitchingWorkspace(true);
    try {
      await switchWorkspace(tenantId);
      const targetWorkspace = workspaces.find((workspace) => workspace?.tenant_id === tenantId);
      const targetRole = targetWorkspace?.role || getEffectiveRole(user);
      const nextPath = targetWorkspace?.tenant_type === 'rovi_internal' || String(targetRole).startsWith('rovi_')
        ? '/rovi/dashboard'
        : targetWorkspace?.tenant_type === 'property_management' || targetRole === 'property_manager'
        ? '/rentals'
        : targetRole === 'copim_member'
        ? '/copim/member'
        : targetRole === 'copim_operator'
          ? '/copim/association/profile'
          : targetWorkspace?.tenant_type === 'copim' || String(targetRole).startsWith('copim_')
            ? '/copim/dashboard'
            : '/dashboard';
      navigate(nextPath);
    } finally {
      setSwitchingWorkspace(false);
    }
  };

  const handleAppModeChange = (mode) => {
    const requestedMode = mode === 'copim' ? 'copim' : 'rovi';
    setAppMode(requestedMode);
    const nextMode = requestedMode === 'copim' && hasCopimAccess ? 'copim' : 'rovi';
    navigate(nextMode === 'copim' ? resolveAuthenticatedHome(user, nextMode) : '/dashboard');
  };

  // Choose nav items based on account type
  const currentModeValue = location.pathname.startsWith('/copim') ? 'copim' : appMode;
  const baseNavItems = isRoviInternalWorkspace || location.pathname.startsWith('/rovi')
    ? roviInternalNavItems.filter((item) => item.to !== '/rovi/ai-control' || isControlTowerOwner)
    : isPropertyManagerWorkspace || location.pathname.startsWith('/rentals')
    ? propertyManagerNavItems
    : currentModeValue === 'copim'
    ? (isMemberPortal ? copimMemberNavItems : (isLocalAssociationWorkspace ? copimLocalAssociationNavItems : copimNationalNavItems))
    : isIndividual
      ? individualNavItems
      : agencyNavItems;
  const navItems = baseNavItems.filter((item) => !item.adminOnly || canAccessAgentStudio);
  const accountLabel = getAccountTypeLabel(user?.account_type, currentModeValue);
  const activeRoleLabel = getRoleLabel(getEffectiveRole(user));

  return (
    <div className="rovi-glass flex flex-col h-full w-64 rounded-none border-y-0 border-l-0 border-r border-border/70">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="rovi-gradient-primary flex h-10 w-10 items-center justify-center rounded-xl shadow-glow-primary">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-foreground">Rovi</h1>
            <p className="text-xs text-muted-foreground">
              {accountLabel}
            </p>
          </div>
        </div>
        {/* Close button - only on mobile */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
            data-testid="close-sidebar-btn"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>
      
      <Separator />

      {hasCopimAccess && !isMemberPortal && (
        <div className="px-4 pt-4">
        <div className="rovi-card rounded-2xl p-3">
          <p className="rovi-label mb-2">
            Perfil Activo
          </p>
          <Select value={currentModeValue} onValueChange={handleAppModeChange}>
            <SelectTrigger className="h-auto min-h-11 rounded-xl border-border/70 bg-background/80 px-3 py-2 text-left">
              <SelectValue placeholder="Selecciona un perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rovi">ROVI CRM</SelectItem>
              <SelectItem value="copim">COPIM Institucional</SelectItem>
            </SelectContent>
          </Select>
          <p className="mt-2 text-xs text-muted-foreground">
            {currentModeValue === 'copim'
              ? (isLocalAssociationWorkspace
                ? 'Workspace operativo del capitulo para padrón, cobranza, agenda y activación.'
                : 'Vista institucional nacional para asociaciones, socios y membresias.')
              : 'Vista comercial para brokers e inmobiliarias.'}
          </p>
        </div>
        </div>
      )}

      {isMemberPortal && (
        <div className="px-4 pt-4">
          <div className="rovi-card rounded-2xl p-3">
            <p className="rovi-label mb-2">
              Portal Activo
            </p>
            <p className="text-sm font-medium text-foreground">Asociado COPIM</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Vista ligera de autoservicio para membresía, pagos, eventos y credencial.
            </p>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/rentals'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border border-primary/30 bg-primary/10 text-foreground shadow-glow-primary'
                    : 'text-muted-foreground hover:bg-accent/10 hover:text-foreground'
                }`
              }
              data-testid={`nav-${item.label.toLowerCase()}`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        {workspaces.length > 1 && !isMemberPortal && (
          <div className="rovi-card mb-3 rounded-xl p-3">
            <p className="rovi-label mb-1">
              Workspace Activo
            </p>
            <Select
              value={activeWorkspace?.tenant_id}
              onValueChange={handleWorkspaceChange}
              disabled={switchingWorkspace}
            >
              <SelectTrigger className="h-auto min-h-11 rounded-xl border-border/70 bg-background/80 px-3 py-2 text-left">
                <SelectValue placeholder="Selecciona un workspace" />
              </SelectTrigger>
              <SelectContent>
                {workspaces.map((workspace) => (
                  <SelectItem key={workspace.tenant_id} value={workspace.tenant_id}>
                    {workspace.name} · {workspace.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-xs text-muted-foreground">
              {getWorkspaceTypeLabel(activeWorkspace?.tenant_type)} · Rol {getRoleLabel(activeWorkspace?.role || 'broker')}
            </p>
          </div>
        )}

        {/* User info */}
        <div className="rovi-card mb-3 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-primary/15">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground truncate">{activeRoleLabel}</p>
          </div>
        </div>
        
        {/* Theme toggle */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="flex-1 h-10"
            data-testid="theme-toggle"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="flex-1 h-10 text-destructive hover:text-destructive hover:bg-destructive/10"
            aria-label="Cerrar sesión"
            title="Cerrar sesión"
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
