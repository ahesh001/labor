import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../../firebaseConfig';

const AuthContext = createContext(null);
const demoRoles = ['Admin', 'Lead', 'User'];
function readDemo() {
  try {
    const role = localStorage.getItem('laborTracker.demoRole');
    if (demoRoles.includes(role)) return role;
    return localStorage.getItem('laborTracker.guest') === 'true' ? 'Guest' : null;
  } catch { return null; }
}
function normalizeRole(value) {
  const role = String(value || '').toLowerCase();
  return role === 'admin' ? 'Admin' : role === 'lead' ? 'Lead' : ['guest', 'nonuser'].includes(role) ? 'Guest' : 'User';
}
function deadline(promise, milliseconds) {
  let timer;
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Connection timed out.')), milliseconds); })]).finally(() => clearTimeout(timer));
}
const demoUser = { uid: 'demo-operator', email: 'demo@labortracker.example', displayName: 'Demo Operator', isAnonymous: false };
const guestUser = { uid: 'local-guest', isAnonymous: true };

export function AuthProvider({ children }) {
  const [initialRole] = useState(readDemo);
  const [user, setUser] = useState(initialRole ? initialRole === 'Guest' ? guestUser : demoUser : null);
  const [role, setRole] = useState(initialRole || 'Guest');
  const [isDemo, setIsDemo] = useState(Boolean(initialRole && initialRole !== 'Guest'));
  const [loading, setLoading] = useState(!initialRole);
  const [authNotice, setAuthNotice] = useState('');
  const mode = useRef(initialRole ? initialRole === 'Guest' ? 'guest' : 'demo' : 'firebase');
  const revision = useRef(0);

  useEffect(() => {
    let active = true;
    const startupTimer = setTimeout(() => { if (active) setLoading(false); }, 6000);
    const unsubscribe = onAuthStateChanged(auth, async nextUser => {
      if (mode.current !== 'firebase') return;
      const current = ++revision.current;
      let nextRole = nextUser ? 'User' : 'Guest';
      if (nextUser?.isAnonymous) nextRole = 'Guest';
      else if (nextUser) {
        try {
          const snapshot = await deadline(getDoc(doc(db, 'users', nextUser.uid)), 5000);
          nextRole = normalizeRole(snapshot.exists() ? snapshot.data().role : 'User');
        } catch { if (active && current === revision.current) setAuthNotice('Account permissions could not be loaded. Basic user access is available.'); }
      }
      if (!active || current !== revision.current || mode.current !== 'firebase') return;
      setUser(nextUser); setRole(nextRole); setLoading(false);
    }, () => { if (active) { setAuthNotice('Authentication service is unavailable. You can still open the demo workspace.'); setLoading(false); } });
    return () => { active = false; revision.current++; clearTimeout(startupTimer); unsubscribe(); };
  }, []);

  function localSession(nextRole, guest = false) {
    if (!guest) {
      localStorage.setItem('laborTracker.demoRole', nextRole);
      localStorage.removeItem('laborTracker.guest');
    } else {
      localStorage.removeItem('laborTracker.demoRole');
      localStorage.setItem('laborTracker.guest', 'true');
    }
    mode.current = guest ? 'guest' : 'demo'; revision.current++;
    setIsDemo(!guest); setUser(guest ? guestUser : demoUser);
    setRole(nextRole); setLoading(false); setAuthNotice('');
  }
  const value = {
    user, role, isDemo, loading, authNotice, isAuthenticated: Boolean(user),
    signInDemo(nextRole = 'Admin') { if (!demoRoles.includes(nextRole)) throw new Error('Invalid demo role.'); localSession(nextRole); },
    async signIn(email, password) {
      localStorage.removeItem('laborTracker.demoRole'); localStorage.removeItem('laborTracker.guest'); mode.current = 'firebase'; setIsDemo(false); setAuthNotice('');
      try { return await signInWithEmailAndPassword(auth, email.trim(), password); }
      finally { setLoading(false); }
    },
    async register(email, password) {
      localStorage.removeItem('laborTracker.demoRole'); localStorage.removeItem('laborTracker.guest'); mode.current = 'firebase'; setIsDemo(false);
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      try {
        await deadline(setDoc(doc(db, 'users', credential.user.uid), { email: email.trim(), role: 'User', createdAt: serverTimestamp() }, { merge: true }), 5000);
      } catch { setAuthNotice('Your account was created, but its profile could not be saved. Basic user access is available.'); }
      return credential;
    },
    async signInAsGuest() { localSession('Guest', true); },
    async resetPassword(email) { return sendPasswordResetEmail(auth, email.trim()); },
    async logout() {
      await signOut(auth);
      localStorage.removeItem('laborTracker.demoRole'); mode.current = 'signed-out'; revision.current++;
      localStorage.removeItem('laborTracker.guest');
      setUser(null); setRole('Guest'); setIsDemo(false); setAuthNotice('');
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
