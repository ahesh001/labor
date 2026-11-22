import { useEffect, useRef, useState } from 'react';
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { appNavLinks } from '../constants/navigation';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export function ProtectedRoute({ children, allowGuest = false, requiredPermission }) {
  const { isAuthenticated, loading, role, hasPermission } = useAuth();
  const location = useLocation();
  if (role === 'User' && !['/dashboard', '/profile', '/settings'].includes(location.pathname)) return <Navigate to="/dashboard" replace />;

  if (loading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (role === 'Guest' && !allowGuest) {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }
  if (requiredPermission && !hasPermission(requiredPermission)) return <Navigate to="/dashboard" replace />;

  return children;
}

export function PageShell({ title, subtitle, actions, children }) {
  const { role, user, logout, isDemo, authNotice, hasPermission } = useAuth();
  const { storageError } = useWorkspace();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showNav, setShowNav] = useState(false);
  const menuTriggerRef = useRef(null);
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const isGuest = role === 'Guest';
  const navLinks = appNavLinks.filter((link) => (role === 'User' ? ['/dashboard', '/profile', '/settings'].includes(link.to) : link.guestVisible !== false || !isGuest) && (!link.permission || hasPermission(link.permission)));
  const session = isDemo ? 'Local demonstration workspace' : user?.isAnonymous ? 'Guest session' : 'Signed-in account';
  const access = role === 'Guest' ? 'View the dashboard and profile.' : role === 'User' ? 'View deliveries assigned to your account.' : role === 'Super Admin' || role === 'Admin' ? 'Full system access (*:*).' : role === 'OperationsAdmin' ? 'Operational access for assigned regions; financial and security administration are restricted.' : role === 'RegionalAdmin' ? 'Operations access limited to assigned regions; financial and security administration are restricted.' : 'Manage assigned deliveries, labor, and customer tracking.';

  useEffect(() => {
    if (!showNav) return undefined;
    sidebarRef.current?.querySelector('.sidebar-close')?.focus();
    const closeOnEscape = event => { if (event.key === 'Escape') closeNavigation(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showNav]);
  function closeNavigation() {
    setShowNav(false);
    window.requestAnimationFrame(() => menuTriggerRef.current?.focus());
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      {showNav && <button className="sidebar-backdrop" type="button" aria-label="Close navigation" onClick={closeNavigation} />}
      <aside ref={sidebarRef} id="main-navigation" className={`sidebar${showNav ? ' sidebar-open' : ''}`} aria-label="Main navigation" aria-hidden={!showNav} inert={!showNav}>
        <div>
          <div className="brand-lockup">
            <div className="brand-mark">LT</div>
            <div>
              <p className="eyebrow">Labor Tracker</p>
              <p className="brand-title">{role === 'User' ? 'Delivery Tracking' : 'Dispatch Console'}</p>
            </div>
            <button className="sidebar-close" type="button" aria-label="Close navigation" onClick={closeNavigation}>×</button>
          </div>

          <div className="sidebar-panel">
            <p className="sidebar-panel-label">Current workspace</p>
            <p className="sidebar-panel-value">{role} operations</p>
          </div>
        </div>

        <nav className="nav">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end onClick={closeNavigation} className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <p className="sidebar-panel-label">Signed in as</p>
          <p className="sidebar-user">{user?.email || 'Guest session'}</p>
          <p className="sidebar-role">Role: {role}</p>
          {isGuest ? <p className="sidebar-note">Guest sessions can only view the dashboard and profile.</p> : null}
          <button
            className="ghost-button"
            disabled={signingOut}
            onClick={async () => {
              setSigningOut(true);
              setLogoutError('');
              try { await logout(); navigate('/'); }
              catch { setLogoutError('Sign out failed. Please try again.'); }
              finally { setSigningOut(false); }
            }}
          >
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
          {logoutError && <p role="alert">{logoutError}</p>}
        </div>
      </aside>

      <main id="main-content" className="content" tabIndex="-1">
        <section className="page-header">
          <div className="page-heading">
            <button ref={menuTriggerRef} className="menu-button" type="button" aria-label="Open navigation" aria-expanded={showNav} aria-controls="main-navigation" onClick={() => setShowNav(true)}>☰</button>
            <div>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
            </div>
          </div>
          <div className="toolbar">
            <button className="secondary-button about-button" type="button" aria-label="About and information" aria-expanded={showAbout} aria-controls="about-information-panel" onClick={() => setShowAbout(value => !value)}>ⓘ</button>
            {actions}
          </div>
        </section>
        {showAbout && <section id="about-information-panel" className="card panel" aria-label="About and information">
          <div className="panel-header"><h2>About &amp; Information</h2><button className="secondary-button" type="button" onClick={() => setShowAbout(false)}>Close</button></div>
          <div className="detail-grid"><div><strong>Current session</strong><p>{session}</p></div><div><strong>Role</strong><p>{role}</p></div><div><strong>Access</strong><p>{access}</p></div><div><strong>Data storage</strong><p>{isDemo ? 'Demo changes are saved in this browser.' : 'Customer tracking updates are shared through your account.'}</p></div></div>
        </section>}
        <div className="content-body">
          {isDemo && <p className="workspace-notice">Demo mode · Sample data · Changes saved in this browser. Reset the demo or switch roles in Settings.</p>}
          {authNotice && <p role="status" className="workspace-notice">{authNotice}</p>}
          {storageError && <p role="alert" className="error-text">{storageError}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}

export function SplashScreen() {
  return (
    <div className="centered-page gradient-page">
      <div className="card splash-card">
        <p className="eyebrow">Labor Tracker</p>
        <h2>Loading application</h2>
        <p className="loading-note">Syncing the latest auth and workspace state.</p>
        <div className="spinner" />
      </div>
    </div>
  );
}

export function AuthPage({ title, subtitle, children }) {
  return (
    <div className="centered-page gradient-page">
      <a className="skip-link" href="#account-access">Skip to account access</a>
      <div className="auth-layout">
        <section className="card hero-card" aria-label="LaborTracker introduction">
          <p className="eyebrow">Labor Tracker</p>
          <h1>{title}</h1>
          <p>{subtitle}</p>
          <div className="hero-metrics">
            <div>
              <span>Crew</span>
              <p>hours and assignments</p>
            </div>
            <div>
              <span>Routes</span>
              <p>dispatch visibility</p>
            </div>
            <div>
              <span>Demo</span>
              <p>ready to explore</p>
            </div>
          </div>
          <div className="hero-list">
            <p>Track access, deliveries, and labor posture from one console.</p>
            <p>Use guest mode for lightweight review without account setup.</p>
          </div>
        </section>
        <main id="account-access" className="card auth-card" tabIndex="-1">{children}</main>
      </div>
    </div>
  );
}

export function StatCard({ label, value }) {
  return (
    <article className="card stat-card">
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
    </article>
  );
}

export function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value}</span>
    </div>
  );
}
