import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import DonorLayout from './components/layout/DonorLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import DonationHistoryPage from './pages/DonationHistoryPage';
import NotificationsPage from './pages/NotificationsPage';
import RequestsPage from './pages/RequestsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import FindBloodBanksPage from './pages/FindBloodBanksPage';
import CertificatesPage from './pages/CertificatesPage';
import RewardsPage from './pages/RewardsPage';
import SettingsPage from './pages/SettingsPage';
import HelpSupportPage from './pages/HelpSupportPage';
import TestingBookingPage from './pages/TestingBookingPage';
import TestingWaitingPage from './pages/TestingWaitingPage';
import TestingRejectedPage from './pages/TestingRejectedPage';

// Gatekeeper: logged in, but only lets through if testingStatus === 'active'.
// Otherwise shows the correct onboarding screen for their current stage.
const Protected = ({ children }) => {
  const { donor, loading } = useAuth();
  if (loading) return <div className="loading-center"><div className="spinner" /></div>;
  if (!donor) return <Navigate to="/login" replace />;

  switch (donor.testingStatus) {
    case 'testing_pending':
      return <TestingBookingPage />;
    case 'testing_booked':
      return <TestingWaitingPage />;
    case 'testing_rejected':
      return <TestingRejectedPage />;
    case 'active':
      return children; // fully onboarded — show real dashboard routes
    default:
      // 'pending' or unknown — shouldn't normally reach here since
      // backend blocks login while status is 'pending', but fall back safely.
      return <TestingBookingPage />;
  }
};

const Public = ({ children }) => {
  const { donor, loading } = useAuth();
  if (loading) return null;
  return !donor ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Public><LoginPage /></Public>} />
          <Route path="/register" element={<Public><RegisterPage /></Public>} />
          <Route path="/" element={<Protected><DonorLayout /></Protected>}>
            <Route index          element={<DashboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="history" element={<DonationHistoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="requests"      element={<RequestsPage />} />
            <Route path="appointments"  element={<AppointmentsPage />} />
            <Route path="blood-banks"   element={<FindBloodBanksPage />} />
            <Route path="certificates"  element={<CertificatesPage />} />
            <Route path="rewards"       element={<RewardsPage />} />
            <Route path="settings"      element={<SettingsPage />} />
            <Route path="help"          element={<HelpSupportPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;