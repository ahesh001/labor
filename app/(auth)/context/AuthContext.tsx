import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebaseConfig"; // Adjust the import based on your Firebase setup

type AuthContextProps = {
  user: User | null;
  role: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
  setUser: (user: any) => void;
  setRole: (role: string | null) => void;
};

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Fetch role from Firestore
        const userRef = doc(db, "users", user.uid);
        const snap = await getDoc(userRef);
        setRole(snap.exists() ? snap.data().role : null);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setRole(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, loading, role, signOut, setUser, setRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};