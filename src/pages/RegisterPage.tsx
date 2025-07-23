import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, clearError, registerWithInitialization } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { clearReduxPersistedState } from '../utils/storage';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [formError, setFormError] = useState('');
  const [localLoading, setLocalLoading] = useState(false);

  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  
  const { error, user } = useSelector((state: RootState) => state.auth);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/tasks');
    }
    
    // Clear any previous errors when component mounts
    return () => {
      dispatch(clearError());
    };
  }, [user, navigate, dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setLocalLoading(true);
    
    // Validate form
    if (!email || !email.includes('@')) {
      setFormError('Please enter a valid email address');
      setLocalLoading(false);
      return;
    }
    
    if (!password || password.length < 8) {
      setFormError('Password must be at least 8 characters');
      setLocalLoading(false);
      return;
    }
    
    // If username is empty, use the first part of the email as username
    const finalUsername = username.trim() || email.split('@')[0];
    
    try {
      // Use registerWithInitialization instead of register
      await dispatch(registerWithInitialization({
        username: finalUsername,
              email,
        password
      }));
      
      // Clear any existing persisted state to prevent data leakage between accounts
      // Do this after successful registration
      clearReduxPersistedState();
      
      // If successful, navigate to tasks page
      navigate('/tasks');
    } catch (error) {
      console.error('Registration failed:', error);
      setFormError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
      setLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-blue-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-primary-600">
          ProductivityHub
        </h1>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
          Create your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-gray-700"
              >
                Username
              </label>
              <div className="mt-1">
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-primary w-full"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Optional. If left blank, we'll use the first part of your email.
              </p>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-primary w-full"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-primary w-full"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Must be at least 8 characters.
              </p>
            </div>

            {(error || formError) && (
              <div className="text-red-600 text-sm text-center">{error || formError}</div>
            )}

            <div>
              <button
                type="submit"
                disabled={localLoading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {localLoading ? 'Creating account...' : 'Create Account'}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/login">
                <button
                  type="button"
                  className="w-full btn-secondary"
                >
                  Sign In
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 