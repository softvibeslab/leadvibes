import React, { useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './cmicAppKit';
import './cmicAppTheme.css';

// Carga la fuente Material Symbols una sola vez (Inter ya la usa el resto de la app).
const ensureFonts = () => {
  const links = [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap',
  ];
  links.forEach((href) => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const el = document.createElement('link');
      el.rel = 'stylesheet';
      el.href = href;
      document.head.appendChild(el);
    }
  });
};

// Mapa de títulos del app bar por ruta.
const TITLES = {
  '': 'CMIC Digital',
  membership: 'Mi Membresía',
  payments: 'Pagos y Facturas',
  courses: 'Cursos ICIC',
  credential: 'Credencial Digital',
  events: 'Eventos y Comunicados',
  directory: 'Directorio de Socios',
  opportunities: 'Oportunidades de Obra',
  indicators: 'Indicadores del Sector',
  profile: 'Mi Perfil',
  community: 'Comunidad',
  modules: 'Servicios y Módulos',
  more: 'Más',
};

const NAV = [
  { to: '/cmic/app', end: true, icon: 'home', label: 'Inicio' },
  { to: '/cmic/app/courses', icon: 'school', label: 'Cursos' },
  { to: '/cmic/app/credential', icon: 'qr_code_2', label: 'Credencial' },
  { to: '/cmic/app/membership', icon: 'workspace_premium', label: 'Membresía' },
  { to: '/cmic/app/more', icon: 'more_horiz', label: 'Más' },
];

export const CmicAppShell = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    ensureFonts();
  }, []);

  const segment = location.pathname.replace(/^\/cmic\/app\/?/, '').split('/')[0] || '';
  const title = TITLES[segment] || 'CMIC Digital';
  const isHome = segment === '';

  return (
    <div className="cmic-app-root">
      <div className="cmic-app-shell">
        <header className="cmic-appbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {!isHome ? (
              <button className="cmic-iconbtn cmic-iconbtn--primary" onClick={() => navigate(-1)} aria-label="Regresar">
                <Icon name="arrow_back" />
              </button>
            ) : (
              <span className="cmic-iconbtn cmic-iconbtn--primary" aria-hidden>
                <Icon name="apartment" fill />
              </span>
            )}
            <h1 className="cmic-appbar__title">{title}</h1>
          </div>
          <button className="cmic-iconbtn" onClick={() => navigate('/cmic/app/events')} aria-label="Notificaciones">
            <Icon name="notifications" />
          </button>
        </header>

        <main className="cmic-main">
          <Outlet />
        </main>

        <nav className="cmic-bottomnav">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `cmic-navitem ${isActive ? 'cmic-navitem--active' : ''}`.trim()}
            >
              {({ isActive }) => (
                <>
                  <Icon name={item.icon} fill={isActive} className="text-2xl" style={{ fontSize: 26 }} />
                  <span>{item.label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
};
