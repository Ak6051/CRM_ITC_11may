import React from 'react';
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
import AdminSetting from './pages/admin pages/AdminSetting';
import ProfilePage from './pages/admin pages/AdminProfilePage';
import SalesProfilePage from './pages/sales pages/SalesProfilePage';
import HrDashboard from './pages/hr pages/HrDashboard';
import HrProfilePage from './pages/hr pages/HrProfilePage';
import JobOpennings from './pages/sales pages/JobOpennings';
import JobReport from './pages/admin pages/JobReport';
import { Html } from '@mui/icons-material';
import JobListWithCandidates from './pages/hr pages/JobListWithCandidates';
import JobPostingForm from './pages/hr pages/JobPostingForm';
import HRJobList from './pages/hr pages/HRJobReport';
import HrReport from './pages/admin pages/HrReport';
import ForgotPassword from './components/ForgotPassword';
import CandidateForm from './pages/hr pages/CandidatesForm';
import CandidateList from './pages/hr pages/CandidateDetails';
import AdminCandidateList from './pages/admin pages/AdminCandidatesDetails';
import HRCompanyCandidateReport from './pages/admin pages/HRCompanyCandidateReport';
import InterViewReport from './pages/admin pages/InterViewReport';

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
          <Route path="/admin-settings" element={<AdminSetting />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/sales-profile" element={<SalesProfilePage />} />
          <Route path="/hr-profile" element={<HrProfilePage />} />
          <Route path="/hr-dashboard" element={<HrDashboard />} />
          <Route path="/jobopennings" element={<JobOpennings />} />
          <Route path="/job-report" element={<JobReport />} />
          <Route path="/candidate-list" element={<JobListWithCandidates />} />
          <Route path="/job-form" element={<JobPostingForm />  }/>
          <Route path="/hr-job-post-report" element={<HRJobList/>  }/>
          <Route path="/hr-report" element={<HrReport/>  }/>
          <Route path="/forgot-password" element={<ForgotPassword/>  }/>
          <Route path="/all-candidates-form" element={<CandidateForm/>  }/>
          <Route path="/all-candidates" element={<CandidateList/>  }/>
          <Route path="/can-rep" element={<AdminCandidateList/>  }/>
<Route path="/hr/:hrId" element={<HRCompanyCandidateReport />} />
          <Route path="/interview-repo" element={<InterViewReport/>  }/>




        </Routes>
         <ToastContainer />

      </Router>

    </ThemeProvider>
  );
};

export default App;
