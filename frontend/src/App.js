import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { ThemeProvider, CssBaseline } from '@mui/material';
import Theme from './Theme';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import AdminDashboard from './pages/admin pages/AdminDashboard';
import SalesDashboard from './pages/sales pages/SalesDashboard';
import SettingsPage from './pages/sales pages/SettingsPage';
import AdminSetting from './pages/admin pages/TLPermissions';
import ProfilePage from './pages/admin pages/AdminProfilePage';
import SalesProfilePage from './pages/sales pages/SalesProfilePage';
import AssignedData from './pages/hr pages/AssignedData';
import HrProfilePage from './pages/hr pages/HrProfilePage';
import JobOpennings from './pages/sales pages/JobOpennings';
import JobReport from './pages/admin pages/JobReport';
import MasterDashboard from './pages/admin pages/MasterDashboard';
import HRMasterDashboard from './pages/hr pages/HRMasterDashboard';
import SalesMasterDashboard from './pages/sales pages/SalesMasterDashboard';
import JobListWithCandidates from './pages/hr pages/JobListWithCandidates';
import JobPostingForm from './pages/hr pages/JobPostingForm';
import HRJobList from './pages/hr pages/HRJobReport';
import HrReport from './pages/admin pages/HrReport';
import ForgotPassword from './components/ForgotPassword';
import CandidateForm from './pages/hr pages/CandidatesForm';
import AdminCandidateList from './pages/admin pages/AllCandidatesDetails';
import HRCompanyCandidateReport from './pages/admin pages/HRCompanyCandidateReport';
import HrAnalytics from './pages/admin pages/HrAnalytics';
import AllCandidateData from './pages/hr pages/AllCandidateData';
import RecentData from './pages/hr pages/RecentData';
import DailyTaskReport from './pages/admin pages/DailyTaskReport';
import DailyTaskData from './pages/hr pages/DailyTaskData';
import SalesCompanyDetails from './pages/admin pages/SalesCompanyDetails';
import PlacedData from './pages/hr pages/PlacedData';
import AdminCandidateForm from './pages/admin pages/AdminCandidateForm';
import MasterSheet from './pages/admin pages/MasterSheet';
import UserManagement from './pages/admin pages/UserManagement';
import CompanyManagement from './pages/admin pages/CompanyManagement';
import SalesCompanyCreate from './pages/sales pages/SalesCompanyCreate';
import LeadManagement from './pages/sales pages/LeadManagement';
import DailyTasks from './pages/sales pages/DailyTasks';
import SalesDailyTaskReport from './pages/admin pages/SalesDailyTaskReport';
import AuditDashboard from './pages/admin pages/AuditDashboard';
import IpWhitelistPanel from './pages/admin pages/IpWhitelistPanel';
import AccountDepartment from './pages/admin pages/AccountDepartment';
import { API_BASE_URL } from './config/api.config';

// Team Leader Pages
import TLDashboard from './pages/team leader pages/TLDashboard';
import TLSettings from './pages/team leader pages/TLSettings';
import TLProfilePage from './pages/team leader pages/TLProfilePage';
import TLHrReport from './pages/team leader pages/TLHrReport';
import TLAllCandidatesDetails from './pages/team leader pages/TLAllCandidatesDetails';
import TLCandidateForm from './pages/team leader pages/TLCandidateForm';
import TLCandidateDetails from './pages/team leader pages/TLCandidateDetails';
import TLInterviewReport from './pages/team leader pages/TLInterviewReport';
import TLDailyTaskReport from './pages/team leader pages/TLDailyTaskReport';
import TLSalesDailyTaskReport from './pages/team leader pages/TLSalesDailyTaskReport';
import TLMasterSheet from './pages/team leader pages/TLMasterSheet';
import TLHRCompanyCandidateReport from './pages/team leader pages/TLHRCompanyCandidateReport';
import TLSalesCompanyDetails from './pages/team leader pages/TLSalesCompanyDetails';
import TLJobReport from './pages/team leader pages/TLJobReport';

// ── HR Daily Task Guard ────────────────────────────────────────────────────────
// Redirects HR to /daily-hr-task if they haven't created a task today.
// Non-HR roles pass through immediately.
const HrTaskGuard = ({ children }) => {
  const role = sessionStorage.getItem('role');
  const [checked, setChecked] = useState(role !== 'HR');
  const [allowed, setAllowed] = useState(role !== 'HR');

  useEffect(() => {
    if (role !== 'HR') return;
    const token = sessionStorage.getItem('token');
    if (!token) { setAllowed(false); setChecked(true); return; }
    axios.get(`${API_BASE_URL}/dailyTask/hr/today-check`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => { setAllowed(res.data.hasTask); setChecked(true); })
      .catch(() => { setAllowed(true); setChecked(true); });
  }, [role]);

  if (!checked) return null;
  if (!allowed) return <Navigate to="/daily-hr-task" replace />;
  return children;
};

