import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
  
    useEffect(() => {
      const checkAuthStatus = async () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const response = await fetch('/api/protected-test', {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            });
    
            if (!response.ok) {
              const errorData = await response.json()
              if (errorData.code === "token_expired" || errorData.code === "token_invalid") {
                logout();
                return;
              }
              throw new Error("Token check failed")
            }
    
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
              const parsedUser = JSON.parse(savedUser);
              const userWithDefaults = {
                ...parsedUser,
                show_insights: parsedUser.show_insights ?? true,
                admin: parsedUser.admin ?? false  // Add this line
              };
              setUser(userWithDefaults);
            }
          } catch (error) {
            console.error("Authentication check error:", error);
            logout();
          }
        }
        setLoading(false);
      };
      checkAuthStatus();
    }, []);

    const login = (userData, token) => {
      const userToStore = {
        ...userData,
        token,
        show_insights: userData.show_insights ?? true,
        admin: userData.admin ?? false
      };
      
      setUser(userToStore);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userToStore));
    };
  

  const updateUser = (userData) => {
    // Keep the existing token when updating user data
    const updatedUser = {
      ...userData,
      token: user?.token // Make sure token is preserved
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

