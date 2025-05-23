import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Upload, LogOut, Menu, Settings } from 'lucide-react'; // 👈 Add Settings icon for "Manage Stimuli"
import { stopCameraResources } from '../utils/cameraManager';

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(true);
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    stopCameraResources();
    navigate(path);
  };

  const handleLogout = () => {
    stopCameraResources();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={`bg-blue-900 text-white min-h-screen flex flex-col justify-between transition-all duration-300 ${isOpen ? 'w-64' : 'w-20'}`}>
      <div className="p-4 space-y-6">
        {/* Toggle button */}
        <button onClick={toggleSidebar} className="text-white focus:outline-none mb-6">
          <Menu size={24} />
        </button>

        <button
          onClick={() => handleNavigation('/dashboard')}
          className="flex items-center space-x-3 hover:bg-blue-700 px-3 py-2 rounded w-full text-left"
        >
          <LayoutDashboard size={20} />
          {isOpen && <span>Dashboard</span>}
        </button>

        <button
          onClick={() => handleNavigation('/reports')}
          className="flex items-center space-x-3 hover:bg-blue-700 px-3 py-2 rounded w-full text-left"
        >
          <FileText size={20} />
          {isOpen && <span>Reports</span>}
        </button>

        <button
          onClick={() => handleNavigation('/upload')}
          className="flex items-center space-x-3 hover:bg-blue-700 px-3 py-2 rounded w-full text-left"
        >
          <Upload size={20} />
          {isOpen && <span>Upload Media</span>}
        </button>

        <button
          onClick={() => handleNavigation('/manage-stimuli')} // 👈 NEW route
          className="flex items-center space-x-3 hover:bg-blue-700 px-3 py-2 rounded w-full text-left"
        >
          <Settings size={20} />
          {isOpen && <span>Manage Stimuli</span>}
        </button>
      </div>

      <div className="p-4">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-white font-semibold transition"
        >
          <LogOut size={20} />
          {isOpen && <span>Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
