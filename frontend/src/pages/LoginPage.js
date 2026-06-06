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
    : "url('/images/rovi-login-villa.png')";
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
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground" data-testid="login-page">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,hsl(var(--primary)/0.16),transparent_28%),radial-gradient(circle_at_88%_18%,hsl(var(--accent)/0.14),transparent_26%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))] dark:bg-[radial-gradient(circle_at_12%_12%,hsl(var(--primary)/0.28),transparent_30%),radial-gradient(circle_at_86%_16%,hsl(var(--accent)/0.18),transparent_28%),linear-gradient(135deg,hsl(var(--background)),hsl(var(--muted)))]" />

      <main className="relative grid min-h-screen lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="relative hidden overflow-hidden lg:flex">
          <div className="absolute inset-0 bg-cover bg-center scale-105" style={{ backgroundImage: heroImage }} />
          {isCopimJourney ? (
            <div className={`absolute inset-0 bg-gradient-to-br ${heroGradient}`} />
          ) : null}
          {isCopimJourney ? (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(255,255,255,0.24),transparent_22%),linear-gradient(180deg,rgba(5,15,30,0.05),rgba(5,15,30,0.42))]" />
          ) : null}

          <div className="relative z-10 flex h-full w-full flex-col justify-between p-10 xl:p-14">
            <div className="flex items-center justify-between gap-5">
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/12 px-4 py-3 text-white shadow-2xl backdrop-blur-2xl">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/16">
                  {React.createElement(heroIcon, { className: 'h-6 w-6 text-white' })}
                </div>
                <div>
                  <h1 className="font-display text-xl font-semibold leading-tight">{heroTitle}</h1>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/72">{heroSubtitle}</p>
                </div>
              </div>
              <div className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/82 backdrop-blur-xl">
                Luxury CRM
              </div>
            </div>

            <div className="max-w-xl space-y-6 rounded-[28px] border border-white/18 bg-white/12 p-7 text-white shadow-2xl backdrop-blur-2xl">
              <blockquote className="font-display text-2xl font-medium leading-snug xl:text-3xl">
                {heroQuote}
              </blockquote>
              <div className="flex items-center justify-between gap-4 border-t border-white/16 pt-5">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 w-10 rounded-full border-2 border-white/35 bg-white/20 shadow-lg backdrop-blur" />
                    ))}
                  </div>
                  <p className="max-w-[190px] text-sm text-white/78">{heroStatsLabel}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-semibold">98%</p>
                  <p className="text-xs uppercase tracking-[0.16em] text-white/65">adopcion</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="relative flex min-h-screen items-center justify-center px-4 py-7 sm:px-8 lg:px-12">
          <div className="absolute right-4 top-4 z-20 flex items-center gap-2 sm:right-6 sm:top-6">
            <Button
              variant="secondary"
              size="icon"
              onClick={toggleTheme}
              className="h-10 w-10 rounded-full"
              aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
              data-testid="theme-toggle-login"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          <div className="w-full max-w-[500px]">
            <div className="mb-6 flex items-center justify-center gap-3 lg:hidden">
              <div className="rovi-gradient-primary flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg">
                {isCopimJourney ? <Globe2 className="h-6 w-6 text-primary-foreground" /> : <Leaf className="h-6 w-6 text-primary-foreground" />}
              </div>
              <div>
                <h1 className="font-display text-2xl font-semibold leading-tight">{heroTitle}</h1>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">{heroSubtitle}</p>
              </div>
            </div>

            <Card className="overflow-hidden rounded-[28px] border-white/70 bg-card/76 shadow-[0_28px_80px_hsl(var(--primary)/0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-card/72">
              <CardHeader className="space-y-3 px-6 pb-2 pt-7 text-center sm:px-8">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10">
                  {React.createElement(heroIcon, { className: 'h-7 w-7' })}
                </div>
                <div className="space-y-1">
                  <CardTitle className="font-display text-2xl font-semibold sm:text-[1.7rem]">{pageTitle}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed">
                    {pageDescription}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="px-5 pb-2 sm:px-8">
                <Tabs defaultValue="login" className="w-full">
                  <TabsList className="rovi-input mb-6 grid h-12 w-full grid-cols-2 rounded-2xl border-white/70 bg-background/60 p-1 dark:border-white/10 dark:bg-background/40">
                    <TabsTrigger className="rounded-xl text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="login" data-testid="login-tab">
                      Iniciar sesion
                    </TabsTrigger>
                    <TabsTrigger className="rounded-xl text-sm data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-sm" value="register" data-testid="register-tab">
                      Registrarse
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="login">
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="rovi-label" htmlFor="login-email">Email</Label>
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
                        <Label className="rovi-label" htmlFor="login-password">Contrasena</Label>
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                            aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-sm">
                        <label className="flex items-center gap-2 text-muted-foreground">
                          <input type="checkbox" className="h-4 w-4 rounded border-border accent-primary" />
                          Recordarme
                        </label>
                        <button type="button" className="font-medium text-primary transition-colors hover:text-primary/80">
                          Olvide mi contrasena
                        </button>
                      </div>
                      <Button type="submit" className="h-11 w-full rounded-full text-sm" disabled={loading} data-testid="login-submit">
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Iniciar sesion
                      </Button>
                    </form>
                  </TabsContent>

                  <TabsContent value="register">
                    <form onSubmit={handleRegister} className="space-y-4">
                      <div className="space-y-2">
                        <Label className="rovi-label">Tipo de cuenta</Label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setRegisterForm({ ...registerForm, account_type: 'individual' })}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              registerForm.account_type === 'individual'
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-border/70 bg-card/40 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                            data-testid="account-type-individual"
                          >
                            <User className={`mb-2 h-5 w-5 ${registerForm.account_type === 'individual' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="text-sm font-semibold">Broker individual</p>
                            <p className="mt-1 text-xs leading-snug text-muted-foreground">Gestiona tus propios leads</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegisterForm({ ...registerForm, account_type: 'agency' })}
                            className={`rounded-2xl border p-4 text-left transition-all ${
                              registerForm.account_type === 'agency'
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-border/70 bg-card/40 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                            data-testid="account-type-agency"
                          >
                            <Building2 className={`mb-2 h-5 w-5 ${registerForm.account_type === 'agency' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="text-sm font-semibold">Inmobiliaria</p>
                            <p className="mt-1 text-xs leading-snug text-muted-foreground">Gestiona tu equipo de ventas</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegisterForm({ ...registerForm, account_type: 'copim' })}
                            className={`col-span-2 rounded-2xl border p-4 text-left transition-all ${
                              registerForm.account_type === 'copim'
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-border/70 bg-card/40 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                            data-testid="account-type-copim"
                          >
                            <Globe2 className={`mb-2 h-5 w-5 ${registerForm.account_type === 'copim' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="text-sm font-semibold">COPIM institucional</p>
                            <p className="mt-1 text-xs leading-snug text-muted-foreground">Administra asociaciones, socios, eventos y membresias</p>
                          </button>
                          <button
                            type="button"
                            onClick={() => setRegisterForm({ ...registerForm, account_type: 'property_management' })}
                            className={`col-span-2 rounded-2xl border p-4 text-left transition-all ${
                              registerForm.account_type === 'property_management'
                                ? 'border-primary bg-primary/10 shadow-lg shadow-primary/10'
                                : 'border-border/70 bg-card/40 hover:border-primary/40 hover:bg-primary/5'
                            }`}
                            data-testid="account-type-property-management"
                          >
                            <KeyRound className={`mb-2 h-5 w-5 ${registerForm.account_type === 'property_management' ? 'text-primary' : 'text-muted-foreground'}`} />
                            <p className="text-sm font-semibold">Rentas / Airbnb</p>
                            <p className="mt-1 text-xs leading-snug text-muted-foreground">Gestiona propiedades, reservas, huespedes, tareas y rentabilidad</p>
                          </button>
                        </div>
                      </div>

                    <div className="space-y-2">
                      <Label className="rovi-label" htmlFor="register-name">Nombre completo</Label>
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
                      <Label className="rovi-label" htmlFor="register-email">Email</Label>
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
                      <Label className="rovi-label" htmlFor="register-password">Contrasena</Label>
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
                          aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <Button type="submit" className="h-11 w-full rounded-full text-sm" disabled={loading} data-testid="register-submit">
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      Crear cuenta
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="px-6 pb-7 pt-4 text-center text-sm text-muted-foreground sm:px-8">
              <p className="w-full">
                Al continuar, aceptas nuestros términos y condiciones
              </p>
            </CardFooter>
          </Card>

          <div className="rovi-glass mt-5 rounded-2xl p-4 text-center">
            <p className="text-xs text-muted-foreground">
              Demo: carlos.mendoza@leadvibes.mx / demo123
            </p>
          </div>
        </div>
        </section>
      </main>
    </div>
  );
};