// Global axios interceptor — catches 401 "Session has been terminated" from any
// axios call (including direct axios.get/post in HR/Sales pages) and forces logout.
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const msg = error.response.data?.message || '';
      if (
        msg === 'Session has been terminated by an administrator' ||
        msg === 'Token expired. Please login again.' ||
        msg === 'Not authorized'
      ) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('tokenExpiration');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);


const App = () => {
  return (
    <ThemeProvider theme={Theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />
          <Route path="/admin-dashboard" element={<Navigate to="/master-dashboard" />} />
          <Route path="/master-dashboard" element={<MasterDashboard />} />
          <Route path="/sales-dashboard" element={<SalesDashboard />} />
          <Route path="/sales-master-dashboard" element={<SalesMasterDashboard />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin-settings" element={<AdminSetting />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sales-profile" element={<SalesProfilePage />} />
          <Route path="/hr-profile" element={<HrProfilePage />} />
          <Route path="/Hr-dashboard" element={<HrTaskGuard><AssignedData /></HrTaskGuard>} />
          <Route path="/hr-master-dashboard" element={<HrTaskGuard><HRMasterDashboard /></HrTaskGuard>} />
          <Route path="/jobopennings" element={<JobOpennings />} />
          <Route path="/job-report" element={<JobReport />} />
          <Route path="/candidate-list" element={<HrTaskGuard><JobListWithCandidates /></HrTaskGuard>} />
          <Route path="/job-form" element={<JobPostingForm />  }/>
          <Route path="/hr-job-post-report" element={<HrTaskGuard><HRJobList /></HrTaskGuard>} />
          <Route path="/hr-report" element={<HrReport/>  }/>
          <Route path="/forgot-password" element={<ForgotPassword/>  }/>
          <Route path="/all-candidates-form" element={<CandidateForm/>  }/>
          <Route path="/can-rep" element={<AdminCandidateList/>  }/>
          <Route path="/master-sheet" element={<MasterSheet/>  }/>
          <Route path="/user-management" element={<UserManagement/>  }/>
          <Route path="/company-management" element={<CompanyManagement />} />
          <Route path="/sales-company-create" element={<SalesCompanyCreate />} />
          <Route path="/lead-management" element={<LeadManagement />} />
          

<Route path="/hr/:hrId" element={<HRCompanyCandidateReport />} />
<Route path="/sales/:salesId/:salesName" element={<SalesCompanyDetails />} />
          <Route path="/hr-analytics" element={<HrAnalytics />} />
<Route path="/hr-candidates" element={<HrTaskGuard><AllCandidateData /></HrTaskGuard>} />
<Route path="/recent-data" element={<HrTaskGuard><RecentData /></HrTaskGuard>} />
<Route path="/placed-candidate-list" element={<HrTaskGuard><PlacedData /></HrTaskGuard>} />
<Route path="/daily-task-report" element={<DailyTaskReport/>  }/>
<Route path="/daily-hr-task" element={<DailyTaskData/>  }/>
<Route path="/candidate-form" element={<AdminCandidateForm/>  }/>
<Route path="/daily-sales-task" element={<DailyTasks/>  }/>
<Route path="/sales-daily-task-report" element={<SalesDailyTaskReport/>  }/>
<Route path="/audit-dashboard" element={<AuditDashboard />} />
<Route path="/ip-whitelist" element={<IpWhitelistPanel />} />
<Route path="/account-department" element={<AccountDepartment />} />

          {/* Team Leader Routes */}
          <Route path="/tl-dashboard" element={<TLDashboard />} />
          <Route path="/tl-job-report" element={<TLJobReport />} />
          <Route path="/tl-settings" element={<TLSettings />} />
          <Route path="/tl-profile" element={<TLProfilePage />} />
          <Route path="/tl-hr-report" element={<TLHrReport />} />
          <Route path="/tl-can-rep" element={<TLAllCandidatesDetails />} />
          <Route path="/tl-candidate-form" element={<TLCandidateForm />} />
          <Route path="/tl-candidate-details" element={<TLCandidateDetails />} />
          <Route path="/tl-interview-repo" element={<TLInterviewReport />} />
          <Route path="/tl-daily-task-report" element={<TLDailyTaskReport />} />
          <Route path="/tl-sales-daily-task-report" element={<TLSalesDailyTaskReport />} />
          <Route path="/tl-master-sheet" element={<TLMasterSheet />} />
          <Route path="/tl-hr/:hrId" element={<TLHRCompanyCandidateReport />} />
          <Route path="/tl-sales/:salesId/:salesName" element={<TLSalesCompanyDetails />} />

        </Routes>
         <ToastContainer />

      </Router>

    </ThemeProvider>
  );
};

export default App;

