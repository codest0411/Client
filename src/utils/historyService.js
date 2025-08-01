import { supabase } from './supabaseClient';

export const historyService = {
  // Save a new transcription to history
  async saveTranscription(transcriptionData) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_history')
        .insert({
          user_id: user.id,
          transcription_text: transcriptionData.text,
          audio_url: transcriptionData.audioUrl || null,
          file_name: transcriptionData.fileName || null,
          file_size: transcriptionData.fileSize || null,
          duration_seconds: transcriptionData.duration || null,
          source_type: transcriptionData.sourceType || 'recording',
          status: 'completed'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving transcription:', error);
      throw error;
    }
  },

  // Get user's transcription history
  async getUserHistory(page = 1, limit = 10, filters = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let query = supabase
        .from('user_history')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Apply filters
      if (filters.sourceType && filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.searchTerm) {
        query = query.or(`transcription_text.ilike.%${filters.searchTerm}%,file_name.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching user history:', error);
      throw error;
    }
  },

  // Get history statistics
  async getHistoryStats(days = 30) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all user history for the date range
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

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

      return {
        total_transcriptions: totalTranscriptions,
        total_duration: totalDuration,
        avg_duration: avgDuration,
        source_type_breakdown: sourceTypeBreakdown,
        daily_breakdown: dailyBreakdown
      };
    } catch (error) {
      console.error('Error fetching history stats:', error);
      // Return default values on error
      return {
        total_transcriptions: 0,
        total_duration: 0,
        avg_duration: 0,
        source_type_breakdown: {},
        daily_breakdown: {}
      };
    }
  },

  // Delete a transcription
  async deleteTranscription(id) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id); // Ensure user can only delete their own

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting transcription:', error);
      throw error;
    }
  },

  // Delete multiple transcriptions
  async deleteMultipleTranscriptions(ids) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('user_history')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id); // Ensure user can only delete their own

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting multiple transcriptions:', error);
      throw error;
    }
  },

  // Update transcription
  async updateTranscription(id, updates) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_history')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id) // Ensure user can only update their own
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating transcription:', error);
      throw error;
    }
  },

  // Export history as CSV
  async exportHistoryAsCSV() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const csvContent = this.convertToCSV(data || []);
      return csvContent;
    } catch (error) {
      console.error('Error exporting history:', error);
      throw error;
    }
  },

  // Helper function to convert data to CSV
  convertToCSV(data) {
    const headers = ['Date', 'Type', 'Transcription', 'File Name', 'Duration', 'Status'];
    const csvRows = [headers.join(',')];

    data.forEach(item => {
      const row = [
        new Date(item.created_at).toLocaleDateString(),
        item.source_type,
        `"${item.transcription_text.replace(/"/g, '""')}"`, // Escape quotes
        item.file_name || 'N/A',
        item.duration_seconds ? `${Math.floor(item.duration_seconds / 60)}:${(item.duration_seconds % 60).toString().padStart(2, '0')}` : 'N/A',
        item.status
      ];
      csvRows.push(row.join(','));
    });

    return csvRows.join('\n');
  }
}; 