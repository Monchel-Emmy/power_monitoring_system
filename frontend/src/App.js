import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import UserManagementPage from './pages/UserManagementPage';
import DashboardLayout from './components/DashboardLayout';
import ManagerLayout from './components/ManagerLayout';
import DeviceManagementPage from './pages/DeviceManagementPage';
import BuildingConfigurationPage from './pages/BuildingConfigurationPage';
import SystemConfigurationPage from './pages/SystemConfigurationPage';
import AuditLogPage from './pages/AuditLogPage';
import ManagerLiveMonitoringPage from './pages/ManagerLiveMonitoringPage';
import ManagerMobileMonitoringPage from './pages/ManagerMobileMonitoringPage';
import ManagerPredictiveAnalyticsPage from './pages/ManagerPredictiveAnalyticsPage';
import ManagerAnalyticsTrendsPage from './pages/ManagerAnalyticsTrendsPage';
import ManagerAlertsNotificationsPage from './pages/ManagerAlertsNotificationsPage';
import ManagerBuildingZonesPage from './pages/ManagerBuildingZonesPage';
import ManagerCostManagementPage from './pages/ManagerCostManagementPage';
import ManagerSustainabilityPage from './pages/ManagerSustainabilityPage';
import ManagerReportsPage from './pages/ManagerReportsPage';

function AppRoutes() {
  const { user, token } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to={user?.role === 'admin' ? '/' : '/manager'} replace /> : <LoginPage />} />
      <Route path="/signup" element={token ? <Navigate to={user?.role === 'admin' ? '/' : '/manager'} replace /> : <SignupPage />} />

      <Route path="/" element={<ProtectedRoute requiredRole="admin"><DashboardLayout /></ProtectedRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="system-overview" element={<DashboardPage />} />
        <Route path="user-management" element={<UserManagementPage />} />
        <Route path="device-management" element={<DeviceManagementPage />} />
        <Route path="building-configuration" element={<BuildingConfigurationPage />} />
        <Route path="system-configuration" element={<SystemConfigurationPage />} />
        <Route path="audit-log" element={<AuditLogPage />} />
      </Route>

      <Route path="/manager" element={<ProtectedRoute requiredRole={['admin', 'manager']}><ManagerLayout /></ProtectedRoute>}>
        <Route index element={<ManagerLiveMonitoringPage />} />
        <Route path="mobile-monitoring" element={<ManagerMobileMonitoringPage />} />
        <Route path="analytics-trends" element={<ManagerAnalyticsTrendsPage />} />
        <Route path="predictive-analytics" element={<ManagerPredictiveAnalyticsPage />} />
        <Route path="alerts-notifications" element={<ManagerAlertsNotificationsPage />} />
        <Route path="building-zones" element={<ManagerBuildingZonesPage />} />
        <Route path="cost-management" element={<ManagerCostManagementPage />} />
        <Route path="sustainability" element={<ManagerSustainabilityPage />} />
        <Route path="reports" element={<ManagerReportsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
