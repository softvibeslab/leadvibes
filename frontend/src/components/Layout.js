import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { AIChat } from './AIChat';
import { RealtimeNotifications } from './RealtimeNotifications';
import { useAuth } from '../context/AuthContext';
import { getEffectiveRole, isCopimAccount, isCopimRole } from '../lib/copimAccess';
import { isMenuVibesAccount } from '../lib/menuvibesAccess';
import { Menu } from 'lucide-react';
import { Button } from './ui/button';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { isCopimMode, user } = useAuth();
  const effectiveRole = getEffectiveRole(user);
  const showFloatingAgent = !isMenuVibesAccount(user) && (!isCopimMode || isCopimRole(effectiveRole) || isCopimAccount(user));

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-transparent">
      {!isMenuVibesAccount(user) ? <RealtimeNotifications /> : null}

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - Hidden on mobile, shown on desktop */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 lg:z-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="rovi-glass sticky top-0 z-30 flex items-center gap-3 rounded-none border-x-0 border-t-0 px-4 py-3 lg:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(true)}
            className="flex-shrink-0"
            data-testid="mobile-menu-btn"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <span className="font-display truncate text-lg font-bold">{isMenuVibesAccount(user) ? 'MenuVibes CRM' : 'Rovi'}</span>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </main>
      
      {/* AI Chat Widget */}
      {showFloatingAgent ? <AIChat /> : null}
    </div>
  );
};
