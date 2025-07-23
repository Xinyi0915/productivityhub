import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';

interface SidebarProps {
  onToggle?: () => void;
  isExpanded: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onToggle, isExpanded }) => {
  const user = useSelector((state: RootState) => state.auth.user);
  // Add key to force re-render when coins change
  const userCoins = user?.coins || 0;

  const navItems = [
    { path: '/tasks', label: 'Tasks', icon: '📝' },
    { path: '/timer', label: 'Timer', icon: '⏱️' },
    { path: '/habits', label: 'Habits', icon: '🏃‍♂️' },
    { path: '/calendar', label: 'Calendar', icon: '📅' },
    { path: '/analytics', label: 'Analytics', icon: '📈' },
    { path: '/garden', label: 'Garden', icon: '🌱' },
    { path: '/ai-assistant', label: 'AI Assistant', icon: '🤖' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  return (
    <aside 
      className={`bg-blue-50 h-full shadow-lg flex flex-col transition-all duration-300 ease-in-out
        ${isExpanded ? 'w-64' : 'w-16'}`}
    >
      {/* Header */}
      <div className={`flex items-center p-4 ${isExpanded ? 'justify-between' : 'justify-center'}`}>
        <span className={`text-xl font-bold text-blue-600 transition-all duration-300 ${
          isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 w-0'
        }`}>
          ProductivityHub
        </span>
        <button
          onClick={onToggle}
          className={`p-2 rounded-lg hover:bg-blue-100 transition-transform duration-300 ${
            isExpanded ? 'rotate-0' : '-rotate-180'
          }`}
        >
          <svg
            className="w-6 h-6 text-gray-700"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto">
        <div className={`space-y-2 ${isExpanded ? 'px-4' : 'px-2'}`}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center overflow-hidden ${
                  isExpanded ? 'space-x-3 px-4' : 'justify-center'
                } py-2 rounded-lg transition-all duration-300 ${
                  isActive
                    ? 'bg-blue-100 text-gray-700'
                    : 'text-gray-700 hover:bg-blue-100'
                }`
              }
              onClick={() => {
                if (onToggle && window.innerWidth < 1024) {
                  onToggle();
                }
              }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className={`font-medium whitespace-nowrap transition-all duration-300 ${
                isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
              }`}>
                {item.label}
              </span>
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer with Coins */}
      {user && (
        <div className={`p-4 border-t border-blue-100`}>
          <div className={`flex items-center overflow-hidden ${
            isExpanded ? 'space-x-2 px-4' : 'justify-center'
          } py-2 bg-blue-100 rounded-lg`}>
            <span className="text-yellow-500 flex-shrink-0">🪙</span>
            <span className={`font-medium whitespace-nowrap transition-all duration-300 text-gray-700 ${
              isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0'
            }`}>
              {userCoins} coins
            </span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar; 