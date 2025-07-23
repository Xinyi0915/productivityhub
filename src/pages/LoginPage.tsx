import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { login, clearError, loginWithInitialization } from '../store/slices/authSlice';
import { AppDispatch, RootState } from '../store';
import { clearReduxPersistedState } from '../utils/storage';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    
    if (!password) {
      setFormError('Password is required');
      setLocalLoading(false);
      return;
    }
    
    try {
      // Use the loginWithInitialization function instead of login
      await dispatch(loginWithInitialization({ email, password }));
      
      // Clear any existing persisted state to prevent data leakage between accounts
      // Do this after successful login
      clearReduxPersistedState();
      
      // If successful, navigate to tasks page
      navigate('/tasks');
    } catch (error) {
      console.error('Login failed:', error);
      setFormError(error instanceof Error ? error.message : 'Login failed. Please check your credentials.');
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
          Sign in to your account
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
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
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-primary w-full"
                />
              </div>
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
                {localLoading ? 'Loading...' : 'Sign In'}
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
                  Don't have an account?
                </span>
              </div>
            </div>

            <div className="mt-6">
              <Link to="/register">
                <button
                  type="button"
                  className="w-full btn-secondary"
                >
                  Create Account
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 