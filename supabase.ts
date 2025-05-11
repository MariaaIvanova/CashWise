import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://tvjrolyteabegukldhln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2anJvbHl0ZWFiZWd1a2xkaGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDkyMTQsImV4cCI6MjA2MjI4NTIxNH0.rWSopj0XKxyMtL8ggzWvajg4ilQkFgQjNm6sfvtHork';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for common database operations
export const auth = {
  signUp: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  },

  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },
};

// Database helper functions for your existing tables
export const database = {
  // Profile operations
  createProfile: async (profile: any) => {
    console.log('Attempting to create/update profile with data:', profile);
    try {
      // Use upsert instead of insert to handle both new and existing profiles
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          avatar_url: profile.avatar_url,
          xp: profile.xp,
          streak: profile.streak,
          completed_lessons: profile.completed_lessons,
          completed_quizzes: profile.completed_quizzes,
          social_links: profile.social_links,
          created_at: profile.created_at,
          updated_at: profile.updated_at
        }, {
          onConflict: 'id', // Specify the column to check for conflicts
          ignoreDuplicates: false // Update the record if it exists
        })
        .select();

      console.log('Profile creation/update result:', { data, error });

      if (error) {
        console.error('Profile creation/update error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });
        throw error;
      }

      return { data, error: null };
    } catch (err) {
      console.error('Profile creation/update error:', err);
      return { data: null, error: err };
    }
  },

  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        avatar_url,
        xp,
        streak,
        completed_lessons,
        completed_quizzes,
        social_links,
        created_at,
        updated_at
      `)
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);
    return { data, error };
  },

  // Achievements operations
  getAchievements: async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*');
    return { data, error };
  },

  getUserAchievements: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievements (*)
      `)
      .eq('user_id', userId);
    return { data, error };
  },

  // Leaderboard operations
  getLeaderboard: async () => {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false });
    return { data, error };
  },

  // Quiz operations
  getQuizAttempts: async (userId: string) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  saveQuizAttempt: async (attempt: any) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([attempt]);
    return { data, error };
  },

  // User progress operations
  getUserProgress: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  updateUserProgress: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_progress')
      .update(updates)
      .eq('user_id', userId);
    return { data, error };
  },

  // User settings operations
  getUserSettings: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data, error };
  },

  updateUserSettings: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('user_id', userId);
    return { data, error };
  },

  // Feedback operations
  submitFeedback: async (feedback: any) => {
    const { data, error } = await supabase
      .from('feedback')
      .insert([feedback]);
    return { data, error };
  },

  getFeedback: async (userId: string) => {
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
}; 