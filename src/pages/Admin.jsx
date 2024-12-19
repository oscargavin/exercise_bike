import React from 'react';
import Navbar from '../components/Navbar';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const { user, loading } = useAuth();

  // Show loading state while auth is initializing
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-center">
          <div className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      </main>
    </div>;
  }

  // Redirect non-admin users
  if (!user?.admin) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Settings</h1>
        {/* Admin content will go here */}
      </main>
    </div>
  );
};

export default Admin;