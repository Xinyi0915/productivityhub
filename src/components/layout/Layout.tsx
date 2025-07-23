import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import DueDateChecker from '../notifications/DueDateChecker';
import FloatingAIButton from '../ai/FloatingAIButton';

const Layout: React.FC = () => {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);
  const location = useLocation();
  const isAIAssistantPage = location.pathname === '/ai-assistant';

  return (
    <div className="min-h-screen bg-gray-50">
      <DueDateChecker />
      <div className="flex h-screen">
        <Sidebar
          isExpanded={isSidebarExpanded}
          onToggle={() => setIsSidebarExpanded(!isSidebarExpanded)}
        />
        <div className="flex-1 flex flex-col">
          <Navbar />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
      {!isAIAssistantPage && <FloatingAIButton />}
    </div>
  );
};

export default Layout; 