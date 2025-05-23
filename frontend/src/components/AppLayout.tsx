import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-screen overflow-hidden">
    <Sidebar />
    <div className="flex-1 flex flex-col h-full">
      <TopBar />
      <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
        {children}
      </main>
    </div>
  </div>
);

export default AppLayout;
