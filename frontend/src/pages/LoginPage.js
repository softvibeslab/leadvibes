import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Leaf, Eye, EyeOff, Sun, Moon, Loader2, User, Building2, Globe2, KeyRound } from 'lucide-react';
import { resolveAuthenticatedHome } from '../lib/copimAccess';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, register, setAppMode } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    password: '',
    inviteCode: '',
    account_type: 'individual' 
  });
  const nextPath = new URLSearchParams(window.location.search).get('next');
  const safeNextPath = nextPath && nextPath.startsWith('/') ? nextPath : null;
  const isCopimJourney = safeNextPath?.startsWith('/copim') || registerForm.account_type === 'copim';
  const heroIcon = isCopimJourney ? Globe2 : Leaf;
  const heroTitle = isCopimJourney ? 'Rovi COPIM' : 'Rovi';
  const heroSubtitle = isCopimJourney ? 'Operacion institucional' : 'CRM Inmobiliario';
  const heroImage = isCopimJourney
    ? "url('https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1400&q=80')"
    : "url('https://images.unsplash.com/photo-1692726293166-7d1f95a4319d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHx0dWx1bSUyMGx1eHVyeSUyMGp1bmdsZSUyMHJlYWwlMjBlc3RhdGUlMjB2aWxsYXxlbnwwfHx8fDE3NzA5NDM1NTN8MA&ixlib=rb-4.1.0&q=85')";
  const heroGradient = isCopimJourney
    ? 'from-[#0f172a]/95 via-[#123b68]/88 to-[#0e7490]/82'
    : 'from-[#0D9488]/90 to-[#4D7C0F]/80';
  const heroQuote = isCopimJourney
    ? '“Centraliza asociaciones, socios, membresias, pagos y eventos en una sola operacion simple y adoptable.”'
    : '“El CRM que transforma tu gestión de ventas inmobiliarias en una experiencia de lujo.”';
  const heroStatsLabel = isCopimJourney ? '+4 asociaciones listas para piloto' : '+500 brokers activos en Tulum';
  const pageTitle = isCopimJourney ? 'Acceso institucional' : 'Bienvenido';
  const pageDescription = isCopimJourney
    ? 'Ingresa o crea tu cuenta para operar asociaciones, socios, membresías y eventos.'
    : 'Inicia sesión o crea tu cuenta para continuar';

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(loginForm.email, loginForm.password);
      toast.success(`¡Bienvenido, ${user.name}!`);
      const authenticatedHome = resolveAuthenticatedHome(user, 'copim');
      const defaultMode = authenticatedHome.startsWith('/copim') ? 'copim' : 'rovi';
      if (!user.onboarding_completed) {
        navigate('/onboarding');
      } else if (safeNextPath) {
        setAppMode(safeNextPath.startsWith('/copim') ? 'copim' : defaultMode);
        navigate(safeNextPath);
      } else {
        setAppMode(defaultMode);
        navigate(authenticatedHome);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (registerForm.inviteCode.trim() !== '240389') {
      toast.error('Código de registro inválido');
      return;
    }
    setLoading(true);
    try {
      const registrationRole = registerForm.account_type === 'copim'
        ? 'copim_admin'
        : registerForm.account_type === 'property_management'
          ? 'property_manager'
          : 'broker';
      await register(
        registerForm.name, 
        registerForm.email, 
        registerForm.password, 
        registrationRole,
        registerForm.account_type
      );
      toast.success('¡Cuenta creada! Configura tus metas');
      if (safeNextPath) {
        navigate(safeNextPath);
      } else {
        navigate('/onboarding');
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Error al registrarse');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" data-testid="login-page">
      {/* Left side - Image */}
      <div 
        className="hidden lg:flex lg:w-1/2 relative bg-cover bg-center"
        style={{
          backgroundImage: heroImage
        }}
      >
        <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`} />
        <div className="relative z-10 p-12 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
              {React.createElement(heroIcon, { className: 'w-7 h-7 text-white' })}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white font-['Outfit']">{heroTitle}</h1>
              <p className="text-sm text-white/80">{heroSubtitle}</p>
            </div>
          </div>
          
          <div className="space-y-6">
            <blockquote className="text-2xl font-light text-white leading-relaxed">
              {heroQuote}
            </blockquote>
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                {[1,2,3].map(i => (
                  <div key={i} className={`w-10 h-10 rounded-full border-2 border-white/30 ${isCopimJourney ? 'bg-cyan-500/80' : 'bg-[#0D9488]'}`} />
                ))}
              </div>
              <p className="text-white/80 text-sm">{heroStatsLabel}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* Theme toggle */}
          <div className="flex justify-end mb-6">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="theme-toggle-login">
              {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>
          </div>

          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              {isCopimJourney ? <Globe2 className="w-7 h-7 text-primary-foreground" /> : <Leaf className="w-7 h-7 text-primary-foreground" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold font-['Outfit']">{heroTitle}</h1>
              <p className="text-sm text-muted-foreground">{isCopimJourney ? 'Operacion institucional' : 'CRM'}</p>
            </div>
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 text-center">
              <CardTitle className="text-2xl font-['Outfit']">{pageTitle}</CardTitle>
              <CardDescription>
                {pageDescription}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="login-tab">Iniciar Sesión</TabsTrigger>
                  <TabsTrigger value="register" data-testid="register-tab">Registrarse</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        data-testid="login-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="••••••••"
                          value={loginForm.password}
                          onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                          required
                          data-testid="login-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full rounded-full" disabled={loading} data-testid="login-submit">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Iniciar Sesión
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-sm font-semibold text-foreground">Registro privado</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Ingresa el código de acceso para crear una cuenta nueva en ROVI.
                      </p>
                    </div>
                    {/* Account Type Selector */}
                    <div className="space-y-2">
                      <Label>Tipo de cuenta</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, account_type: 'individual' })}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            registerForm.account_type === 'individual'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          data-testid="account-type-individual"
                        >
                          <User className={`w-6 h-6 mb-2 ${registerForm.account_type === 'individual' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className="font-medium text-sm">Broker Individual</p>
                          <p className="text-xs text-muted-foreground">Gestiona tus propios leads</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, account_type: 'agency' })}
                          className={`p-4 rounded-xl border-2 transition-all text-left ${
                            registerForm.account_type === 'agency'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          data-testid="account-type-agency"
                        >
                          <Building2 className={`w-6 h-6 mb-2 ${registerForm.account_type === 'agency' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className="font-medium text-sm">Inmobiliaria</p>
                          <p className="text-xs text-muted-foreground">Gestiona tu equipo de ventas</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, account_type: 'copim' })}
                          className={`p-4 rounded-xl border-2 transition-all text-left col-span-2 ${
                            registerForm.account_type === 'copim'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          data-testid="account-type-copim"
                        >
                          <Globe2 className={`w-6 h-6 mb-2 ${registerForm.account_type === 'copim' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className="font-medium text-sm">COPIM Institucional</p>
                          <p className="text-xs text-muted-foreground">Administra asociaciones, socios, eventos y membresias</p>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegisterForm({ ...registerForm, account_type: 'property_management' })}
                          className={`p-4 rounded-xl border-2 transition-all text-left col-span-2 ${
                            registerForm.account_type === 'property_management'
                              ? 'border-primary bg-primary/10'
                              : 'border-border hover:border-primary/50'
                          }`}
                          data-testid="account-type-property-management"
                        >
                          <KeyRound className={`w-6 h-6 mb-2 ${registerForm.account_type === 'property_management' ? 'text-primary' : 'text-muted-foreground'}`} />
                          <p className="font-medium text-sm">Rentas / Airbnb</p>
                          <p className="text-xs text-muted-foreground">Gestiona propiedades, reservas, huéspedes, tareas y rentabilidad</p>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nombre completo</Label>
                      <Input
                        id="register-name"
                        name="name"
                        type="text"
                        placeholder="Juan Pérez"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                        data-testid="register-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        name="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                        data-testid="register-email"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Contraseña</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Mínimo 6 caracteres"
                          value={registerForm.password}
                          onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                          required
                          minLength={6}
                          data-testid="register-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-invite-code">Código de registro</Label>
                      <Input
                        id="register-invite-code"
                        name="inviteCode"
                        type="password"
                        inputMode="numeric"
                        placeholder="Código de acceso"
                        value={registerForm.inviteCode}
                        onChange={(e) => setRegisterForm({ ...registerForm, inviteCode: e.target.value })}
                        required
                        data-testid="register-invite-code"
                      />
                    </div>
                    <Button type="submit" className="w-full rounded-full" disabled={loading} data-testid="register-submit">
                      {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Crear Cuenta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="text-center text-sm text-muted-foreground">
              <p className="w-full">
                Al continuar, aceptas nuestros términos y condiciones
              </p>
            </CardFooter>
          </Card>

          {/* Demo credentials hint */}
          <div className="mt-6 p-4 bg-muted/50 rounded-xl text-center">
            <p className="text-xs text-muted-foreground">
              Demo: carlos.mendoza@leadvibes.mx / demo123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
