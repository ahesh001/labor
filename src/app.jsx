import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { ProtectedRoute as RouteGuard, SplashScreen as LoadingScreen } from './components/AppShell';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorkspaceProvider } from './context/WorkspaceContext';
import {
  DashboardPage as DashboardScreen,
  DeliveryDetailPage as DeliveryDetailScreen,
  DeliveryHistoryPage as DeliveryHistoryScreen,
  DeliveryListPage as DeliveryListScreen,
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
      <WorkspaceProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WorkspaceProvider>
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
          <RouteGuard>
            <DeliveryListScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/deliveries/history"
        element={
          <RouteGuard>
            <DeliveryHistoryScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/deliveries/:id"
        element={
          <RouteGuard>
            <DeliveryDetailScreen />
          </RouteGuard>
        }
      />
      <Route
        path="/settings"
        element={
          <RouteGuard>
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
      <Route path="/labor" element={<RouteGuard><LaborPage /></RouteGuard>} />
      <Route path="*" element={<NotFoundScreen />} />
    </Routes>
  );
}

export default App;
