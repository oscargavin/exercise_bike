import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Loader2, Search, Shield, ShieldOff, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import JSZip from 'jszip';

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
        
        // Create sessions metadata CSV
        let sessionsContent = 'session_id,user_id,user_email,user_name,started_at,exercise_time\n';
        
        // Create time series CSV
        let timeseriesContent = 'session_id,timestamp,speed,cadence,resistance,heart_rate\n';
        
        // Process each session
        data.sessions.forEach(session => {
            // Add session metadata row
            sessionsContent += `${session.session_id},${session.user_id},${session.user_email},"${session.user_name}",${session.started_at},${session.exercise_time}\n`;
            
            // Add time series rows
            for (let i = 0; i < session.timestamps.length; i++) {
                timeseriesContent += `${session.session_id},${session.timestamps[i]},${session.speed_data[i]},${session.cadence_data[i]},${session.resistance_data[i]},${session.heart_rate_data[i]}\n`;
            }
        });
        
        // Create and download both files in a zip
        const zip = new JSZip();
        
        // Add files to zip
        zip.file('sessions.csv', sessionsContent);
        zip.file('timeseries.csv', timeseriesContent);
        
        // Generate and download zip
        const zipContent = await zip.generateAsync({ type: 'blob' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(zipContent);
        link.setAttribute('href', url);
        link.setAttribute('download', `exercise_data_${new Date().toISOString().split('T')[0]}.zip`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);  // Clean up the URL object
        
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
    <div className="min-h-screen bg-[#0f1116]">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <h1 className="text-2xl font-bold text-white mb-6">Admin Settings</h1>

        <Card className="bg-[#1a1d24] border-gray-800">
          <CardHeader className="space-y-4">
            <CardTitle className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-x-4 sm:space-y-0">
                <span className="text-lg text-white">User Management</span>
                <button
                  onClick={handleExportSessions}
                  disabled={isLoading}
                  className={`flex items-center justify-center px-4 py-2 text-sm bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors w-full sm:w-auto ${
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
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#262931] border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
              <div className="max-h-[calc(100vh-20rem)] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
                <div className="space-y-3">
                  {filteredUsers.map(u => (
                    <div
                      key={u.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#262931] rounded-lg hover:bg-[#2b2f38] transition-colors gap-4 sm:gap-0"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
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
                        className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors w-full sm:w-auto ${
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