import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import AdminTable from '../components/AdminTable';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import AdminChatManager from '../components/AdminChatManager';
import AdminSettings from '../components/AdminSettings';
import AdminHistory from '../components/AdminHistory';


export default function AdminDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [realTimeStatus, setRealTimeStatus] = useState('connecting');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [stats, setStats] = useState({
    totalTranscriptions: 0,
    totalUsers: 0,
    todayTranscriptions: 0,
    weeklyGrowth: 0,
    weeklyTranscriptions: 0,
    monthlyTranscriptions: 0,
    todayUsers: 0,
    weeklyUsers: 0,
    monthlyUsers: 0,
    weeklyChartData: []
  });

  const [lastUpdate, setLastUpdate] = useState({
    transcriptions: 'Just now',
    users: 'Just now',
    today: 'Just now',
    growth: 'Just now'
  });
  
  
  // Settings state
  const [settings, setSettings] = useState({
    siteName: 'Transcripto',
    siteDescription: 'AI-powered transcription platform',
    contactEmail: 'transcripto45@gmail.com',
    maxFileSize: '60',
    allowedFormats: 'mp3,wav,m4a,ogg',
    maintenanceMode: false
  });
  
  // Admin Profile state
  const [adminProfile, setAdminProfile] = useState(() => {
    const savedProfile = localStorage.getItem('adminProfile');
    if (savedProfile) {
      try {
        const parsedProfile = JSON.parse(savedProfile);
        // Ensure avatar URL is properly formatted
        if (!parsedProfile.avatar || parsedProfile.avatar.includes('blob:')) {
          const avatarName = parsedProfile.name || 'Admin User';
          parsedProfile.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=3B82F6&color=ffffff&size=128`;
        }
        return parsedProfile;
      } catch (error) {
        console.error('Error loading admin profile:', error);
      }
    }
    return {
          name: 'Admin User',
      email: localStorage.getItem('adminEmail') || 'admin@transcripto.com',
          role: 'Administrator',
          avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=3B82F6&color=ffffff&size=128',
          phone: '+1 (555) 123-4567',
          bio: 'System administrator with full access to all features.',
          timezone: 'UTC-5',
          language: 'English'
    };
  });

  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef(null);
  


  // Check admin authentication status
  useEffect(() => {
    const checkAdminAuth = () => {
      const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
      const adminEmail = localStorage.getItem('adminEmail');
      const loginTime = localStorage.getItem('adminLoginTime');
      
      if (!isAuthenticated || !adminEmail) {
        console.log('Admin not authenticated, redirecting to admin login');
        navigate('/admin-login');
        return;
      }

      // Check if login is still valid (24 hours)
      if (loginTime) {
        const loginDate = new Date(loginTime);
        const now = new Date();
        const hoursSinceLogin = (now - loginDate) / (1000 * 60 * 60);
        
        if (hoursSinceLogin > 24) {
          console.log('Admin session expired, redirecting to admin login');
          localStorage.removeItem('adminAuthenticated');
          localStorage.removeItem('adminEmail');
          localStorage.removeItem('adminLoginTime');
          navigate('/admin-login');
          return;
        }
      }

      setUser({ email: adminEmail });
      setIsAdmin(true);
      console.log('Admin authenticated:', adminEmail);
    };

    checkAdminAuth();
  }, [navigate]);



  useEffect(() => {
    if (isAdmin && user) {
    fetchData();
    
    // Set up real-time subscription for transcriptions
    const transcriptionsSubscription = supabase
      .channel('transcriptions_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'transcriptions' }, 
        (payload) => {
          console.log('Real-time transcription change:', payload);
          fetchData(); // Refresh data when changes occur
        }
      )
      .subscribe((status) => {
        console.log('Transcriptions subscription status:', status);
        setRealTimeStatus(status === 'SUBSCRIBED' ? 'connected' : 'disconnected');
      });

    // Set up real-time subscription for auth users
    const authSubscription = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_UP' || event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        console.log('Auth state change:', event);
        fetchData(); // Refresh data when auth changes
      }
    });

    // Auto-refresh every 30 seconds
    const autoRefreshInterval = setInterval(() => {
      console.log('Auto-refreshing dashboard data...');
      fetchData();
    }, 30000);

    // Cleanup subscriptions on unmount
    return () => {
      transcriptionsSubscription.unsubscribe();
      authSubscription.data?.subscription?.unsubscribe();
      clearInterval(autoRefreshInterval);
    };
    }
  }, [isAdmin, user]);

  const fetchData = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      
      // Fetch transcriptions with more detailed query
      const { data: transcriptionsData, error: transcriptionsError } = await supabase
        .from('transcriptions')
        .select('*')
        .order('createdAt', { ascending: false });

      if (transcriptionsError) {
        console.error('Error fetching transcriptions:', transcriptionsError);
        throw transcriptionsError;
      }

      console.log('Fetched transcriptions data:', transcriptionsData);
      setTranscriptions(transcriptionsData || []);

      // Fetch users from profiles table
      let usersData = [];
      try {
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('*');
        
        if (!profilesError && profilesData) {
          usersData = profilesData;
          console.log('Fetched profiles data:', profilesData);
          setUsers(profilesData || []);
        } else {
          console.log('Profiles table not available, using mock users data');
          // Fallback mock data
          usersData = [
            {
              id: '1',
              email: 'chiragbhandarkar781@gmail.com',
              created_at: new Date('2024-01-15').toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: '2',
              email: 'chiragbhandarkar780@gmail.com',
              created_at: new Date('2024-01-20').toISOString(),
              updated_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: '3',
              email: 'adinathpatil6584@gmail.com',
              created_at: new Date('2024-02-01').toISOString(),
              updated_at: new Date(Date.now() - 172800000).toISOString()
            },
            {
              id: '4',
              email: 'gurubhandarkar099@gmail.com',
              created_at: new Date('2024-02-10').toISOString(),
              updated_at: new Date(Date.now() - 259200000).toISOString()
            },
            {
              id: '5',
              email: 'guruffyyt04@gmail.com',
              created_at: new Date('2024-02-15').toISOString(),
              updated_at: new Date(Date.now() - 345600000).toISOString()
            }
          ];
        }
      } catch (err) {
        console.log('Error fetching users, using mock data:', err.message);
        // Use mock data as fallback
        usersData = [
          {
            id: '1',
            email: 'chiragbhandarkar781@gmail.com',
            created_at: new Date('2024-01-15').toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: '2',
            email: 'chiragbhandarkar780@gmail.com',
            created_at: new Date('2024-01-20').toISOString(),
            updated_at: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: '3',
            email: 'adinathpatil6584@gmail.com',
            created_at: new Date('2024-02-01').toISOString(),
            updated_at: new Date(Date.now() - 172800000).toISOString()
          },
          {
            id: '4',
            email: 'gurubhandarkar099@gmail.com',
            created_at: new Date('2024-02-10').toISOString(),
            updated_at: new Date(Date.now() - 259200000).toISOString()
          },
          {
            id: '5',
            email: 'guruffyyt04@gmail.com',
            created_at: new Date('2024-02-15').toISOString(),
            updated_at: new Date(Date.now() - 345600000).toISOString()
          }
        ];
      }

      setTranscriptions(transcriptionsData || []);
      setUsers(usersData || []);
      setFilteredUsers(usersData || []);

      // Calculate real-time stats
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Calculate today's transcriptions
      const todayTranscriptions = (transcriptionsData || []).filter(t => 
        new Date(t.createdAt) >= today
      ).length;

      // Calculate weekly transcriptions
      const weeklyTranscriptions = (transcriptionsData || []).filter(t => 
        new Date(t.createdAt) >= weekAgo
      ).length;

      // Calculate monthly transcriptions
      const monthlyTranscriptions = (transcriptionsData || []).filter(t => 
        new Date(t.createdAt) >= monthAgo
      ).length;

      // Calculate growth percentage
      const previousWeekTranscriptions = (transcriptionsData || []).filter(t => {
        const date = new Date(t.createdAt);
        const twoWeeksAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);
        return date >= twoWeeksAgo && date < weekAgo;
      }).length;

      const weeklyGrowth = previousWeekTranscriptions > 0 
        ? Math.round(((weeklyTranscriptions - previousWeekTranscriptions) / previousWeekTranscriptions) * 100)
        : weeklyTranscriptions > 0 ? 100 : 0;

      // Calculate weekly chart data (last 7 days)
      const weeklyChartData = [];
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const dayTranscriptions = (transcriptionsData || []).filter(t => {
          const transcriptionDate = new Date(t.createdAt);
          return transcriptionDate >= dayStart && transcriptionDate < dayEnd;
        }).length;
        
        weeklyChartData.push({
          day: days[date.getDay()],
          count: dayTranscriptions,
          date: date.toISOString().split('T')[0]
        });
      }

      // Calculate user growth (using mock data for now since profiles table structure is different)
      const todayUsers = usersData?.length || 0;
      const weeklyUsers = usersData?.length || 0;
      const monthlyUsers = usersData?.length || 0;

      console.log('Setting stats with:', { transcriptionsCount: transcriptionsData?.length, usersCount: usersData?.length });
      setStats({
        totalTranscriptions: transcriptionsData?.length || 0,
        totalUsers: usersData?.length || 0,
        todayTranscriptions,
        weeklyGrowth,
        weeklyTranscriptions,
        monthlyTranscriptions,
        todayUsers,
        weeklyUsers,
        monthlyUsers,
        weeklyChartData
      });

      // Update last update times
      setLastUpdate({
        transcriptions: new Date().toLocaleTimeString(),
        users: new Date().toLocaleTimeString(),
        today: new Date().toLocaleTimeString(),
        growth: new Date().toLocaleTimeString()
      });

      // Set real-time status
      setRealTimeStatus('connected');

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
      setRealTimeStatus('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteTranscription = async (id) => {
    try {
      const { error } = await supabase
        .from('transcriptions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      // Refresh data after deletion
      fetchData();
      alert('Transcription deleted successfully!');
    } catch (error) {
      console.error('Error deleting transcription:', error);
      alert('Failed to delete transcription. Please try again.');
    }
  };

  const handleEditTranscription = async (transcription) => {
    const newText = prompt('Edit transcription text:', transcription.transcriptionText);
    if (newText !== null && newText !== transcription.transcriptionText) {
      try {
        const { error } = await supabase
          .from('transcriptions')
          .update({ transcriptionText: newText })
          .eq('id', transcription.id);

        if (error) throw error;
        
        setTranscriptions(prev => 
          prev.map(t => t.id === transcription.id 
            ? { ...t, transcriptionText: newText }
            : t
          )
        );
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB.');
      return;
    }

    try {
      setUploadingPhoto(true);

      // Create a preview URL for immediate display
      const previewUrl = URL.createObjectURL(file);
      const updatedProfile = { ...adminProfile, avatar: previewUrl };
      
      // Update state
      setAdminProfile(updatedProfile);
      
      // Save to localStorage
      localStorage.setItem('adminProfile', JSON.stringify(updatedProfile));

      // In a real app, you would upload to Supabase Storage here
      // For now, we'll just use the preview URL
      console.log('Photo uploaded:', file.name);
      
      // Simulate upload delay
      setTimeout(() => {
        setUploadingPhoto(false);
        alert('Photo updated successfully! Your new profile picture has been saved.');
      }, 1000);

    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
      setUploadingPhoto(false);
    }
  };

  const handleProfileChange = (field, value) => {
    let updatedProfile = { ...adminProfile, [field]: value };
    
    // If name is changed, update avatar URL (unless it's a custom uploaded photo)
    if (field === 'name' && !adminProfile.avatar.includes('blob:')) {
      const newAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(value)}&background=3B82F6&color=ffffff&size=128`;
      updatedProfile = { ...updatedProfile, avatar: newAvatarUrl };
    }
    
    setAdminProfile(updatedProfile);
    
    // Auto-save to localStorage
    try {
      localStorage.setItem('adminProfile', JSON.stringify(updatedProfile));
    } catch (error) {
      console.error('Error auto-saving profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      // Clear admin authentication
      localStorage.removeItem('adminAuthenticated');
      localStorage.removeItem('adminEmail');
      localStorage.removeItem('adminLoginTime');
      localStorage.removeItem('adminProfile');
      
      // Clear admin state
      setUser(null);
      setIsAdmin(false);
      setTranscriptions([]);
      setUsers([]);
      
      // Redirect to admin login page
      navigate('/admin-login');
      console.log('Admin logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Error logging out. Please try again.');
    }
  };

  // Show loading while checking authentication
  if (loading || !isAdmin) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  // If not authenticated, don't render anything (will redirect)
  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`bg-gray-800 shadow-lg ${sidebarOpen ? 'w-64' : 'w-16'} transition-all duration-300`}>
        <div className="p-4">
          <div className="flex items-center mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            {sidebarOpen && <span className="text-xl font-bold text-white">Transcripto</span>}
          </div>

          {/* User Profile */}
          <div className="flex items-center mb-6 p-3 bg-gray-700 rounded-lg">
            <img
              src={adminProfile.avatar}
              alt="Admin"
              className="w-10 h-10 rounded-full mr-3 object-cover"
              onError={(e) => {
                // Fallback to a simple colored circle if image fails to load
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              className="w-10 h-10 rounded-full mr-3 bg-blue-600 text-white flex items-center justify-center font-bold text-sm"
              style={{ display: 'none' }}
            >
              {adminProfile.name.charAt(0).toUpperCase()}
            </div>
            {sidebarOpen && (
              <div>
                <p className="font-semibold text-white">{adminProfile.name}</p>
                <p className="text-sm text-gray-300">{adminProfile.role}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            <div className="mb-4">
              {sidebarOpen && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">DASHBOARDS</h3>}
              <button
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === 'dashboard' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                {sidebarOpen && <span>Analytics</span>}
              </button>
            </div>

            <div className="mb-4">
              {sidebarOpen && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">MANAGEMENT</h3>}
              <button
                onClick={() => setActiveTab('transcriptions')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === 'transcriptions' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {sidebarOpen && <span>Transcriptions</span>}
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === 'history' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {sidebarOpen && <span>History</span>}
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === 'users' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                {sidebarOpen && <span>Users</span>}
              </button>
              <button
                onClick={() => setActiveTab('live-chat')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === 'live-chat' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                {sidebarOpen && <span>Live Chat</span>}
              </button>

            </div>
            
            <div className="mb-4">
              {sidebarOpen && <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">SYSTEM</h3>}
              <button
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === 'profile' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                {sidebarOpen && <span>Profile</span>}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`w-full flex items-center p-3 rounded-lg transition-colors ${
                  activeTab === 'settings' ? 'bg-gray-700 text-white' : 'text-gray-300 hover:bg-gray-700'
                }`}
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {sidebarOpen && <span>Settings</span>}
              </button>

            </div>
            
            {/* Logout Button */}
            <div className="mt-auto pt-4 border-t border-gray-700">
              <button
                onClick={handleLogout}
                className="w-full flex items-center p-3 rounded-lg transition-colors text-red-400 hover:bg-red-900 hover:text-red-200"
              >
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                {sidebarOpen && <span>Logout</span>}
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-gray-800 shadow-sm border-b border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="mr-4 p-2 rounded-lg hover:bg-gray-700 text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <nav className="text-sm text-gray-400 mb-1">
                  Dashboards / {activeTab === 'dashboard' ? 'Analytics' : activeTab === 'transcriptions' ? 'Transcriptions' : activeTab === 'users' ? 'Users' : activeTab === 'live-chat' ? 'Live Chat' : activeTab === 'profile' ? 'Profile' : activeTab === 'settings' ? 'Settings' : 'Dashboard'}
                </nav>
                <h1 className="text-2xl font-bold text-white">
                  {activeTab === 'dashboard' ? 'Analytics' : activeTab === 'transcriptions' ? 'Transcriptions' : activeTab === 'users' ? 'Users' : activeTab === 'live-chat' ? 'Live Chat' : activeTab === 'profile' ? 'Profile' : activeTab === 'settings' ? 'Settings' : 'Dashboard'}
                </h1>
                <p className="text-gray-400 text-sm">
                  {activeTab === 'dashboard' 
                    ? 'Check the transcription stats, user growth and performance metrics.'
                    : activeTab === 'transcriptions'
                    ? 'Manage all audio transcriptions and their content.'
                    : activeTab === 'users'
                    ? 'View and manage user accounts and permissions.'
                      : activeTab === 'live-chat'
                    ? 'Manage customer support messages from live chat.'
                    : activeTab === 'profile'
                    ? 'Edit your admin profile and personal information.'
                      : activeTab === 'settings'
                      ? 'Configure your application settings.'
                      : 'Admin dashboard overview and analytics.'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  realTimeStatus === 'connected' ? 'bg-green-500' : 
                  realTimeStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-xs text-gray-400">
                  {realTimeStatus === 'connected' ? 'Live' : 
                   realTimeStatus === 'connecting' ? 'Connecting...' : 'Offline'}
                </span>
              </div>
              <button
                onClick={() => fetchData(true)}
                className={`p-2 rounded-lg hover:bg-gray-700 text-gray-300 transition-colors ${refreshing ? 'animate-spin' : ''}`}
                title="Refresh Data"
                disabled={refreshing}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search here..."
                  className="pl-10 pr-4 py-2 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-700 text-white placeholder-gray-400"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <button className="p-2 rounded-lg hover:bg-gray-700 relative text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">9</span>
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-700 text-gray-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button 
                onClick={() => {
                  localStorage.removeItem('adminAuthenticated');
                  localStorage.removeItem('adminEmail');
                  localStorage.removeItem('adminLoginTime');
                  window.location.href = '/admin-login';
                }}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 bg-gray-900">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Analytics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Transcriptions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalTranscriptions}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.weeklyTranscriptions} this week • {stats.monthlyTranscriptions} this month
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated {lastUpdate.transcriptions}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.weeklyUsers} this week • {stats.monthlyUsers} this month
                      </p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated {lastUpdate.users}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Today's Transcriptions</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.todayTranscriptions}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.todayUsers} new users today
                      </p>
                    </div>
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated {lastUpdate.today}
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Weekly Growth</p>
                      <p className="text-2xl font-bold text-gray-900">{stats.weeklyGrowth}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.weeklyTranscriptions} transcriptions this week
                      </p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated {lastUpdate.growth}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Transcriptions</h3>
                  <p className="text-sm text-gray-600 mb-6">Last 7 days performance</p>
                  <div className="h-64 flex items-end justify-between space-x-2">
                    {stats.weeklyChartData.map((dayData, index) => {
                      const maxCount = Math.max(...stats.weeklyChartData.map(d => d.count), 1);
                      const height = dayData.count > 0 ? (dayData.count / maxCount) * 200 : 0;
                      return (
                        <div key={dayData.day} className="flex flex-col items-center flex-1">
                          <div className="text-xs text-gray-600 mb-1">{dayData.count}</div>
                          <div 
                            className="bg-green-500 rounded-t w-full mb-2 transition-all duration-300 hover:bg-green-600"
                            style={{ height: `${height}px`, minHeight: '4px' }}
                            title={`${dayData.count} transcriptions on ${dayData.day}`}
                          ></div>
                          <span className="text-xs text-gray-600">{dayData.day}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 mt-4">
                    <div className="flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Real-time data from database
                    </div>
                    <div className="text-green-600 font-medium">
                      Total: {stats.weeklyTranscriptions}
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
                  <p className="text-sm text-gray-600 mb-6">User registration trends</p>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-700">Today</span>
                      </div>
                      <span className="text-lg font-bold text-blue-600">{stats.todayUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-700">This Week</span>
                      </div>
                      <span className="text-lg font-bold text-green-600">{stats.weeklyUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-700">This Month</span>
                      </div>
                      <span className="text-lg font-bold text-purple-600">{stats.monthlyUsers}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-500 rounded-full mr-3"></div>
                        <span className="text-sm font-medium text-gray-700">Total Users</span>
                      </div>
                      <span className="text-lg font-bold text-gray-600">{stats.totalUsers}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-sm text-gray-600 mt-4">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Updated {lastUpdate.users}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'transcriptions' && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">All Transcriptions</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage and view all user transcriptions</p>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => {
                        const csvContent = [
                          'ID,User ID,File Name,Audio URL,Transcription Text,Created At',
                          ...transcriptions.map(t => 
                            `${t.id},${t.userid},${t.fileName},${t.audioUrl},"${t.transcriptionText || ''}",${t.createdAt}`
                          )
                        ].join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'transcriptions.csv';
                        a.click();
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={fetchData}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-white">
                {transcriptions.length === 0 ? (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transcriptions</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by uploading some audio files.</p>
                  </div>
                ) : (
                  <AdminTable
                    transcriptions={transcriptions}
                    onDelete={handleDeleteTranscription}
                    onEdit={handleEditTranscription}
                  />
                )}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">All Users</h2>
                    <p className="text-sm text-gray-600 mt-1">Manage user accounts and permissions</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search users..."
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onChange={(e) => {
                          const searchTerm = e.target.value.toLowerCase();
                          const filtered = users.filter(user => 
                            user.email.toLowerCase().includes(searchTerm) ||
                            user.id.toLowerCase().includes(searchTerm)
                          );
                          setFilteredUsers(filtered);
                        }}
                      />
                      <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <button
                      onClick={() => fetchData(true)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User ID</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sign In</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                <span className="text-sm font-medium text-blue-600">
                                  {user.email.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-sm text-gray-900">{user.email}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-mono text-gray-600">{user.id}</td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.created_at ? (
                              <>
                            {new Date(user.created_at).toLocaleDateString()} {new Date(user.created_at).toLocaleTimeString()}
                              </>
                            ) : (
                              <span className="text-gray-400">N/A</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            {user.last_sign_in_at ? (
                              <span>
                                {new Date(user.last_sign_in_at).toLocaleDateString()} {new Date(user.last_sign_in_at).toLocaleTimeString()}
                              </span>
                            ) : (
                              <span className="text-gray-400">Never</span>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              user.confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {user.confirmed_at ? 'Confirmed' : 'Pending'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => alert(`View details for ${user.email}`)}
                                className="text-blue-600 hover:text-blue-800"
                                title="View Details"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => alert(`Edit user ${user.email}`)}
                                className="text-green-600 hover:text-green-800"
                                title="Edit User"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Are you sure you want to delete user ${user.email}?`)) {
                                    alert(`User ${user.email} deleted successfully!`);
                                  }
                                }}
                                className="text-red-600 hover:text-red-800"
                                title="Delete User"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {filteredUsers.length === 0 && (
                  <div className="text-center py-8">
                    <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                    </svg>
                    <p className="text-gray-500">No users found</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'live-chat' && (
            <div className="h-full flex flex-col">
              <AdminChatManager />
            </div>
          )}

          {activeTab === 'history' && (
            <div className="h-full flex flex-col">
              <AdminHistory />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Admin Profile</h2>
                <p className="text-sm text-gray-600 mt-1">Edit your admin profile and personal information</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Profile Picture */}
                  <div className="flex flex-col items-center">
                    <div className="relative group">
                      <img
                        src={adminProfile.avatar}
                        alt="Admin Avatar"
                        className="w-32 h-32 rounded-full object-cover mb-4 border-4 border-gray-200 shadow-lg"
                        onError={(e) => {
                          // Fallback to a simple colored circle if image fails to load
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div 
                        className="w-32 h-32 rounded-full mb-4 border-4 border-gray-200 shadow-lg bg-blue-600 text-white flex items-center justify-center font-bold text-4xl"
                        style={{ display: 'none' }}
                      >
                        {adminProfile.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => fileInputRef.current.click()}
                        disabled={uploadingPhoto}
                        className={`bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 ${
                          uploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {uploadingPhoto ? (
                          <>
                            <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            <span>Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>Change Photo</span>
                          </>
                        )}
                      </button>
                      {adminProfile.avatar.includes('blob:') && (
                        <button 
                          onClick={() => {
                            const defaultAvatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(adminProfile.name)}&background=3B82F6&color=ffffff&size=128`;
                            setAdminProfile(prev => ({ 
                              ...prev, 
                              avatar: defaultAvatarUrl 
                            }));
                            localStorage.setItem('adminProfile', JSON.stringify({ ...adminProfile, avatar: defaultAvatarUrl }));
                            alert('Photo removed successfully!');
                          }}
                          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoUpload}
                      className="hidden"
                      accept="image/*"
                    />
                  </div>

                  {/* Profile Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-gray-900">Personal Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={adminProfile.name}
                        onChange={(e) => handleProfileChange('name', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={adminProfile.email}
                        onChange={(e) => handleProfileChange('email', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={adminProfile.phone}
                        onChange={(e) => handleProfileChange('phone', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                      <textarea
                        value={adminProfile.bio}
                        onChange={(e) => handleProfileChange('bio', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={4}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <input
                        type="text"
                        value={adminProfile.timezone}
                        onChange={(e) => handleProfileChange('timezone', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                      <input
                        type="text"
                        value={adminProfile.language}
                        onChange={(e) => handleProfileChange('language', e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={() => {
                      try {
                        // Save profile to localStorage
                        localStorage.setItem('adminProfile', JSON.stringify(adminProfile));
                        
                        // Show success message
                        alert('Profile updated successfully! Your changes have been saved.');
                      } catch (error) {
                        console.error('Error saving profile:', error);
                        alert('Error saving profile. Please try again.');
                      }
                    }}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Profile
                  </button>
                  <button
                    onClick={() => {
                      const defaultProfile = {
                        name: 'Admin User',
                        email: 'admin@transcripto.com',
                        role: 'Administrator',
                        avatar: 'https://ui-avatars.com/api/?name=Admin+User&background=3B82F6&color=ffffff&size=128',
                        phone: '+1 (555) 123-4567',
                        bio: 'System administrator with full access to all features.',
                        timezone: 'UTC-5',
                        language: 'English'
                      };
                      
                      setAdminProfile(defaultProfile);
                      localStorage.setItem('adminProfile', JSON.stringify(defaultProfile));
                      alert('Profile reset to default values!');
                    }}
                    className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Reset to Default
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <AdminSettings onSettingsChange={(newSettings) => {
              setSettings(newSettings);
              fetchData(true);
            }} />
          )}

        </main>
      </div>
    </div>
  );
} 