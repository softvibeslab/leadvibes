import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
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
  Upload
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Separator } from '../components/ui/separator';

// Navigation items for individual users
const individualNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Pipeline' },
  { to: '/import', icon: Upload, label: 'Importar Leads' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/campaigns', icon: Radio, label: 'Campanas' },
  { to: '/scripts', icon: FileText, label: 'Scripts' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

// Navigation items for agency users
const agencyNavItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Pipeline' },
  { to: '/import', icon: Upload, label: 'Importar Leads' },
  { to: '/brokers', icon: UserCircle, label: 'Brokers' },
  { to: '/calendar', icon: CalendarDays, label: 'Calendario' },
  { to: '/campaigns', icon: Radio, label: 'Campanas' },
  { to: '/gamification', icon: Trophy, label: 'Gamificacion' },
  { to: '/scripts', icon: FileText, label: 'Scripts' },
  { to: '/settings', icon: Settings, label: 'Configuracion' },
];

export const Sidebar = ({ onClose }) => {
  const { user, logout, isIndividual } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Choose nav items based on account type
  const navItems = isIndividual ? individualNavItems : agencyNavItems;

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
            <Leaf className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg font-['Outfit'] text-foreground">Rovi</h1>
            <p className="text-xs text-muted-foreground">
              {isIndividual ? 'Broker' : 'Inmobiliaria'}
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
      
      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
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
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-xl bg-muted/50">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground truncate capitalize">{user?.role || 'broker'}</p>
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
            data-testid="logout-btn"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
