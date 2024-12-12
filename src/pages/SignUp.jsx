import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, ArrowLeft, Mail, User, Ruler, Scale, Calendar, Lock } from 'lucide-react';

// Password requirements component
const PasswordRequirements = ({ password }) => {
  const requirements = [
    { label: 'At least 8 characters', test: pwd => pwd.length >= 8 },
    { label: 'Contains uppercase letter', test: pwd => /[A-Z]/.test(pwd) },
    { label: 'Contains lowercase letter', test: pwd => /[a-z]/.test(pwd) },
    { label: 'Contains number', test: pwd => /\d/.test(pwd) },
    { label: 'Contains special character', test: pwd => /[!@#$%^&*]/.test(pwd) },
  ];

  return (
    <div className="mt-2 space-y-2">
      {requirements.map((req, index) => (
        <div
          key={index}
          className={`flex items-center text-xs ${
            req.test(password) ? 'text-green-400' : 'text-gray-400'
          }`}
        >
          <div className={`w-1.5 h-1.5 rounded-full mr-2 ${
            req.test(password) ? 'bg-green-400' : 'bg-gray-400'
          }`} />
          {req.label}
        </div>
      ))}
    </div>
  );
};

const SignUp = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    age: '',
    height: '',
    weight: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        navigate('/login', { 
          state: { message: 'Account created successfully. Please log in.' }
        });
      } else {
        setError(data.message || 'Error creating account');
        if (data.errors) {
          setError(data.errors.join('\n'));
        }
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const validateStep = () => {
    switch(step) {
      case 1:
        if (!formData.email || !formData.password) {
          setError('Please fill in all fields');
          return false;
        }
        // Perform basic password validation
        const passwordValidation = {
          minLength: formData.password.length >= 8,
          hasUpperCase: /[A-Z]/.test(formData.password),
          hasLowerCase: /[a-z]/.test(formData.password),
          hasNumbers: /\d/.test(formData.password),
          hasSpecialChar: /[!@#$%^&*]/.test(formData.password),
        };

        if (!Object.values(passwordValidation).every(Boolean)) {
          setError('Please meet all password requirements');
          return false;
        }
        break;
      case 2:
        if (!formData.name) {
          setError('Please enter your name');
          return false;
        }
        break;
      default:
        return true;
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      setError('');
      setStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setError('');
    setStep(prev => prev - 1);
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Email"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                />
              </div>
              <PasswordRequirements password={formData.password} />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              required
            />
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Age"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="Height (cm)"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
            <div className="relative">
              <Scale className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Weight (kg)"
                className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                required
              />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1a1f2e] p-4">
      <div className="w-full max-w-md bg-[#1f2937]/90 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-800 overflow-hidden">
        <div className="p-8">
          <div className="mb-8 text-center">
            <img 
              src="/orbital_cycle.gif" 
              alt="Orbital Cycle Logo" 
              className="h-16 mx-auto mb-4"
            />
            <h2 className="text-2xl font-semibold text-white">Create Account</h2>
            <p className="text-gray-400 mt-2">Step {step} of 3</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/50 rounded-lg text-red-500 text-sm">
              {error}
            </div>
          )}

          <div className="relative">
            {/* Progress bar */}
            <div className="h-1 bg-gray-700 rounded-full mb-8">
              <div 
                className="h-1 bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStep()}

              <div className="flex justify-between pt-4">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center px-4 py-2 text-gray-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                  </button>
                )}
                {step < 3 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex items-center ml-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200"
                  >
                    Next
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex items-center ml-auto px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating...' : 'Create Account'}
                  </button>
                )}
              </div>
            </form>
          </div>

          <p className="mt-8 text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-400 hover:text-blue-300">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;