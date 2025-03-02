import React from 'react';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Theme from './Theme';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AdminDashboard from './pages/admin pages/AdminDashboard';
import SalesDashboard from './pages/sales pages/SalesDashboard';
import SettingsPage from './pages/sales pages/SettingsPage';
import SalesPage from './pages/sales pages/SalesPage';
import AdminSetting from './pages/admin pages/AdminSetting';
import SalesReport from './pages/admin pages/SalesReport';
import ProfilePage from './pages/admin pages/AdminProfilePage';
import SalesProfilePage from './pages/sales pages/SalesProfilePage';
import HRform from './pages/hr pages/HRForm';
import HrDashboard from './pages/hr pages/HrDashboard';
import HrProfilePage from './pages/hr pages/HrProfilePage';
import HrSettings from './pages/hr pages/HrSetting';
import EmployeeForm from './pages/hr pages/EmployeeForm';
import EmployeeReport from './pages/hr pages/EmployeeReport';
import EmployeeReports from './pages/admin pages/HrEmployeeReport';
import UserDashboard from './pages/User Pages/UserDashboard';
import UserProfilePage from './pages/User Pages/UserProfilePage';
import UserSettingsPage from './pages/User Pages/UserSetting';
import JobOpennings from './pages/sales pages/JobOpennings';
import JobReport from './pages/admin pages/JobReport';
import JobOpenningReport from './pages/hr pages/JobOpenningReport';
import LineUpPage from './pages/hr pages/LineUpPage';
import PaymentSection from './pages/hr pages/PaymentSection';
import { Html } from '@mui/icons-material';
import ClosedSale from './pages/hr pages/ClosedSale';
import ClosedSaleData from './pages/admin pages/ClosedSaleData';

const App = () => {
  return (
    <ThemeProvider theme={Theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
          <Route path="/sales-dashboard" element={<SalesDashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/admin-settings" element={<AdminSetting />} />
          <Route path="/sales-report" element={<SalesReport />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sales-profile" element={<SalesProfilePage />} />
          <Route path="/hr-profile" element={<HrProfilePage />} />
          <Route path="/hr" element={<HRform />} />
          <Route path="/hr-dashboard" element={<HrDashboard />} />
          <Route path="/hr-settings" element={<HrSettings />} />
          <Route path="/employee-form" element={<EmployeeForm />} />
          <Route path="/employee-data" element={<EmployeeReport />} />
          <Route path="/em-report" element={<EmployeeReports />} />
          <Route path="/user-dashboard" element={<UserDashboard />} />
          <Route path="/user-profile" element={<UserProfilePage />} />
          <Route path="/user-settings" element={<UserSettingsPage />} />
          <Route path="/jobopennings" element={<JobOpennings />} />
          <Route path="/job-report" element={<JobReport />} />
          <Route path="/Hr-assign" element={<JobOpenningReport />} />
          <Route path="/lineup" element={<LineUpPage />} />
          <Route path="/payment" element={<PaymentSection />} />
          <Route path="/close" element={<ClosedSale />} />
          <Route path="/closedsale" element={<ClosedSaleData />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
};

export default App;
