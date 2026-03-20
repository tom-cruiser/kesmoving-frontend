import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layouts
import ClientLayout from './components/layout/ClientLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Client Pages
import ClientDashboard from './pages/client/ClientDashboard';
import NewBookingPage from './pages/client/NewBookingPage';
import BookingDetailPage from './pages/client/BookingDetailPage';
import TrackingPage from './pages/client/TrackingPage';
import ClientBookingsPage from './pages/client/ClientBookingsPage';
import ReviewPage from './pages/client/ReviewPage';
import ChatPage from './pages/client/ChatPage';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import BookingsManagementPage from './pages/admin/BookingsManagementPage';
import FleetManagementPage from './pages/admin/FleetManagementPage';
import AdminTrackingPage from './pages/admin/AdminTrackingPage';
import StaffManagementPage from './pages/admin/StaffManagementPage';
import AnalyticsPage from './pages/admin/AnalyticsPage';
import AdminChatPage from './pages/admin/AdminChatPage';
import EstimateReviewPage from './pages/admin/EstimateReviewPage';

import type { Role } from './types';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === 'Client' ? '/dashboard' : '/admin'} replace />;
  }
  return <>{children}</>;
}

const STAFF_ROLES: Role[] = [
  'Admin', 'OperationsManager', 'CustomerService', 'Sales',
  'Driver', 'Mover', 'WarehouseWorker', 'Packer',
  'QualityAssurance', 'ITSupport', 'Marketing',
];

export default function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={isAuthenticated ? <Navigate to={user?.role === 'Client' ? '/dashboard' : '/admin'} replace /> : <LandingPage />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'Client' ? '/dashboard' : '/admin'} replace /> : <LoginPage />} />
      <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />} />

      {/* Client Portal */}
      <Route element={<PrivateRoute allowedRoles={['Client']}><ClientLayout /></PrivateRoute>}>
        <Route path="/dashboard" element={<ClientDashboard />} />
        <Route path="/bookings" element={<ClientBookingsPage />} />
        <Route path="/bookings/new" element={<NewBookingPage />} />
        <Route path="/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/tracking/:bookingId" element={<TrackingPage />} />
        <Route path="/review/:bookingId" element={<ReviewPage />} />
        <Route path="/chat" element={<ChatPage />} />
      </Route>

      {/* Operations Dashboard */}
      <Route element={<PrivateRoute allowedRoles={STAFF_ROLES}><AdminLayout /></PrivateRoute>}>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/bookings" element={<BookingsManagementPage />} />
        <Route path="/admin/bookings/:id" element={<BookingDetailPage />} />
        <Route path="/admin/fleet" element={<FleetManagementPage />} />
        <Route path="/admin/tracking" element={<AdminTrackingPage />} />
        <Route path="/admin/staff" element={<StaffManagementPage />} />
        <Route path="/admin/analytics" element={<AnalyticsPage />} />
        <Route path="/admin/chat" element={<AdminChatPage />} />
        <Route path="/admin/estimates" element={<EstimateReviewPage />} />
      </Route>

      {/* Root redirect */}
      <Route
        path="*"
        element={<Navigate to="/" replace />}
      />
    </Routes>
  );
}
