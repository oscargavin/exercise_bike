import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import SignUp from './pages/SignUp';
import Profile from './pages/Profile';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    console.log("ProtectedRoute: Loading...");
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log("ProtectedRoute: User not authenticated, redirecting to /login");
    return <Navigate to="/login" />;
  }

  console.log("ProtectedRoute: User authenticated, rendering child components");
  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;