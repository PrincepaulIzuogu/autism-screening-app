import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import './index.css';

// Pages
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import Reports from './pages/Reports';
import VerifyResetCode from './pages/VerifyResetCode';
import StartSession from './pages/StartSession';
import Screening from './pages/Screening';

// Context
import { AuthProvider } from './context/AuthContext';
import { ChildProfileProvider } from './context/ChildProfileContext';

// Routes
import PrivateRoute from './routes/PrivateRoute';
import RouteCameraStopper from './components/RouteCameraStopper'; // Ensures cleanup on path change
import UploadMedia from './pages/UploadMedia';
import ManageStimuli from './pages/ManageStimuli';


const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChildProfileProvider>
          <RouteCameraStopper /> {/* Global camera cleanup logic */}

          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/verify-reset-code" element={<VerifyResetCode />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={<PrivateRoute><Dashboard /></PrivateRoute>}
            />
            <Route
              path="/reports"
              element={<PrivateRoute><Reports /></PrivateRoute>}
            />
            <Route
              path="/start-session"
              element={<PrivateRoute><StartSession /></PrivateRoute>}
            />
            <Route
              path="/screening"
              element={<PrivateRoute><Screening /></PrivateRoute>}
            />
             <Route
              path="/upload"
              element={<PrivateRoute><UploadMedia /></PrivateRoute>}
            />
            <Route
              path="/manage-stimuli"
              element={<PrivateRoute><ManageStimuli /></PrivateRoute>}
            />
          </Routes>

          <Toaster position="top-right" />
        </ChildProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
