import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Loader2, Search, Shield, ShieldOff, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

const Admin = () => {
  const { user, loading } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/admin/users', {
          headers: {
            'Authorization': `Bearer ${user.token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }

        const data = await response.json();
        setUsers(data.users);
        setFilteredUsers(data.users);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.token) {
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    const filtered = users.filter(u => 
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const toggleAdmin = async (userId, currentAdminStatus) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/toggle-admin`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ admin: !currentAdminStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update user');
      }

      const updatedUser = await response.json();
      setUsers(users.map(u => 
        u.id === userId ? { ...u, admin: !currentAdminStatus } : u
      ));
    } catch (err) {
      console.error('Error updating user:', err);
      setError('Failed to update user admin status');
    }
  };

  const handleExportSessions = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/sessions/export', {
        headers: {
          'Authorization': `Bearer ${user.token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch session data');
      }

      const data = await response.json();
      
      // Create CSV content
      let csvContent = '';
      
      // Process each session
      data.sessions.forEach(session => {
        // Add session metadata
        csvContent += `\nSession ID,${session.session_id}\n`;
        csvContent += `User Email,${session.user_email}\n`;
        csvContent += `User Name,"${session.user_name}"\n`;
        csvContent += `Start Time,${session.started_at}\n`;
        csvContent += `Exercise Time (seconds),${session.exercise_time}\n\n`;
        
        // Add time series data headers
        csvContent += 'Timestamp,Speed (km/h),Cadence (rpm),Resistance (%),Heart Rate (bpm)\n';
        
        // Add time series data rows
        for (let i = 0; i < session.timestamps.length; i++) {
          csvContent += [
            session.timestamps[i],
            session.speed_data[i],
            session.cadence_data[i],
            session.resistance_data[i],
            session.heart_rate_data[i]
          ].join(',') + '\n';
        }
        
        // Add separator between sessions
        csvContent += '\n\n';
      });
      
      // Create and download the CSV file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `exercise_sessions_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error exporting sessions:', err);
      setError('Failed to export session data');
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while auth is initializing
  if (loading) {
    return <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-center">
          <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
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

        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-lg text-white">User Management</span>
                <button
                  onClick={handleExportSessions}
                  disabled={isLoading}
                  className={`flex items-center px-3 py-1 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  {isLoading ? 'Exporting...' : 'Export Sessions'}
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-gray-700/50 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-red-400 text-center py-4">{error}</div>
            ) : (
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="space-y-2">
                  {filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                          {u.profile_picture ? (
                            <img
                              src={u.profile_picture}
                              alt={u.name}
                              className="w-full h-full rounded-full object-cover"
                            />
                          ) : (
                            <span className="text-lg text-gray-300">
                              {u.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white">
                            {u.name}
                          </div>
                          <div className="text-xs text-gray-400">
                            {u.email}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => toggleAdmin(u.id, u.admin)}
                        className={`flex items-center px-3 py-1 rounded-lg transition-colors ${
                          u.admin
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {u.admin ? (
                          <>
                            <ShieldOff className="w-4 h-4 mr-2" />
                            Remove Admin
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Make Admin
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Admin;