import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function AdminHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUser, setFilterUser] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [stats, setStats] = useState({
    totalTranscriptions: 0,
    totalDuration: 0,
    avgDuration: 0,
    sourceTypeBreakdown: {},
    dailyBreakdown: {}
  });
  const [users, setUsers] = useState([]);
  const [showStats, setShowStats] = useState(true);
  const [savingHistory, setSavingHistory] = useState(false);

  const itemsPerPage = 20;

  useEffect(() => {
    fetchHistory();
    fetchStats();
    fetchUsers();
  }, [currentPage, filterType, filterStatus, filterUser]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('AdminHistory: Fetching history data...');
      console.log('AdminHistory: Filters - Type:', filterType, 'Status:', filterStatus, 'User:', filterUser);

      // Build the query with proper joins
      let query = supabase
        .from('user_history')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('source_type', filterType);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      if (filterUser) {
        query = query.eq('user_id', filterUser);
      }

      const { data, error: fetchError, count } = await query;

      console.log('AdminHistory: Query result - Data:', data?.length, 'Error:', fetchError, 'Count:', count);

      if (fetchError) {
        console.error('AdminHistory: Fetch error:', fetchError);
        // If the join fails, try without the join
        let fallbackQuery = supabase
          .from('user_history')
          .select('*')
          .order('created_at', { ascending: false })
          .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

        if (filterType !== 'all') {
          fallbackQuery = fallbackQuery.eq('source_type', filterType);
        }
        if (filterStatus !== 'all') {
          fallbackQuery = fallbackQuery.eq('status', filterStatus);
        }
        if (filterUser) {
          fallbackQuery = fallbackQuery.eq('user_id', filterUser);
        }

        const { data: fallbackData, error: fallbackError, count: fallbackCount } = await fallbackQuery;
        
        console.log('AdminHistory: Fallback query result - Data:', fallbackData?.length, 'Error:', fallbackError);
        
        if (fallbackError) throw fallbackError;
        
        // Fetch user profiles separately
        const userIds = [...new Set(fallbackData?.map(item => item.user_id) || [])];
        let userProfiles = {};
        
        if (userIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);
          
          if (!profilesError && profilesData) {
            userProfiles = profilesData.reduce((acc, profile) => {
              acc[profile.id] = profile;
              return acc;
            }, {});
          }
        }

        // Combine history data with user profiles
        const historyWithProfiles = fallbackData?.map(item => ({
          ...item,
          profiles: userProfiles[item.user_id] || null
        })) || [];

        console.log('AdminHistory: Final data with profiles:', historyWithProfiles.length);
        setHistory(historyWithProfiles);
        if (fallbackCount) {
          setTotalPages(Math.ceil(fallbackCount / itemsPerPage));
        }
        return;
      }

      console.log('AdminHistory: Setting history data:', data?.length);
      setHistory(data || []);
      
      // Calculate total pages
      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

    } catch (err) {
      console.error('AdminHistory: Error in fetchHistory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('AdminHistory: Fetching stats...');
      
      // Get all history data for stats calculation
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('AdminHistory: Stats query result - Data:', data?.length, 'Error:', error);

      if (error) {
        console.error('AdminHistory: Error fetching stats data:', error);
        // Set default stats on error
        setStats({
          totalTranscriptions: 0,
          totalDuration: 0,
          avgDuration: 0,
          sourceTypeBreakdown: {},
          dailyBreakdown: {}
        });
        return;
      }

      // Calculate statistics
      const totalTranscriptions = data?.length || 0;
      const totalDuration = data?.reduce((sum, item) => sum + (item.duration_seconds || 0), 0) || 0;
      const avgDuration = totalTranscriptions > 0 ? totalDuration / totalTranscriptions : 0;

      // Calculate source type breakdown
      const sourceTypeBreakdown = {};
      data?.forEach(item => {
        const type = item.source_type || 'unknown';
        sourceTypeBreakdown[type] = (sourceTypeBreakdown[type] || 0) + 1;
      });

      // Calculate daily breakdown
      const dailyBreakdown = {};
      data?.forEach(item => {
        const date = new Date(item.created_at).toDateString();
        dailyBreakdown[date] = (dailyBreakdown[date] || 0) + 1;
      });

      const statsData = {
        totalTranscriptions: totalTranscriptions,
        totalDuration: totalDuration,
        avgDuration: avgDuration,
        sourceTypeBreakdown: sourceTypeBreakdown,
        dailyBreakdown: dailyBreakdown
      };

      console.log('AdminHistory: Calculated stats:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('AdminHistory: Error fetching stats:', err);
      // Set default stats on error
      setStats({
        totalTranscriptions: 0,
        totalDuration: 0,
        avgDuration: 0,
        sourceTypeBreakdown: {},
        dailyBreakdown: {}
      });
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transcription?')) return;

    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setHistory(prev => prev.filter(item => item.id !== id));
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedItems.length} transcriptions?`)) return;

    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .in('id', selectedItems);

      if (error) throw error;

      setSelectedItems([]);
      fetchHistory();
      fetchStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectAll = () => {
    if (selectedItems.length === history.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(history.map(item => item.id));
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    );
  };

  const exportToCSV = () => {
    const headers = ['Date', 'User', 'Type', 'Status', 'Transcription', 'File Name', 'Duration', 'File Size'];
    const csvRows = [headers.join(',')];

    history.forEach(item => {
      const row = [
        new Date(item.created_at).toLocaleDateString(),
        item.profiles?.email || 'Unknown',
        item.source_type,
        item.status,
        `"${item.transcription_text.replace(/"/g, '""')}"`,
        item.file_name || 'N/A',
        item.duration_seconds ? `${Math.floor(item.duration_seconds / 60)}:${(item.duration_seconds % 60).toString().padStart(2, '0')}` : 'N/A',
        item.file_size ? `${(item.file_size / (1024 * 1024)).toFixed(1)} MB` : 'N/A'
      ];
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcription_history_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveToHistory = async (transcriptionText, userId = null) => {
    if (!transcriptionText.trim()) return;

    try {
      setSavingHistory(true);
      
      // If no user specified, use the first available user or prompt
      let targetUserId = userId;
      if (!targetUserId) {
        if (users.length === 0) {
          alert('No users available. Please create a user first.');
          return;
        }
        targetUserId = users[0].id;
      }

      // Save to history
      await supabase
        .from('user_history')
        .insert([{
          user_id: targetUserId,
          transcription_text: transcriptionText,
          audio_url: null,
          file_name: null,
          file_size: null,
          duration: null,
          source_type: 'manual',
          status: 'completed'
        }]);

      // Show success message
      alert('Transcription saved to history successfully!');
      
      // Refresh the history
      fetchHistory();

    } catch (err) {
      console.error('Error saving to history:', err);
      alert('Error saving to history: ' + err.message);
    } finally {
      setSavingHistory(false);
    }
  };

  const filteredHistory = history.filter(item =>
    item.transcription_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.file_name && item.file_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (item.profiles?.email && item.profiles.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDuration = (seconds) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getSourceTypeIcon = (type) => {
    switch (type) {
      case 'recording': return '🎙️';
      case 'upload': return '📁';
      case 'dictation': return '🎤';
      default: return '📄';
    }
  };

  if (loading && history.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">All User History</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setShowStats(!showStats)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Cards */}
      {showStats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalTranscriptions}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatDuration(stats.totalDuration)}
            </div>
            <div className="text-sm text-green-600 dark:text-green-400">Total Duration</div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatDuration(Math.round(stats.avgDuration))}
            </div>
            <div className="text-sm text-purple-600 dark:text-purple-400">Avg Duration</div>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {Object.keys(stats.sourceTypeBreakdown).length}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-400">Source Types</div>
          </div>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {users.length}
            </div>
            <div className="text-sm text-red-600 dark:text-red-400">Active Users</div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <div className="md:col-span-2">
          <input
            type="text"
            placeholder="Search transcriptions, files, or users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Types</option>
          <option value="recording">Recording</option>
          <option value="upload">Upload</option>
          <option value="dictation">Dictation</option>
          <option value="manual">Manual</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Status</option>
          <option value="completed">Completed</option>
          <option value="processing">Processing</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={filterUser}
          onChange={(e) => setFilterUser(e.target.value)}
          className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Users</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.email}
            </option>
          ))}
        </select>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => {
            const text = prompt('Enter transcription text to save:');
            if (text && text.trim()) {
              saveToHistory(text.trim());
            }
          }}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          disabled={savingHistory}
        >
          <span role="img" aria-label="save">💾</span>
          {savingHistory ? 'Saving...' : 'Save New'}
        </button>
        {selectedItems.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Selected ({selectedItems.length})
          </button>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex justify-between items-center">
            <span className="text-red-800 dark:text-red-200">
              {selectedItems.length} items selected
            </span>
            <button
              onClick={handleBulkDelete}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* History Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white dark:bg-gray-800 rounded-lg shadow">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-4 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedItems.length === history.length && history.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                User
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Transcription
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                File
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Duration
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredHistory.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(item.id)}
                    onChange={() => handleSelectItem(item.id)}
                    className="rounded border-gray-300"
                  />
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
                  <div className="text-xs text-gray-500">
                    {new Date(item.created_at).toLocaleTimeString()}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-900 dark:text-gray-100">
                    {item.profiles?.email || 'Unknown'}
                  </div>
                  {item.profiles?.full_name && (
                    <div className="text-xs text-gray-500">
                      {item.profiles.full_name}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="text-2xl" title={item.source_type}>
                    {getSourceTypeIcon(item.source_type)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-xs">
                    <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                      {item.transcription_text}
                    </p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {item.file_name || 'N/A'}
                    {item.file_size && (
                      <div className="text-xs text-gray-500">
                        {formatFileSize(item.file_size)}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {formatDuration(item.duration_seconds)}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    item.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                    item.status === 'processing' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(item.transcription_text)}
                      className="p-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete"
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-2 text-gray-600 dark:text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {filteredHistory.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No transcriptions found matching your criteria.
        </div>
      )}
    </div>
  );
} 