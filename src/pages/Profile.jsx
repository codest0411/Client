import React, { useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

export default function Profile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState('');
  const [name, setName] = useState('');
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState('');
  const [avatarSuccess, setAvatarSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) setError(error.message);
      else {
        setUser(data.user);
        setName(data.user?.user_metadata?.full_name || '');
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!newPassword || !confirmPassword) {
      setError('Please fill in both password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);
    if (error) setError(error.message);
    else {
      setSuccess('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleChangeName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');
    if (!name.trim()) {
      setNameError('Name cannot be empty.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: name } });
      setLoading(false);
    if (error) setNameError(error.message);
    else {
      setNameSuccess('Name updated successfully!');
      setUser(u => ({ ...u, user_metadata: { ...u.user_metadata, full_name: name } }));
    }
  };

  const handleAvatarChange = async (e) => {
    setAvatarError('');
    setAvatarSuccess('');
    const file = e.target.files[0];
    if (!file) return;
    setAvatarUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, file, { upsert: true });
    if (uploadError) {
      setAvatarError(uploadError.message);
      setAvatarUploading(false);
      return;
    }
    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    const avatarUrl = publicUrlData.publicUrl;
    // Update user profile
    const { error: updateError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
    setAvatarUploading(false);
    if (updateError) {
      setAvatarError(updateError.message);
    } else {
      setAvatarSuccess('Profile picture updated!');
      setUser(u => ({ ...u, user_metadata: { ...u.user_metadata, avatar_url: avatarUrl } }));
    }
  };

  if (loading) return <div className="p-8 text-center text-2xl">Loading...</div>;
  if (!user) return <div className="p-8 text-center text-2xl text-red-500">Not logged in. Please log in to view your profile.</div>;

  return (
    <div className="w-full flex flex-col items-center min-h-[60vh] p-8">
        <h2 className="text-3xl font-extrabold mb-6 text-center text-gray-900 dark:text-gray-100">Profile</h2>
      <div className="mb-8 bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 flex flex-col items-center">
        <img
          src={user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random`}
          alt="Profile"
          className="w-24 h-24 rounded-full mb-4 border-2 border-blue-400 object-cover"
        />
        <div className="mb-2"><span className="font-semibold text-gray-800 dark:text-gray-100">Email:</span> <span className="text-gray-800 dark:text-gray-100">{user.email}</span></div>
        <form onSubmit={handleChangeName} className="flex flex-col items-center w-full max-w-xs mt-2">
          <label className="font-semibold mb-1 text-gray-800 dark:text-gray-100">Name:</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full mb-2 p-2 border border-gray-300 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none"
            placeholder="Enter your name"
          />
          {!name && <span className="text-gray-800 dark:text-gray-100">No name set</span>}
          <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded font-semibold shadow hover:bg-blue-700 transition-colors mb-2">Save</button>
          {nameError && <div className="text-red-500 text-sm mb-1">{nameError}</div>}
          {nameSuccess && <div className="text-green-600 text-sm mb-1">{nameSuccess}</div>}
        </form>
        </div>
      <form onSubmit={handleChangePassword} className="bg-white dark:bg-gray-900 rounded-lg shadow p-6 border border-gray-200 dark:border-gray-700 max-w-md w-full">
          <h3 className="font-bold mb-4 text-lg text-gray-900 dark:text-gray-100">Change Password</h3>
        {error && <div className="text-red-500 mb-2">{error}</div>}
          {success && <div className="text-green-600 mb-2">{success}</div>}
          <input
            type="password"
          placeholder="New Password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
            className="w-full mb-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <input
            type="password"
          placeholder="Confirm New Password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full mb-3 p-3 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
          <button type="submit" className="w-full bg-blue-600 text-white py-3 rounded-lg text-lg font-semibold shadow hover:bg-blue-700 transition-colors" disabled={loading}>
            Change Password
          </button>
        </form>
    </div>
  );
} 