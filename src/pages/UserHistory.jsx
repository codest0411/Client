import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../utils/supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { historyService } from '../utils/historyService';

export default function UserHistory() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
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
  const [savingHistory, setSavingHistory] = useState(false);

  const itemsPerPage = 10;

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory();
      fetchStats();
    }
  }, [user, currentPage, filterType]);

  const checkUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }
      setUser(user);
    } catch (err) {
      console.error('Error checking user:', err);
      navigate('/login');
    }
  };

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('user_history')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage - 1);

      // Apply filters
      if (filterType !== 'all') {
        query = query.eq('source_type', filterType);
      }

      const { data, error: fetchError, count } = await query;

      if (fetchError) throw fetchError;

      setHistory(data || []);
      
      // Calculate total pages
      if (count) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_history_stats', { p_user_id: user.id, p_days: 30 });

      if (error) throw error;

      if (data && data.length > 0) {
        setStats({
          totalTranscriptions: data[0].total_transcriptions || 0,
          totalDuration: data[0].total_duration || 0,
          avgDuration: data[0].avg_duration || 0
        });
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this transcription?')) return;

    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

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
        .in('id', selectedItems)
        .eq('user_id', user.id);

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

  const downloadAsTxt = (transcriptionText, fileName = 'transcription') => {
    const blob = new Blob([transcriptionText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveToHistory = async (transcriptionText, audioBlob = null, fileName = null) => {
    if (!transcriptionText.trim()) return;

    try {
      setSavingHistory(true);
      
      let audioUrl = null;
      if (audioBlob) {
        // Upload audio to Supabase Storage
        const storageFileName = `manual_save_${Date.now()}.webm`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('transcriptions')
          .upload(storageFileName, audioBlob);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('transcriptions')
          .getPublicUrl(storageFileName);
        
        audioUrl = urlData.publicUrl;
      }

      // Save to history
      await historyService.saveTranscription({
        text: transcriptionText,
        audioUrl: audioUrl,
        fileName: fileName || (audioBlob ? `manual_save_${Date.now()}.webm` : null),
        fileSize: audioBlob ? audioBlob.size : null,
        duration: null,
        sourceType: 'manual'
      });

      // Show success message
      alert('Transcription saved to history successfully!');

    } catch (err) {
      console.error('Error saving to history:', err);
      alert('Error saving to history: ' + err.message);
    } finally {
      setSavingHistory(false);
    }
  };

  if (loading && history.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex justify-center items-center min-h-[60vh]">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              My Transcription History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View and manage all your transcription records
            </p>
          </div>

          {error && <ErrorMessage message={error} />}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                  <span className="text-2xl">📊</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Transcriptions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalTranscriptions}</p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <span className="text-2xl">⏱️</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Duration</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatDuration(stats.totalDuration)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <span className="text-2xl">📈</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Duration</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    {formatDuration(Math.round(stats.avgDuration))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search your transcriptions..."
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
          </div>

          {/* History Table */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={selectedItems.length === history.length && history.length > 0}
                        onChange={handleSelectAll}
                        className="rounded border-gray-300"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transcription
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      File
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredHistory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item.id)}
                          onChange={() => handleSelectItem(item.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-2xl" title={item.source_type}>
                          {getSourceTypeIcon(item.source_type)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="max-w-xs">
                          <p className="text-sm text-gray-900 dark:text-gray-100 truncate">
                            {item.transcription_text}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {item.file_name || 'N/A'}
                          {item.file_size && (
                            <div className="text-xs text-gray-500">
                              {formatFileSize(item.file_size)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {formatDuration(item.duration_seconds)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                        {new Date(item.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => navigator.clipboard.writeText(item.transcription_text)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            title="Copy"
                          >
                            📋
                          </button>
                          <button
                            onClick={() => downloadAsTxt(item.transcription_text, item.file_name)}
                            className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            title="Download as TXT"
                          >
                            📄
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                Previous
              </button>
              <span className="px-3 py-2 text-gray-600 dark:text-gray-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg disabled:opacity-50 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                Next
              </button>
            </div>
          )}

          {filteredHistory.length === 0 && !loading && (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No transcriptions found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Start recording or uploading audio to see your history here.
              </p>
              <button
                onClick={() => navigate('/transcription')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start Recording
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 