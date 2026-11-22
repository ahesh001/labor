import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ProtectedRoute as RouteGuard, SplashScreen as LoadingScreen } from './components/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import {
  DashboardPage as DashboardScreen,
  GuestOrderLookupPage as GuestOrderLookupScreen,
  DeliveryDetailPage as DeliveryDetailScreen,
  DeliveryHistoryPage as DeliveryHistoryScreen,
  DeliveryListPage as DeliveryListScreen,
  CrewMemberPage,
  NotFoundPage as NotFoundScreen,
  ProfilePage as ProfileScreen,
  SettingsPage as SettingsScreen,
  LaborPage,
} from './pages/AppPages';
import {
  ForgotPasswordPage as ForgotPasswordScreen,
  LoginPage as LoginScreen,
  RegisterPage as RegisterScreen,
} from './pages/AuthPages';

function App() {
  return (
    <AuthProvider>
      <AccessibilityProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </WorkspaceProvider>
      </AccessibilityProvider>
    </AuthProvider>
  );
}

function AppRoutes() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Routes>
      <Route path="/" element={<LoginScreen />} />
      <Route path="/register" element={<RegisterScreen />} />
      <Route path="/forgot-password" element={<ForgotPasswordScreen />} />
      <Route path="/guest-tracking" element={<GuestOrderLookupScreen />} />
      <Route
        path="/dashboard"
        element={
          <RouteGuard allowGuest>
            <DashboardScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/deliveries"
        element={
          <RouteGuard requiredPermission="orders:read">
            <DeliveryListScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/deliveries/history"
        element={
          <RouteGuard requiredPermission="orders:read">
            <DeliveryHistoryScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/deliveries/:id"
        element={
          <RouteGuard requiredPermission="orders:read">
            <DeliveryDetailScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <RouteGuard allowGuest>
            <SettingsScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/profile"
        element={
          <RouteGuard allowGuest>
            <ProfileScreen />
          </RouteGuard>
        }
      />
      <Route path="/labor" element={<RouteGuard requiredPermission="labor:read"><LaborPage /></RouteGuard>} />
      <Route path="/labor/crew/:workerId" element={<RouteGuard requiredPermission="labor:read"><RouteGuard requiredPermission="users:read"><CrewMemberPage /></RouteGuard></RouteGuard>} />
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}

export default App;
