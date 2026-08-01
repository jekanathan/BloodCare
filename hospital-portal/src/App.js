import React from 'react';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {AuthProvider,useAuth} from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientsPage from './pages/PatientsPage';
import BloodRequestsPage from './pages/BloodRequestsPage';
import DonorRequestsPage from './pages/DonorRequestsPage';
import DonorTestingPage from './pages/DonorTestingPage';
import BloodTestingPage from './pages/BloodTestingPage';
import BloodBanksPage from './pages/BloodBanksPage';
import HospitalStaffPage from './pages/HospitalStaffPage';
import AppointmentsPage from './pages/AppointmentsPage';
import EmergencyManagementPage from './pages/EmergencyManagementPage';
import BloodTransfusionPage from './pages/BloodTransfusionPage';
import BloodVerificationPage from './pages/BloodVerificationPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import HospitalPartnershipsPage from './pages/HospitalPartnershipsPage';
import RequestHistoryPage from './pages/RequestHistoryPage';
import ProfilePage from './pages/ProfilePage';
import ActivityLogsPage from './pages/ActivityLogsPage';

const Protected=({children})=>{
  const {hospital,loading}=useAuth();
  if(loading)return<div className="loading-c"><div className="spinner"/></div>;
  return hospital?children:<Navigate to="/login" replace/>;
};
const Public=({children})=>{
  const {hospital,loading}=useAuth();
  if(loading)return null;
  return !hospital?children:<Navigate to="/" replace/>;
};

export default function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Public><LoginPage/></Public>}/>
          <Route path="/register" element={<Public><RegisterPage/></Public>}/>
          <Route path="/" element={<Protected><Layout/></Protected>}>
            <Route index element={<DashboardPage/>}/>
            <Route path="patients"        element={<PatientsPage/>}/>
            <Route path="blood-requests"  element={<BloodRequestsPage/>}/>
            <Route path="donor-requests"  element={<DonorRequestsPage/>}/>
            <Route path="donor-testing"   element={<DonorTestingPage/>}/>
            <Route path="blood-testing"   element={<BloodTestingPage/>}/>
            <Route path="blood-banks"     element={<BloodBanksPage/>}/>
            <Route path="hospital-staff"  element={<HospitalStaffPage/>}/>
            <Route path="appointments"    element={<AppointmentsPage/>}/>
            <Route path="emergency-management" element={<EmergencyManagementPage/>}/>
            <Route path="blood-transfusion" element={<BloodTransfusionPage/>}/>
            <Route path="blood-verification" element={<BloodVerificationPage/>}/>
            <Route path="notifications"   element={<NotificationsPage/>}/>
            <Route path="reports"         element={<ReportsPage/>}/>
            <Route path="hospital-partnerships" element={<HospitalPartnershipsPage/>}/>
            <Route path="history"         element={<RequestHistoryPage/>}/>
            <Route path="profile"         element={<ProfilePage/>}/>
            <Route path="activity-logs"   element={<ActivityLogsPage/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}