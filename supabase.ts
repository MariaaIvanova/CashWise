import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Get Supabase configuration from app config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase configuration is missing. Please check your app.json file.');
}

// Initialize the Supabase client with persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
    debug: false
  },
  global: {
    headers: {
      'x-application-name': 'FinanceApp'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper functions for common database operations
export const auth = {
  signUp: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error };
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      // Don't treat missing session as an error
      if (error?.message?.includes('Auth session missing')) {
        return { user: null, error: null };
      }
      
      if (error) throw error;
      return { user, error: null };
    } catch (error) {
      return { user: null, error };
    }
  },

  onAuthStateChange: (callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION', session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event as 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION', session);
    });
  },

  getSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  refreshSession: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      return { session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  },

  clearAllSessions: async () => {
    try {
      // First sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        throw signOutError;
      }

      // Clear web storage if in web environment
      if (Platform.OS === 'web') {
        try {
          // Clear all Supabase related items from localStorage
          const keys = Object.keys(localStorage);
          keys.forEach(key => {
            if (key.startsWith('sb-') || key.includes('supabase')) {
              localStorage.removeItem(key);
            }
          });
        } catch (error) {
          // Silently fail on web storage error
        }
      } else {
        // Clear native storage
        try {
          const keys = await AsyncStorage.getAllKeys();
          const supabaseKeys = keys.filter(key => 
            key.startsWith('supabase.') || 
            key.includes('supabase')
          );
          await AsyncStorage.multiRemove(supabaseKeys);
        } catch (error) {
          // Silently fail on native storage error
        }
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  },
};

// Database helper functions for your existing tables
export const database = {
  // Profile operations
  getProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  updateProfile: async (userId: string, updates: any) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId);
    return { data, error };
  },

  // Learning activity operations
  addLearningActivity: async (activity: {
    user_id: string;
    activity_type: string;
    lesson_id?: string;
    quiz_id?: string;
    xp_earned: number;
  }) => {
    const { data, error } = await supabase
      .from('learning_activities')
      .insert([{
        ...activity,
        created_at: new Date().toISOString()
      }]);
    return { data, error };
  },

  getLearningActivities: async (userId: string) => {
    const { data, error } = await supabase
      .from('learning_activities')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
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

  getQuizAttempts: async (userId: string) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });

    return { data, error };
  },

  getStreakInfo: async (userId: string) => {
    // Get the user's profile to check their streak
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('streak')
      .eq('id', userId)
      .single();

    if (profileError) {
      return { data: null, error: profileError };
    }

    return { 
      data: { 
        currentStreak: profile?.streak || 0 
      }, 
      error: null 
    };
  },

  // Achievement operations
  getAchievements: async () => {
    const { data, error } = await supabase
      .from('achievements')
      .select('*')
      .order('id', { ascending: true });
    return { data, error };
  },

  getUserAchievements: async (userId: string) => {
    const { data, error } = await supabase
      .from('user_achievements')
      .select(`
        *,
        achievement:achievements(*)
      `)
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });
    return { data, error };
  },
};

// Video storage functions
export const videoStorage = {
  // Get a signed URL for a video that's valid for 24 hours
  getVideoUrl: async (path: string): Promise<string> => {
    try {
      // First check if the file exists
      const { data: existsData, error: existsError } = await supabase.storage
        .from('lesson-videos')
        .list(path.split('/').slice(0, -1).join('/'));

      if (existsError) {
        throw existsError;
      }

      const fileName = path.split('/').pop();
      const fileExists = existsData?.some(file => file.name === fileName);

      if (!fileExists) {
        throw new Error(`Video file ${path} not found in storage`);
      }

      const { data, error } = await supabase.storage
        .from('lesson-videos')
        .createSignedUrl(path, 24 * 60 * 60); // 24 hours in seconds

      if (error) {
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      throw error;
    }
  },
};

// Add this function before the avatarStorage object
const ensureAvatarsBucket = async () => {
  try {
    // Try to list the contents of the bucket directly
    const { data: files, error: listError } = await supabase
      .storage
      .from('avatars')
      .list();

    if (listError) {
      if (listError.message === 'Bucket not found') {
        throw new Error(
          'The avatars bucket was not found. Please verify in the Supabase dashboard that:\n' +
          '1. The bucket "avatars" exists in Storage\n' +
          '2. The bucket is marked as Public\n' +
          '3. You have the correct policies set up\n\n' +
          'Current error details: ' + JSON.stringify(listError, null, 2)
        );
      }
      throw listError;
    }

    // If we can list the bucket contents, it exists and we have access
    return true;
  } catch (error) {
    throw error;
  }
};

// Avatar storage functions
export const avatarStorage = {
  // Get a signed URL for an avatar that's valid for 24 hours
  getAvatarUrl: async (userId: string): Promise<string | null> => {
    try {
      const path = `${userId}/avatar`;
      
      // First check if the file exists
      const { data: existsData, error: existsError } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existsError) {
        throw existsError;
      }

      const fileExists = existsData?.some(file => file.name.startsWith('avatar'));

      if (!fileExists) {
        return null;
      }

      const { data, error } = await supabase.storage
        .from('avatars')
        .createSignedUrl(path, 24 * 60 * 60); // 24 hours in seconds

      if (error) {
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      throw error;
    }
  },

  // Upload an avatar file
  uploadAvatar: async (
    userId: string,
    file: Blob | File,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string | null; error: Error | null }> => {
    try {
      // Ensure the bucket exists before uploading
      await ensureAvatarsBucket();

      // Validate file type
      if (!file.type.startsWith('image/')) {
        throw new Error(`Invalid file type: ${file.type}. Only image files are allowed.`);
      }

      // Validate file size (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${(file.size / (1024 * 1024)).toFixed(2)}MB. Maximum size is 5MB.`);
      }

      const path = `${userId}/avatar`;

      // Delete existing avatar if it exists
      const { data: existingFiles } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existingFiles?.some(file => file.name.startsWith('avatar'))) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([path]);

        if (deleteError) {
          // Continue with upload even if delete fails
        }
      }

      // Upload the new avatar
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (error) {
        throw error;
      }

      if (onProgress) {
        onProgress(1);
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(path);

      return { url: publicUrl, error: null };
    } catch (error) {
      return { 
        url: null, 
        error: error instanceof Error ? error : new Error('Failed to upload avatar') 
      };
    }
  },

  // Delete an avatar
  deleteAvatar: async (userId: string): Promise<{ error: Error | null }> => {
    try {
      const path = `${userId}/avatar`;

      // Check if file exists before attempting to delete
      const { data: existsData, error: existsError } = await supabase.storage
        .from('avatars')
        .list(userId);

      if (existsError) {
        throw existsError;
      }

      const fileExists = existsData?.some(file => file.name.startsWith('avatar'));

      if (!fileExists) {
        return { error: null }; // No file to delete
      }

      const { error } = await supabase.storage
        .from('avatars')
        .remove([path]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error instanceof Error ? error : new Error('Failed to delete avatar') };
    }
  }
}; 