import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard,
  Users,
  UserCircle,
  CalendarDays,
  BarChart3,
  FileText,
  Plug,
  Settings,
  LogOut,
  Sun,
  Moon,
  Leaf,
  Trophy
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { ScrollArea } from '../components/ui/scroll-area';
import { Separator } from '../components/ui/separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../components/ui/tooltip';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/leads', icon: Users, label: 'Leads' },
  { to: '/brokers', icon: UserCircle, label: 'Brokers' },
  { to: '/gamification', icon: Trophy, label: 'Gamificación' },
  { to: '/scripts', icon: FileText, label: 'Scripts' },
  { to: '/settings', icon: Settings, label: 'Configuración' },
];

export const Sidebar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
          <Leaf className="w-6 h-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-bold text-lg font-['Outfit'] text-foreground">SelvaVibes</h1>
          <p className="text-xs text-muted-foreground">CRM</p>
        </div>
      </div>
      
      <Separator />
      
      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          <TooltipProvider>
            {navItems.map((item) => (
              <Tooltip key={item.to}>
                <TooltipTrigger asChild>
                  <NavLink
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
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </nav>
      </ScrollArea>
      
      {/* Footer */}
      <div className="p-4 border-t border-border">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-xl bg-muted/50">
          <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center">
            <UserCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate text-foreground">{user?.name || 'Usuario'}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.role || 'broker'}</p>
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
