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

// Add these interfaces at the top of the file
interface ProfileCreate {
  id: string;
  name: string;
  avatar_url?: string | null;
  xp?: number;
  streak?: number;
  completed_lessons?: number;
  completed_quizzes?: number;
  social_links?: { [key: string]: string };
  created_at?: string;
  updated_at?: string;
}

interface ProfileUpdate {
  name?: string;
  age?: number;
  interests?: string[];
  socialLinks?: { [key: string]: string };
  avatar_url?: string | null;
}

interface DatabaseProfileUpdate {
  name?: string;
  age?: number;
  interests?: string[];
  social_links?: { [key: string]: string };
  avatar_url?: string | null;
  updated_at: string;
}

interface LearningActivity {
  id: string;
  user_id: string;
  activity_date: string;
  activity_type: 'lesson' | 'quiz' | 'challenge';
  lesson_id?: string;
  quiz_id?: string;
  xp_earned: number;
  created_at: string;
  updated_at: string;
}

interface LearningActivityCreate {
  user_id: string;
  activity_date: string;
  activity_type: 'lesson' | 'quiz' | 'challenge';
  lesson_id?: string;
  quiz_id?: string;
  xp_earned?: number;
}

interface UploadProgress {
  loaded: number;
  total: number;
}

// Database helper functions for your existing tables
export const database = {
  // Profile operations
  createProfile: async (profile: ProfileCreate) => {
    console.log('Attempting to create/update profile with data:', profile);
    try {
      // Use upsert instead of insert to handle both new and existing profiles
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url || null,
          xp: profile.xp || 0,
          streak: profile.streak || 0,
          completed_lessons: profile.completed_lessons || 0,
          completed_quizzes: profile.completed_quizzes || 0,
          social_links: profile.social_links || { facebook: '', linkedin: '' },
          created_at: profile.created_at || new Date().toISOString(),
          updated_at: profile.updated_at || new Date().toISOString()
        }, {
          onConflict: 'id',
          ignoreDuplicates: false
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
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          name,
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

      if (error) {
        // If the profile doesn't exist, create a default one
        if (error.code === 'PGRST116') {
          console.log('Profile not found, creating default profile...');
          const { data: newProfile, error: createError } = await database.createProfile({
            id: userId,
            name: '', // Empty name as we don't have it
            avatar_url: null,
            xp: 0,
            streak: 0,
            completed_lessons: 0,
            completed_quizzes: 0,
            social_links: { facebook: '', linkedin: '' },
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

          if (createError) {
            console.error('Error creating default profile:', createError);
            throw createError;
          }

          return { data: newProfile, error: null };
        }
        throw error;
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in getProfile:', err);
      return { data: null, error: err };
    }
  },

  updateProfile: async (userId: string, updates: ProfileUpdate) => {
    try {
      console.log('Attempting to update profile with data:', updates);
      
      // Convert field names to match database schema
      const dbUpdates: DatabaseProfileUpdate = {
        name: updates.name,
        age: updates.age,
        interests: updates.interests,
        social_links: updates.socialLinks,
        avatar_url: updates.avatar_url,
        updated_at: new Date().toISOString()
      };

      // Remove undefined values
      const keys = Object.keys(dbUpdates) as Array<keyof DatabaseProfileUpdate>;
      for (const key of keys) {
        if (dbUpdates[key] === undefined) {
          delete dbUpdates[key];
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .update(dbUpdates)
        .eq('id', userId)
        .select();

      if (error) {
        console.error('Profile update error:', error);
        throw error;
      }

      console.log('Profile update successful:', data);
      return { data, error: null };
    } catch (err) {
      console.error('Profile update error:', err);
      return { data: null, error: err };
    }
  },

  // Achievements operations
  getAchievements: async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*');
    return { data, error };
  },

  getUserAchievements: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching user achievements:', error);
        return { data: [], error: null }; // Return empty array instead of error
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Exception in getUserAchievements:', err);
      return { data: [], error: null }; // Return empty array instead of error
    }
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
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateUserProgress: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_progress')
      .update(updates)
      .eq('id', userId);
    return { data, error };
  },

  // User settings operations
  createUserSettings: async (userId: string, settings: any) => {
    const { data, error } = await supabase
      .from('user_settings')
      .insert([{
        id: userId,
        ...settings
      }]);
    return { data, error };
  },

  getUserSettings: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateUserSettings: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('user_settings')
      .update(updates)
      .eq('id', userId);
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

  // Learning activity operations
  getLearningActivity: async (userId: string, startDate?: string, endDate?: string) => {
    try {
      let query = supabase
        .from('learning_activity')
        .select('*')
        .eq('user_id', userId)
        .order('activity_date', { ascending: false });

      if (startDate) {
        query = query.gte('activity_date', startDate);
      }
      if (endDate) {
        query = query.lte('activity_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data as LearningActivity[], error: null };
    } catch (err) {
      console.error('Error fetching learning activity:', err);
      return { data: null, error: err };
    }
  },

  addLearningActivity: async (activity: LearningActivityCreate) => {
    try {
      const { data, error } = await supabase
        .from('learning_activity')
        .insert([{
          user_id: activity.user_id,
          activity_date: activity.activity_date,
          activity_type: activity.activity_type,
          lesson_id: activity.lesson_id,
          quiz_id: activity.quiz_id,
          xp_earned: activity.xp_earned || 0
        }])
        .select();

      if (error) throw error;
      return { data: data[0] as LearningActivity, error: null };
    } catch (err) {
      console.error('Error adding learning activity:', err);
      return { data: null, error: err };
    }
  },

  getStreakInfo: async (userId: string) => {
    try {
      // Get all learning activity for the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split('T')[0];

      const { data, error } = await database.getLearningActivity(userId, startDate);
      if (error) throw error;

      const activities = data || [];
      const today = new Date().toISOString().split('T')[0];
      const dates = new Set(activities.map(a => a.activity_date));
      
      // Calculate current streak
      let currentStreak = 0;
      let checkDate = new Date();
      while (true) {
        const dateStr = checkDate.toISOString().split('T')[0];
        if (dates.has(dateStr)) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }

      // Calculate longest streak in the last 30 days
      let longestStreak = 0;
      let tempStreak = 0;
      let lastDate: Date | null = null;

      const sortedDates = Array.from(dates).sort();
      for (const dateStr of sortedDates) {
        const currentDate = new Date(dateStr);
        if (lastDate) {
          const dayDiff = Math.floor((currentDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (dayDiff === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        } else {
          tempStreak = 1;
        }
        longestStreak = Math.max(longestStreak, tempStreak);
        lastDate = currentDate;
      }

      return {
        data: {
          currentStreak,
          longestStreak,
          totalDays: dates.size,
          markedDates: Object.fromEntries(
            Array.from(dates).map(date => [
              date,
              {
                marked: true,
                dotColor: '#5A66C4',
                customContainerStyle: {
                  borderRadius: 20,
                },
                customTextStyle: {
                  color: '#000000',
                }
              }
            ])
          )
        },
        error: null
      };
    } catch (err) {
      console.error('Error calculating streak info:', err);
      return { data: null, error: err };
    }
  },
};

// Video storage functions
export const videoStorage = {
  // Get the public URL for a video
  getVideoUrl: (path: string): string => {
    const { data } = supabase.storage
      .from('lesson-videos')
      .getPublicUrl(path);
    return data.publicUrl;
  },

  // Upload a video file
  uploadVideo: async (
    file: Blob | File,
    path: string,
    onProgress?: (progress: number) => void
  ): Promise<{ path: string; error: Error | null }> => {
    try {
      // Validate file type
      if (!file.type.startsWith('video/')) {
        throw new Error(`Invalid file type: ${file.type}. Only video files are allowed.`);
      }

      // Validate file size (50MB limit)
      const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size is 50MB.`);
      }

      console.log('Attempting to upload video:', {
        path,
        fileType: file.type,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(2)}MB`
      });

      const { data, error } = await supabase.storage
        .from('lesson-videos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type // Explicitly set content type
        });

      if (error) {
        console.error('Supabase upload error:', {
          message: error.message,
          name: error.name
        });
        throw error;
      }

      console.log('Upload successful:', data);

      if (onProgress) {
        onProgress(1);
      }

      return { path: data.path, error: null };
    } catch (error) {
      console.error('Error uploading video:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        path
      });
      return { 
        path: '', 
        error: error instanceof Error ? error : new Error('Failed to upload video') 
      };
    }
  },

  // Delete a video
  deleteVideo: async (path: string): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.storage
        .from('lesson-videos')
        .remove([path]);

      if (error) {
        console.error('Error deleting video:', {
          message: error.message,
          name: error.name
        });
        throw error;
      }

      return { error: null };
    } catch (error) {
      console.error('Error deleting video:', error);
      return { error: error instanceof Error ? error : new Error('Failed to delete video') };
    }
  }
}; 