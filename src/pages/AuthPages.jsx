import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { AuthPage } from '../components/AppShell';
import { guestAllowedPaths } from '../constants/navigation';
import { useAuth } from '../context/AuthContext';

function StartupIntro() {
  return (
    <div className="startup-screen">
      <div className="startup-orb startup-orb-one" />
      <div className="startup-orb startup-orb-two" />
      <div className="startup-stage">
        <div className="startup-mark">LT</div>
        <p className="eyebrow startup-kicker">Labor Tracker</p>
        <h1>Preparing the dispatch console</h1>
        <p className="startup-copy">Loading the browser workspace, role-aware access, and delivery overview.</p>
        <div className="startup-track" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="startup-grid" aria-hidden="true">
          <div className="startup-card">
            <strong>Access</strong>
            <p>Role state</p>
          </div>
          <div className="startup-card">
            <strong>Routes</strong>
            <p>Queue view</p>
          </div>
          <div className="startup-card">
            <strong>Labor</strong>
            <p>Shift posture</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role, signIn, signInAsGuest, signInDemo } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [showIntro, setShowIntro] = useState(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.sessionStorage.getItem('laborTrackerIntroSeen') !== 'true';
  });

  const redirectPath = location.state?.from || '/dashboard';
  const nextPath = guestAllowedPaths.has(redirectPath) ? redirectPath : '/dashboard';

  useEffect(() => {
    if (!showIntro || isAuthenticated) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem('laborTrackerIntroSeen', 'true');
      setShowIntro(false);
    }, 1800);

    return () => window.clearTimeout(timer);
  }, [isAuthenticated, showIntro]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(role === 'Guest' ? nextPath : redirectPath, { replace: true });
    }
  }, [isAuthenticated, navigate, nextPath, redirectPath, role]);

  if (showIntro && !isAuthenticated) {
    return <StartupIntro />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setPending(true);
    setError('');

    try {
      await signIn(email, password);
    } catch (submissionError) {
      setError('Unable to sign in. Check your credentials and try again.');
    } finally {
      setPending(false);
    }
  }

  async function handleGuestLogin() {
    setPending(true);
    setError('');

    try {
      await signInAsGuest();
      navigate(nextPath, { replace: true });
    } catch (submissionError) {
      setError('Guest access could not be started.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPage
      title="Track labor, deliveries, and role access in one web app."
      subtitle="Coordinate your crew, record work hours, and keep every delivery moving."
    >
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@domain.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <p className="form-caption">Use a full account for operational access, or guest mode for a limited walkthrough.</p>

        <div className="form-actions">
          <button className="primary-button" type="button" disabled={pending} onClick={() => { try { signInDemo(); } catch { setError('Demo access requires browser storage. Enable it and try again.'); } }}>
            Open demo workspace
          </button>
          <p className="form-caption">Includes sample deliveries and crew hours. Demo changes are saved in this browser.</p>
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? 'Signing in...' : 'Sign in'}
          </button>
          <button className="secondary-button" type="button" onClick={handleGuestLogin} disabled={pending}>
            Continue as guest
          </button>
        </div>
      </form>

      <div className="inline-links">
        <Link to="/register">Create an account</Link>
        <Link to="/forgot-password">Forgot password?</Link>
      </div>
    </AuthPage>
  );
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords must match.');
      return;
    }

    setPending(true);

    try {
      await register(email, password);
      navigate('/dashboard', { replace: true });
    } catch (submissionError) {
      setError('Account creation failed. Try a different email address.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPage
      title="Create a new account"
      subtitle="New users are stored in Firebase Auth and seeded into Firestore with the default User role."
    >
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@domain.com"
            required
          />
        </label>

        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            minLength="6"
            required
          />
        </label>

        <label>
          Confirm password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Confirm password"
            minLength="6"
            required
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}

        <p className="form-caption">New accounts are provisioned with the default User role and can be elevated later.</p>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? 'Creating...' : 'Create account'}
          </button>
        </div>
      </form>

      <div className="inline-links">
        <Link to="/">Back to sign in</Link>
      </div>
    </AuthPage>
  );
}

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setMessage('');
    setError('');
    setPending(true);

    try {
      await resetPassword(email);
      setMessage('Password reset email sent.');
    } catch (submissionError) {
      setError('Could not send reset email. Check the address and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <AuthPage title="Reset your password" subtitle="This uses Firebase Auth email recovery.">
      <form className="form" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="email@domain.com"
            required
          />
        </label>

        {error ? <p className="error-text">{error}</p> : null}
        {message ? <p className="success-text">{message}</p> : null}

        <p className="form-caption">We will send a password recovery link to the email address on file.</p>

        <div className="form-actions">
          <button className="primary-button" type="submit" disabled={pending}>
            {pending ? 'Sending...' : 'Send reset email'}
          </button>
        </div>
      </form>

      <div className="inline-links">
        <Link to="/">Back to sign in</Link>
      </div>
    </AuthPage>
  );
}
