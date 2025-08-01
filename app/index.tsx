// app/index.tsx
import { useAuth } from "./(auth)/context/AuthContext";
import { useContext, useEffect } from "react";
import { router } from "expo-router";

export default function Index() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return; // Wait for auth to load!
    if (user) {
      router.replace("/(tabs)");
    } else {
      router.replace("/(auth)/login");
    }
  }, [user, loading]);

  return null;
}
