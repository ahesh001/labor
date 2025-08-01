import { useAuth } from '../(auth)/context/AuthContext';
import { router } from 'expo-router';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, loading } = useAuth();

  useEffect(() => {
    if (!loading && role !== "admin") {
      router.replace("/(auth)/login");
    }
  }, [role, loading]);

  if (loading || role !== "admin") return null; // or loading spinner

  return <>{children}</>;
}
function useEffect(arg0: () => void, arg1: (string | boolean | null)[]) {
    throw new Error('Function not implemented.');
}

