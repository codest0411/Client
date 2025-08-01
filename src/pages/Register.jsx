import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    console.log('Attempting registration with email:', email.trim());

    try {
      // Step 1: Create user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
      password,
        options: { 
          emailRedirectTo: `${window.location.origin}/login` 
        }
      });

      console.log('Supabase auth response:', { authData, authError });

      if (authError) {
        console.error('Registration error:', authError);
        setError(authError.message || 'Registration failed. Please try again.');
        return;
      }

      if (authData.user) {
        // Step 2: Create user profile in database
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            {
              id: authData.user.id,
              email: email.trim(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ]);

        if (profileError) {
          console.error('Profile creation error:', profileError);
          // Don't fail registration if profile creation fails
          console.warn('User created but profile creation failed:', profileError);
        }

        setSuccess('Registration successful! Please check your email to verify your account.');
        console.log('Registration successful:', authData.user?.email);
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError('Registration failed. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected registration error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
          setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 border border-gray-200 dark:border-gray-700 mt-12">
      <h2 className="text-2xl font-extrabold mb-6 text-center text-gray-900 dark:text-gray-100">Sign Up</h2>
      
      <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
            placeholder="Enter your password (min 6 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
            className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Confirm Password
          </label>
        <input
            id="confirm"
          type="password"
            placeholder="Confirm your password"
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
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
              : 'bg-green-600 hover:bg-green-700'
          } text-white`}
          disabled={loading}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing up...
            </div>
          ) : (
            'Sign Up'
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
        Already have an account?{' '}
        <span 
          className="text-blue-600 hover:underline cursor-pointer font-medium" 
          onClick={() => navigate('/login')}
        >
          Login
        </span>
      </div>
    </div>
  );
} 