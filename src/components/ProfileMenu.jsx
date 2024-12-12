import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { User, LogOut, Settings } from 'lucide-react';

const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navigateToProfile = () => {
    setIsOpen(false);
    navigate('/profile');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full border border-gray-700 hover:border-gray-500 transition-colors overflow-hidden"
      >
        {user?.profile_picture ? (
          <img
            src={user.profile_picture}
            alt="Profile"
            className="w-full h-full object-cover"
          />
        ) : (
          <User className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-30"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 py-2 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-40">
            <div className="px-4 py-2 border-b border-gray-700">
              <p className="text-sm text-white font-medium truncate">{user?.name}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email}</p>
            </div>
            <button
              onClick={navigateToProfile}
              className="flex items-center w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <Settings className="w-4 h-4 mr-2" />
              Profile Settings
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700 hover:text-red-300"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ProfileMenu;