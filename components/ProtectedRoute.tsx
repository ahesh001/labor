import { useAuth } from "../app/(auth)/context/AuthContext";
import { router } from "expo-router";
import { useEffect } from "react";

export default function ProtectedRoute({
  allowedRoles,
  children,
}: {
  allowedRoles: string[];
  children: React.ReactNode;
}) {
  const { loading, role } = useAuth();

  useEffect(() => {
    if (!loading && (!role || !allowedRoles.includes(role))) {
      router.replace("/(auth)/login");
    }
  }, [loading, role]);

  if (loading || !allowedRoles.includes(role ?? "")) return null;
  return <>{children}</>;
}
