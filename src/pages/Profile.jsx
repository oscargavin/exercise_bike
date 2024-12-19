import React, { useState, useEffect } from 'react';
import ExportDataButton from '../components/ExportDataButton';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Camera, Save, ArrowLeft } from 'lucide-react';

const Profile = () => {
    const navigate = useNavigate();
    const { user, updateUser } = useAuth();
    const [formData, setFormData] = useState({
      name: user?.name || '',
      email: user?.email || '',
      age: user?.age || '',
      height: user?.height || '',
      weight: user?.weight || '',
    });
    const [selectedImage, setSelectedImage] = useState(user?.profile_picture || null);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
  
    useEffect(() => {
      const fetchUserData = async () => {
        try {
          if (!user?.token) {
            navigate('/login');
            return;
          }
  
          const response = await fetch('/api/user/profile', {
            headers: {
              'Authorization': `Bearer ${user.token}`
            }
          });
          
          if (!response.ok) {
            if (response.status === 401) {
              navigate('/login');
              return;
            }
            throw new Error('Failed to fetch user data');
          }
          
          const data = await response.json();
          setFormData({
            name: data.user.name || '',
            email: data.user.email || '',
            age: data.user.age || '',
            height: data.user.height || '',
            weight: data.user.weight || '',
          });
          setSelectedImage(data.user.profile_picture || null);
        } catch (err) {
          console.error('Error fetching user data:', err);
          setError('Failed to load profile data');
        }
      };
  
      if (user) {
        fetchUserData();
      }
    }, [navigate, user]);  

const compressImage = async (base64String, maxSizeMB = 1) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64String;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        // Calculate new dimensions while maintaining aspect ratio
        const maxDimension = 800;
        if (width > height && width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
  
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Adjust quality based on original file size
        let quality = 0.7;
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        
        resolve(compressedBase64);
      };
    });
  };
  
  // Then modify the handleImageChange function in your Profile component:
  
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10000000) { // 10MB limit for initial file
        setError('Image size must be less than 10MB');
        return;
      }
      
      try {
        const reader = new FileReader();
        reader.onloadend = async () => {
          const compressedImage = await compressImage(reader.result);
          setSelectedImage(compressedImage);
          setIsDirty(true);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Error processing image. Please try a different image.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setIsDirty(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isDirty || !user?.token) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          ...formData,
          profilePicture: selectedImage
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          navigate('/login');
          return;
        }
        throw new Error('Failed to update profile');
      }

      const data = await response.json();
      updateUser({
        ...data.user,
        token: user.token  // Preserve the token when updating user data
      });
      setIsDirty(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Failed to update profile');
    } finally {
      setIsLoading(false);
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


  return (
    <div className="min-h-screen bg-[#1a1f2e] py-6 sm:py-12 px-3 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 sm:mb-6 flex items-center text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          <span className="text-sm sm:text-base">Back to Dashboard</span>
        </button>
        
        <div className="bg-[#1f2937]/90 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-800 overflow-hidden">
          <div className="px-4 sm:px-8 py-4 sm:py-6">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Profile Settings</h2>

            {error && (
              <div className="mb-4 sm:mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-center mb-6 sm:mb-8">
              <div className="relative">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-gray-700 overflow-hidden">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                      <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-gray-500" />
                    </div>
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-500 hover:bg-blue-600 p-2 rounded-full cursor-pointer shadow-lg">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Age
                    </label>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleInputChange}
                      className="w-full px-2 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Height (cm)
                    </label>
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleInputChange}
                      className="w-full px-2 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1.5 sm:mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      name="weight"
                      value={formData.weight}
                      onChange={handleInputChange}
                      className="w-full px-2 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-xl bg-gray-800/50 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 sm:pt-4">
                <ExportDataButton token={user?.token} />
                <button
                  type="submit"
                  disabled={!isDirty || isLoading}
                  className={`flex items-center justify-center px-4 sm:px-6 py-2.5 sm:py-3 font-medium rounded-xl text-sm sm:text-base transition-all duration-200 ${
                    !isDirty
                      ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  {isLoading ? 'Saving...' : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;