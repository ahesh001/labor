import { useState } from 'react';
import { Navigate, NavLink, useLocation, useNavigate } from 'react-router-dom';

import { appNavLinks } from '../constants/navigation';
import { useAuth } from '../context/AuthContext';
import { useWorkspace } from '../context/WorkspaceContext';

export function ProtectedRoute({ children, allowGuest = false }) {
  const { isAuthenticated, loading, role } = useAuth();
  const location = useLocation();

  if (loading) {
    return <SplashScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (role === 'Guest' && !allowGuest) {
    return <Navigate to="/dashboard" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export function PageShell({ title, subtitle, actions, children }) {
  const { role, user, logout, isDemo, authNotice } = useAuth();
  const { storageError } = useWorkspace();
  const [logoutError, setLogoutError] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const navigate = useNavigate();
  const isGuest = role === 'Guest';
  const navLinks = appNavLinks.filter((link) => link.guestVisible !== false || !isGuest);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <div className="brand-lockup">
            <div className="brand-mark">LT</div>
            <div>
              <p className="eyebrow">Labor Tracker</p>
              <p className="brand-title">Dispatch Console</p>
            </div>
          </div>

          <div className="sidebar-panel">
            <p className="sidebar-panel-label">Current workspace</p>
            <p className="sidebar-panel-value">{role} operations</p>
            <p className="sidebar-panel-copy">
              Monitor routes, team status, and account access from a single browser workspace.
            </p>
          </div>
        </div>

        <nav className="nav">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end className={({ isActive }) => (isActive ? 'is-active' : undefined)}>
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

      <main className="content">
        <section className="page-header">
          <div>
            <p className="eyebrow page-kicker">{isDemo ? 'Demo workspace' : 'Labor Tracker'}</p>
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          {actions ? <div className="toolbar">{actions}</div> : null}
        </section>
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
      <div className="auth-layout">
        <section className="card hero-card">
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
        <section className="card auth-card">{children}</section>
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
