import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(data.message);
        // For development only:
        if (data.debug) {
          console.log('Reset link:', data.debug.resetLink);
        }
      } else {
        setError(data.message || 'An error occurred');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e] p-4">
      <div className="w-full max-w-md p-8 bg-[#1f2937]/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-800">
        <div className="mb-8 text-center">
          <img
            src="/orbital_cycle.gif"
            alt="Orbital Cycle Logo"
            className="h-16 mx-auto mb-4"
          />
          <h2 className="text-2xl font-semibold text-white">Reset Password</h2>
          <p className="text-gray-400 mt-2">
            Enter your email to receive a password reset link
          </p>
        </div>

        {(error || message) && (
          <div className={`mb-6 p-3 rounded-lg text-sm ${
            error 
              ? 'bg-red-500/10 border border-red-500/50 text-red-500'
              : 'bg-green-500/10 border border-green-500/50 text-green-500'
          }`}>
            {error || message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Enter your email"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center py-3 px-4 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>

          <Link 
            to="/login"
            className="flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors mt-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </Link>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;