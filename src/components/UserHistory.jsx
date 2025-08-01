import React, { useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';
import { historyService } from '../utils/historyService';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

export default function UserHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [stats, setStats] = useState({
    totalTranscriptions: 0,
    totalDuration: 0,
    avgDuration: 0
  });

  const itemsPerPage = 10;

  useEffect(() => {
    fetchHistory();
    fetchStats();
  }, [currentPage, filterType]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('UserHistory: Fetching history data...');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('UserHistory: User not authenticated');
        setError('User not authenticated');
        return;
      }

      console.log('UserHistory: User authenticated:', user.id);

      let query = supabase
        .from('user_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('source_type', filterType);
      }

      const { data, error: fetchError, count } = await query;

      console.log('UserHistory: Query result - Data:', data?.length, 'Error:', fetchError, 'Count:', count);

      if (fetchError) {
        console.error('UserHistory: Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('UserHistory: Setting history data:', data?.length);
      setHistory(data || []);
      
      // Calculate total pages
      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

    } catch (err) {
      console.error('UserHistory: Error in fetchHistory:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      console.log('UserHistory: Fetching stats...');
      
      // Get all user history data for stats calculation (not paginated)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('UserHistory: User not authenticated');
        return;
      }

      console.log('UserHistory: User authenticated:', user.id);

      // Fetch ALL user data for stats (not paginated)
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('UserHistory: Stats query result - Data:', data?.length, 'Error:', error);
      console.log('UserHistory: Sample data:', data?.slice(0, 2));

      if (error) {
        console.error('UserHistory: Error fetching stats data:', error);
        // Set default stats on error
        setStats({
          totalTranscriptions: 0,
          totalDuration: 0,
          avgDuration: 0
        });
        return;
      }

      // Calculate statistics from ALL data
      const totalTranscriptions = data?.length || 0;
      const totalDuration = data?.reduce((sum, item) => sum + (item.duration_seconds || 0), 0) || 0;
      const avgDuration = totalTranscriptions > 0 ? totalDuration / totalTranscriptions : 0;

      const statsData = {
        totalTranscriptions: totalTranscriptions,
        totalDuration: totalDuration,
        avgDuration: avgDuration
      };

      console.log('UserHistory: Calculated stats:', statsData);
      console.log('UserHistory: Raw data for calculation:', {
        dataLength: data?.length,
        durations: data?.map(item => item.duration_seconds),
        totalDuration: totalDuration,
        avgDuration: avgDuration
      });
      
      setStats(statsData);
    } catch (err) {
      console.error('UserHistory: Error fetching stats:', err);
      // Set default stats on error
      setStats({
        totalTranscriptions: 0,
        totalDuration: 0,
        avgDuration: 0
      });
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
      fetchStats(); // Refresh stats
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

  const filteredHistory = history.filter(item =>
    item.transcription_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.file_name && item.file_name.toLowerCase().includes(searchTerm.toLowerCase()))
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
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Transcription History</h2>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {stats.totalTranscriptions} total transcriptions
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {stats.totalTranscriptions}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">Total Transcriptions</div>
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
          <div className="text-sm text-purple-600 dark:text-purple-400">Average Duration</div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search transcriptions..."
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
        </select>
        {selectedItems.length > 0 && (
          <button
            onClick={handleBulkDelete}
            className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Selected ({selectedItems.length})
          </button>
        )}
      </div>

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
                Date
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
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                  {new Date(item.created_at).toLocaleDateString()}
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
          No transcriptions found. Start recording or uploading audio to see your history here.
        </div>
      )}
    </div>
  );
} 