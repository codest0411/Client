import { supabase } from './supabaseClient';

export const adminService = {
  // Get all user history for admin dashboard
  async getAllHistory(page = 1, limit = 20, filters = {}) {
    try {
      console.log('AdminService: Fetching all history...');
      
      let query = supabase
        .from('user_history')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);

      // Apply filters
      if (filters.sourceType && filters.sourceType !== 'all') {
        query = query.eq('source_type', filters.sourceType);
      }

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters.searchTerm) {
        query = query.or(`transcription_text.ilike.%${filters.searchTerm}%,file_name.ilike.%${filters.searchTerm}%`);
      }

      const { data, error, count } = await query;

      console.log('AdminService: Query result - Data:', data?.length, 'Error:', error, 'Count:', count);

      if (error) {
        console.error('AdminService: Error fetching history:', error);
        throw error;
      }

      return {
        data: data || [],
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('AdminService: Error in getAllHistory:', error);
      throw error;
    }
  },

  // Get admin statistics
  async getAdminStats() {
    try {
      console.log('AdminService: Fetching admin stats...');
      
      // Get all history data for stats calculation
      const { data, error } = await supabase
        .from('user_history')
        .select('*')
        .order('created_at', { ascending: false });

      console.log('AdminService: Stats query result - Data:', data?.length, 'Error:', error);

      if (error) {
        console.error('AdminService: Error fetching stats data:', error);
        throw error;
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

      console.log('AdminService: Calculated stats:', statsData);
      return statsData;
    } catch (error) {
      console.error('AdminService: Error in getAdminStats:', error);
      // Return default values on error
      return {
        totalTranscriptions: 0,
        totalDuration: 0,
        avgDuration: 0,
        sourceTypeBreakdown: {},
        dailyBreakdown: {}
      };
    }
  },

  // Get all users for admin dashboard
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('AdminService: Error fetching users:', error);
      throw error;
    }
  },

  // Delete any transcription (admin can delete any)
  async deleteTranscription(id) {
    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('AdminService: Error deleting transcription:', error);
      throw error;
    }
  },

  // Delete multiple transcriptions
  async deleteMultipleTranscriptions(ids) {
    try {
      const { error } = await supabase
        .from('user_history')
        .delete()
        .in('id', ids);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('AdminService: Error deleting multiple transcriptions:', error);
      throw error;
    }
  },

  // Save transcription (for admin testing)
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
      console.error('AdminService: Error saving transcription:', error);
      throw error;
    }
  }
}; 