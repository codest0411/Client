import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner';

export default function AdminGuard({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAuth = () => {
      try {
        // Only check localStorage - no Supabase dependency
        const adminAuth = localStorage.getItem('adminAuthenticated');
        const adminEmail = localStorage.getItem('adminEmail');
        const loginTime = localStorage.getItem('adminLoginTime');

        console.log('Admin Auth Check:', { adminAuth, adminEmail, loginTime });

        if (adminAuth === 'true' && adminEmail === 'admin@transcripto.com' && loginTime) {
          // Check if login is not older than 24 hours
          const loginDate = new Date(loginTime);
          const now = new Date();
          const hoursDiff = (now - loginDate) / (1000 * 60 * 60);

          console.log('Session age (hours):', hoursDiff);

          if (hoursDiff < 24) {
            setIsAuthenticated(true);
            setError('');
          } else {
            // Session expired
            console.log('Session expired, clearing data');
            localStorage.removeItem('adminAuthenticated');
            localStorage.removeItem('adminEmail');
            localStorage.removeItem('adminLoginTime');
            setError('Admin session expired. Please login again.');
            setTimeout(() => {
              window.location.href = '/admin-login';
            }, 2000);
          }
        } else {
          console.log('No valid admin session found');
          setError('Admin authentication required. Redirecting to login...');
          setTimeout(() => {
            window.location.href = '/admin-login';
          }, 2000);
        }
      } catch (err) {
        console.error('Admin auth error:', err);
        setError('Authentication error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    checkAdminAuth();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-300 mt-4">Checking admin authentication...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-red-600 text-white px-6 py-4 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-red-100">{error}</p>
            <button
              onClick={() => window.location.href = '/admin-login'}
              className="mt-4 bg-white text-red-600 px-4 py-2 rounded hover:bg-gray-100 transition-colors"
            >
              Go to Admin Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : null;
} 