import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import DashboardPage from './pages/DashboardPage';
import DonorsPage from './pages/DonorsPage';
import MedicalScreeningPage from './pages/MedicalScreeningPage';
import DonorCertificatesPage from './pages/DonorCertificatesPage';
import StorageFacilitiesPage from './pages/StorageFacilitiesPage';
import CollectionCentersPage from './pages/CollectionCentersPage';
import EquipmentPage from './pages/EquipmentPage';
import BloodBankLicensesPage from './pages/BloodBankLicensesPage';
import BloodBankActivityLogsPage from './pages/BloodBankActivityLogsPage';
import HospitalBloodRequestsPage from './pages/HospitalBloodRequestsPage';
import HospitalLicensesPage from './pages/HospitalLicensesPage';
import HospitalContactsPage from './pages/HospitalContactsPage';
import HospitalActivityLogsPage from './pages/HospitalActivityLogsPage';
import DepartmentsPage from './pages/DepartmentsPage';
import AttendancePage from './pages/AttendancePage';
import LeaveManagementPage from './pages/LeaveManagementPage';
import ShiftManagementPage from './pages/ShiftManagementPage';
import BloodBagsPage from './pages/BloodBagsPage';
import BloodTestingPage from './pages/BloodTestingPage';
import BloodAvailabilityPage from './pages/BloodAvailabilityPage';
import EmergencyContactsPage from './pages/EmergencyContactsPage';
import HospitalsPage from './pages/HospitalsPage';
import BloodBanksPage from './pages/BloodBanksPage';
import BloodRequestsPage from './pages/BloodRequestsPage';
import InventoryPage from './pages/InventoryPage';
import CampaignsPage from './pages/CampaignsPage';
import EmergencyPage from './pages/EmergencyPage';
import ReportsPage from './pages/ReportsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import FeedbackPage from './pages/FeedbackPage';
import LocationsPage from './pages/LocationsPage';
import SecurityPage from './pages/SecurityPage';
import SystemHealthPage from './pages/SystemHealthPage';
import TodaySummaryPage from './pages/TodaySummaryPage';
import StaffPage from './pages/StaffPage';
import PendingApprovalsPage from './pages/PendingApprovalsPage';
import NotificationsPage from './pages/NotificationsPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="loading-state" style={{ minHeight: '100vh' }}>
      <div className="spinner" />
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return !user ? children : <Navigate to="/dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ===== PUBLIC PAGES ===== */}
          <Route path="/"      element={<HomePage/>}/>
          <Route path="/home"  element={<HomePage/>}/>
          <Route path="/about" element={<AboutPage/>}/>
          <Route path="/login" element={<PublicRoute><LoginPage/></PublicRoute>}/>

          {/* ===== ADMIN PANEL ===== */}
          <Route path="/dashboard" element={<ProtectedRoute><Layout/></ProtectedRoute>}>
            <Route index element={<DashboardPage/>}/>
            <Route path="system-health"             element={<SystemHealthPage/>}/>
            <Route path="today-summary"             element={<TodaySummaryPage/>}/>
            <Route path="donors"                    element={<DonorsPage/>}/>
            <Route path="donors/add"                element={<DonorsPage/>}/>
            <Route path="donors/eligible"           element={<DonorsPage/>}/>
            <Route path="donors/deferred"           element={<DonorsPage/>}/>
            <Route path="donors/blacklist"          element={<DonorsPage/>}/>
            <Route path="donors/donation-history"   element={<DonorsPage/>}/>
            <Route path="donors/medical-screening"  element={<MedicalScreeningPage/>}/>
            <Route path="donors/certificates"       element={<DonorCertificatesPage/>}/>
            <Route path="donors/reports"            element={<DonorsPage/>}/>
            <Route path="hospitals"                 element={<HospitalsPage/>}/>
            <Route path="hospitals/add"             element={<HospitalsPage/>}/>
            <Route path="hospitals/staff"           element={<HospitalsPage/>}/>
            <Route path="hospitals/departments"     element={<HospitalsPage/>}/>
            <Route path="hospitals/blood-requests"  element={<HospitalBloodRequestsPage/>}/>
            <Route path="hospitals/licenses"        element={<HospitalLicensesPage/>}/>
            <Route path="hospitals/contacts"        element={<HospitalContactsPage/>}/>
            <Route path="hospitals/activity-logs"   element={<HospitalActivityLogsPage/>}/>
            <Route path="blood-banks"               element={<BloodBanksPage/>}/>
            <Route path="blood-banks/add"           element={<BloodBanksPage/>}/>
            <Route path="blood-banks/branches"      element={<BloodBanksPage/>}/>
            <Route path="blood-banks/staff"         element={<BloodBanksPage/>}/>
            <Route path="blood-banks/storage"            element={<StorageFacilitiesPage/>}/>
            <Route path="blood-banks/collection-centers" element={<CollectionCentersPage/>}/>
            <Route path="blood-banks/equipment"          element={<EquipmentPage/>}/>
            <Route path="blood-banks/licenses"           element={<BloodBankLicensesPage/>}/>
            <Route path="blood-banks/activity-logs"      element={<BloodBankActivityLogsPage/>}/>
            <Route path="blood-requests"            element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/pending"    element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/inventory-check" element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/cross-match" element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/allocation" element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/ready-for-dispatch" element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/dispatch"   element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/delivered"  element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/emergency"  element={<BloodRequestsPage/>}/>
            <Route path="blood-requests/cancelled"  element={<BloodRequestsPage/>}/>
            <Route path="inventory"                 element={<InventoryPage/>}/>
            <Route path="inventory/components"      element={<InventoryPage/>}/>
            <Route path="inventory/bags"            element={<BloodBagsPage/>}/>
            <Route path="inventory/testing"         element={<BloodTestingPage/>}/>
            <Route path="inventory/transfer"        element={<InventoryPage/>}/>
            <Route path="inventory/history"         element={<InventoryPage/>}/>
            <Route path="inventory/expired"         element={<InventoryPage/>}/>
            <Route path="campaigns"                 element={<CampaignsPage/>}/>
            <Route path="campaigns/create"          element={<CampaignsPage/>}/>
            <Route path="campaigns/upcoming"        element={<CampaignsPage/>}/>
            <Route path="campaigns/ongoing"         element={<CampaignsPage/>}/>
            <Route path="campaigns/completed"       element={<CampaignsPage/>}/>
            <Route path="campaigns/volunteers"      element={<CampaignsPage/>}/>
            <Route path="campaigns/reports"         element={<CampaignsPage/>}/>
            <Route path="emergency"                 element={<EmergencyPage/>}/>
            <Route path="emergency/search"          element={<EmergencyPage/>}/>
            <Route path="emergency/availability"    element={<BloodAvailabilityPage/>}/>
            <Route path="emergency/alerts"          element={<EmergencyPage/>}/>
            <Route path="emergency/contacts"        element={<EmergencyContactsPage/>}/>
            <Route path="emergency/priority"        element={<EmergencyPage/>}/>
            <Route path="reports"                   element={<ReportsPage/>}/>
            <Route path="reports/donor"             element={<ReportsPage/>}/>
            <Route path="reports/stock"             element={<ReportsPage/>}/>
            <Route path="reports/hospital"          element={<ReportsPage/>}/>
            <Route path="reports/monthly"           element={<ReportsPage/>}/>
            <Route path="reports/export"            element={<ReportsPage/>}/>
            <Route path="analytics"                 element={<AnalyticsPage/>}/>
            <Route path="analytics/blood-usage"     element={<AnalyticsPage/>}/>
            <Route path="analytics/province"        element={<AnalyticsPage/>}/>
            <Route path="analytics/growth"          element={<AnalyticsPage/>}/>
            <Route path="settings"                  element={<SettingsPage/>}/>
            <Route path="settings/general"          element={<SettingsPage/>}/>
            <Route path="settings/email"            element={<SettingsPage/>}/>
            <Route path="settings/sms"              element={<SettingsPage/>}/>
            <Route path="settings/theme"            element={<SettingsPage/>}/>
            <Route path="feedback"                  element={<FeedbackPage/>}/>
            <Route path="feedback/ratings"          element={<FeedbackPage/>}/>
            <Route path="feedback/complaints"       element={<FeedbackPage/>}/>
            <Route path="feedback/suggestions"      element={<FeedbackPage/>}/>
            <Route path="locations"                 element={<LocationsPage/>}/>
            <Route path="locations/provinces"       element={<LocationsPage/>}/>
            <Route path="locations/districts"       element={<LocationsPage/>}/>
            <Route path="locations/cities"          element={<LocationsPage/>}/>
            <Route path="locations/maps"            element={<LocationsPage/>}/>
            <Route path="staff"                     element={<StaffPage/>}/>
            <Route path="staff/roles"               element={<StaffPage/>}/>
            <Route path="staff/permissions"         element={<StaffPage/>}/>
            <Route path="staff/departments"         element={<DepartmentsPage/>}/>
            <Route path="staff/attendance"          element={<AttendancePage/>}/>
            <Route path="staff/leave"               element={<LeaveManagementPage/>}/>
            <Route path="staff/shifts"              element={<ShiftManagementPage/>}/>
            <Route path="pending-approvals"         element={<PendingApprovalsPage/>}/>
            <Route path="notifications"             element={<NotificationsPage/>}/>
            <Route path="notifications/sms"         element={<NotificationsPage/>}/>
            <Route path="notifications/email"       element={<NotificationsPage/>}/>
            <Route path="notifications/push"        element={<NotificationsPage/>}/>
            <Route path="notifications/announcements" element={<NotificationsPage/>}/>
            <Route path="notifications/templates"    element={<NotificationsPage/>}/>
            <Route path="security"                  element={<SecurityPage/>}/>
            <Route path="security/logs"             element={<SecurityPage/>}/>
            <Route path="security/audit"            element={<SecurityPage/>}/>
            <Route path="security/backup"           element={<SecurityPage/>}/>
            <Route path="security/2fa"              element={<SecurityPage/>}/>
            <Route path="*"                         element={<Navigate to="/dashboard" replace/>}/>
          </Route>

          {/* Catch all → home */}
          <Route path="*" element={<Navigate to="/" replace/>}/>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;