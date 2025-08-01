import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (mounted) setUser(data.user);
    });
    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    // Force dark mode
    document.documentElement.classList.add('dark');
    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, []);

  // Hide nav links on home, login, and register
  const isMinimal = ["/", "/login", "/register"].includes(location.pathname);
  // Show 'Let's Go' button only on home page when not logged in
  const showLetsGo = location.pathname === '/' && !user;

  return (
    <nav className="sticky top-0 z-30 w-full flex items-center justify-between bg-gray-900/90 backdrop-blur text-white px-8 py-4 shadow-lg">
      <div className="flex items-center gap-6">
        <Link
          to={user ? "/" : "/"}
          className="font-extrabold text-2xl tracking-tight hover:text-blue-400 transition-colors"
          onClick={async (e) => {
            if (user) {
              e.preventDefault();
              await supabase.auth.signOut();
              setUser(null);
              navigate('/');
            }
          }}
        >Transcripto</Link>
        {!isMinimal && (
          <nav className="flex gap-12 text-blue-500 text-lg font-semibold ml-8">
            <Link to="/transcription" className="hover:underline">Transcribe</Link>
            <Link to="/upload-audio" className="hover:underline">Upload Audio</Link>
            <Link to="/history" className="hover:underline">History</Link>
            <Link to="/pricing" className="hover:underline">Pricing</Link>
            <Link to="/profile" className="hover:underline">Profile</Link>
          </nav>
        )}
      </div>
      <div className="flex items-center gap-4">
        {/* Show Let's Go button only on home page when not logged in */}
        {showLetsGo && (
            <button
              onClick={() => navigate('/login')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2 font-semibold shadow transition-colors"
            >
              Let's Go <span className="text-xl">→</span>
            </button>
        )}
        {/* Show user info and logout when logged in */}
        {user && !isMinimal && (
            <>
              <Link to="/profile" className="font-medium text-base bg-gray-800 px-3 py-1 rounded hover:underline">{user.email}</Link>
              <img
                src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`}
                alt="Profile"
                className="w-8 h-8 rounded-full border-2 border-blue-400 object-cover"
              />
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  setUser(null);
                  navigate('/');
                }}
                className="ml-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded font-semibold shadow transition-colors"
              >
                Logout
              </button>
            </>
        )}
      </div>
    </nav>
  );
} 