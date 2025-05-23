import React, { useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import { useNavigate } from 'react-router-dom';

const DashboardContent = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  return (
    <div className="flex flex-col items-center justify-start h-screen text-center pt-24 space-y-8">
      <h2 className="text-3xl font-bold text-blue-900">
        Welcome, {user?.first_name || 'User'} 👋
      </h2>

      <button
        onClick={() => navigate('/start-session')}
        className="w-40 h-40 rounded-full flex items-center justify-center text-white font-bold text-lg bg-blue-800 animate-pulse hover:bg-blue-900"
      >
        Start
      </button>
    </div>
  );
};

const Dashboard = () => (
  <AppLayout>
    <DashboardContent />
  </AppLayout>
);

export default Dashboard;
