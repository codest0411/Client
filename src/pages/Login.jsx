import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/transcription');
    }
  }, [user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    console.log('Attempting login with email:', email.trim());

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email: email.trim(), 
        password 
      });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Login error:', error);
        
        // Handle specific error cases
        if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the verification link before logging in.');
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. Please check your credentials.');
        } else {
          setError(error.message || 'Login failed. Please check your credentials.');
        }
      } else {
        setSuccess('Login successful! Redirecting...');
        console.log('Login successful:', data.user?.email);
        
        // Check if user profile exists
        if (data.user) {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          if (profileError && profileError.code !== 'PGRST116') {
            console.warn('Profile fetch error:', profileError);
          } else {
            console.log('User profile:', profile);
          }
        }
        
        // Navigation will happen automatically via useEffect
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
    setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 mt-12">
      <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900 dark:text-gray-100">Login</h2>
      
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
        <input
            id="email"
          type="email"
            placeholder="Enter your email"
          value={email}
          onChange={e => setEmail(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Password
          </label>
        <input
            id="password"
          type="password"
            placeholder="Enter your password"
          value={password}
          onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
            disabled={loading}
        />
        </div>

        <button
          type="submit"
          className={`w-full p-3 rounded-lg font-semibold shadow transition-colors ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Logging in...
            </div>
          ) : (
            'Login'
          )}
        </button>

        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
          </div>
        )}
      </form>

      <div className="mt-6 text-center text-gray-600 dark:text-gray-300">
        Don&apos;t have an account?{' '}
        <span 
          className="text-blue-600 hover:underline cursor-pointer font-medium" 
          onClick={() => navigate('/register')}
        >
          Sign up
        </span>
      </div>
    </div>
  );
} 