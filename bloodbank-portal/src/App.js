import React from 'react';
import {BrowserRouter,Routes,Route,Navigate} from 'react-router-dom';
import {AuthProvider,useAuth} from './context/AuthContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import InventoryPage from './pages/InventoryPage';
import HospitalRequestsPage from './pages/HospitalRequestsPage';
import {DonationsPage,DonorManagementPage,CampaignsPage,BloodTestingPage,ProfilePage} from './pages/AllPages';

const Protected=({children})=>{const {bank,loading}=useAuth();if(loading)return<div className="loading-c"><div className="spinner"/></div>;return bank?children:<Navigate to="/login" replace/>;};
const Public=({children})=>{const {bank,loading}=useAuth();if(loading)return null;return !bank?children:<Navigate to="/" replace/>;};

export default function App(){
  return(
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"    element={<Public><LoginPage/></Public>}/>
          <Route path="/register" element={<Public><RegisterPage/></Public>}/>
          <Route path="/" element={<Protected><Layout/></Protected>}>
            <Route index element={<DashboardPage/>}/>
            <Route path="inventory"         element={<InventoryPage/>}/>
            <Route path="hospital-requests" element={<HospitalRequestsPage/>}/>
            <Route path="donations"         element={<DonationsPage/>}/>
            <Route path="donors"            element={<DonorManagementPage/>}/>
            <Route path="campaigns"         element={<CampaignsPage/>}/>
            <Route path="blood-testing"     element={<BloodTestingPage/>}/>
            <Route path="profile"           element={<ProfilePage/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
