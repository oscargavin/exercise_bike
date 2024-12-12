import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    // Try sessionStorage first, then localStorage
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    const savedUser = sessionStorage.getItem('user') || localStorage.getItem('user');
    
    if (token && savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    // Include token in the user data
    const userToStore = {
      ...userData,
      token
    };
    setUser(userToStore);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
  };
  

  const updateUser = (userData) => {
    // Keep the existing token when updating user data
    const updatedUser = {
      ...userData,
      token: user.token
    };
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const logout = () => {
    setUser(null);
    // Clear both storages to ensure complete logout
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    navigate('/login');
  };

  const value = {
    user,
    login,
    logout,
    loading,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

