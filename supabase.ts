import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Debug logging
console.log('Expo Config:', {
  hasConfig: !!Constants.expoConfig,
  hasExtra: !!Constants.expoConfig?.extra,
  extraKeys: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : [],
  supabaseUrl: Constants.expoConfig?.extra?.supabaseUrl,
  supabaseAnonKey: Constants.expoConfig?.extra?.supabaseAnonKey ? 'present' : 'missing'
});

// Get Supabase configuration from app config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration error:', {
    hasConfig: !!Constants.expoConfig,
    hasExtra: !!Constants.expoConfig?.extra,
    extraKeys: Constants.expoConfig?.extra ? Object.keys(Constants.expoConfig.extra) : [],
    supabaseUrl: supabaseUrl ? 'present' : 'missing',
    supabaseAnonKey: supabaseAnonKey ? 'present' : 'missing'
  });
  throw new Error('Supabase configuration is missing. Please check your app.json file.');
}

// Initialize the Supabase client with persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: Platform.OS === 'web' ? undefined : AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
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

// Reduce auth state change logging
supabase.auth.onAuthStateChange((event, session) => {
  // Only log significant auth events
  if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
    console.log('[Auth]', event, session?.user?.id ? `User: ${session.user.id}` : 'No user');
  }
});

// Remove storage state check logging
const checkStorageState = async () => {
  if (Platform.OS === 'web') {
    try {
      localStorage.getItem('sb-tvjrolyteabegukldhln-auth-token');
    } catch (error) {
      console.error('[Auth] Error checking web storage:', error);
    }
  } else {
    try {
      await AsyncStorage.getItem('supabase.auth.token');
    } catch (error) {
      console.error('[Auth] Error checking native storage:', error);
    }
  }
};

// Check storage state on initialization
checkStorageState();

// Helper functions for common database operations
export const auth = {
  signUp: async (email: string, password: string) => {
    try {
      console.log('[Supabase] Attempting sign up for:', email);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      console.log('[Supabase] Sign up successful:', { userId: data.user?.id });
      return { data, error: null };
    } catch (error) {
      console.error('[Supabase] Sign up error:', error);
      return { data: null, error };
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      console.log('[Supabase] Attempting sign in for:', email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('[Supabase] Sign in successful:', { userId: data.user?.id });
      return { data, error: null };
    } catch (error) {
      console.error('[Supabase] Sign in error:', error);
      return { data: null, error };
    }
  },

  signOut: async () => {
    try {
      console.log('[Supabase] Attempting sign out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('[Supabase] Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('[Supabase] Sign out error:', error);
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
      // Only log actual errors, not missing session
      if (!(error instanceof Error && error.message?.includes('Auth session missing'))) {
        console.error('[Auth] Get current user error:', error);
      }
      return { user: null, error };
    }
  },

  onAuthStateChange: (callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION', session: any) => void) => {
    console.log('[Supabase] Setting up auth state change listener');
    return supabase.auth.onAuthStateChange((event, session) => {
      console.log('[Supabase] Auth state changed:', {
        event,
        hasSession: !!session,
        userId: session?.user?.id
      });
      callback(event as 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION', session);
    });
  },

  getSession: async () => {
    try {
      console.log('[Supabase] Getting session');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      console.log('[Supabase] Got session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: !!session?.access_token,
        refreshToken: !!session?.refresh_token
      });
      return { session, error: null };
    } catch (error) {
      console.error('[Supabase] Get session error:', error);
      return { session: null, error };
    }
  },

  refreshSession: async () => {
    try {
      console.log('[Supabase] Refreshing session');
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) throw error;
      console.log('[Supabase] Session refreshed:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: !!session?.access_token
      });
      return { session, error: null };
    } catch (error) {
      console.error('[Supabase] Refresh session error:', error);
      return { session: null, error };
    }
  },

  clearAllSessions: async () => {
    try {
      console.log('[Supabase] Attempting to clear all sessions');
      
      // First sign out from Supabase
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.error('[Supabase] Error during sign out:', signOutError);
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
          console.log('[Supabase] Cleared web storage session data');
        } catch (error) {
          console.error('[Supabase] Error clearing web storage:', error);
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
          console.log('[Supabase] Cleared native storage session data');
        } catch (error) {
          console.error('[Supabase] Error clearing native storage:', error);
        }
      }

      console.log('[Supabase] All sessions cleared successfully');
      return { error: null };
    } catch (error) {
      console.error('[Supabase] Error clearing all sessions:', error);
      return { error };
    }
  },
};

// Add these interfaces at the top of the file
interface ProfileCreate {
  id: string;
  name: string;
  avatar_url?: string | null;
  age?: number | null;
  interests?: string[];
  xp?: number;
  streak?: number;
  completed_lessons?: number;
  completed_quizzes?: number;
  social_links?: { [key: string]: string };
  created_at?: string;
  updated_at?: string;
}

interface SocialLinks {
  facebook: string;
  linkedin: string;
  instagram: string;
}

interface ProfileUpdate {
  name?: string;
  age?: number;
  interests?: string[];
  socialLinks?: SocialLinks;
  social_links?: SocialLinks;
  avatar_url?: string | null;
  xp?: number;
  streak?: number;
  completed_lessons?: number;
  completed_quizzes?: number;
}

interface DatabaseProfileUpdate {
  name?: string;
  age?: number;
  interests?: string[];
  social_links?: SocialLinks;
  avatar_url?: string | null;
  xp?: number;
  streak?: number;
  completed_lessons?: number;
  completed_quizzes?: number;
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
  activity_date?: string;
  activity_type: 'lesson' | 'quiz' | 'challenge';
  lesson_id?: string;
  quiz_id?: string;
  xp_earned?: number;
}

interface UploadProgress {
  loaded: number;
  total: number;
}

interface Invitation {
  id: string;
  inviter_id: string;
  invitee_email: string;
  status: 'pending' | 'accepted' | 'expired';
  invitation_code: string;
  created_at: string;
  expires_at: string;
  accepted_at: string | null;
  xp_awarded: boolean;
}

interface InvitationCreate {
  invitee_email: string;
}

interface Profile {
  id: string;
  name: string;
  avatar_url: string | null;
  age?: number;
  interests?: string[];
  social_links: { [key: string]: string };
  xp: number;
  streak: number;
  completed_lessons: number;
  completed_quizzes: number;
  created_at: string;
  updated_at: string;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  xp_reward: number;
  created_at: string;
}

interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: number;
  completed_at: string;
  achievement: Achievement;
}

interface QuizAttempt {
  id: string;
  profile_id: string;
  quiz_id: string;
  score: number;
  total_questions: number;
  time_taken: number;
  created_at: string;
  completed_at: string;
  personality_type?: string;
}

// Update the validation function to use the SocialLinks type
const validateSocialLinks = (links: Partial<SocialLinks>): SocialLinks => {
  const defaultLinks: SocialLinks = {
    facebook: '',
    linkedin: '',
    instagram: ''
  };

  // Ensure all required platforms exist
  const validatedLinks = { ...defaultLinks };

  // Only copy valid platform values
  (Object.keys(defaultLinks) as Array<keyof SocialLinks>).forEach((platform) => {
    if (links[platform] !== undefined) {
      validatedLinks[platform] = links[platform] || '';
    }
  });

  return validatedLinks;
};

// Add this helper function at the top level
const formatLocalDate = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
        console.error('Error checking video existence:', existsError);
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
        console.error('Error getting signed URL:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getVideoUrl:', error);
      throw error;
    }
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

      // Ensure the path has the correct structure (lesson{id}/lesson{id}.mp4)
      const pathRegex = /^lesson\d+\/lesson\d+\.mp4$/;
      if (!pathRegex.test(path)) {
        throw new Error(`Invalid path format. Expected format: lesson{id}/lesson{id}.mp4`);
      }

      // Create the folder if it doesn't exist
      const folderPath = path.split('/')[0];
      const { error: listError } = await supabase.storage
        .from('lesson-videos')
        .list(folderPath);

      if (listError && listError.message !== 'Not Found') {
        throw listError;
      }

      const { data, error } = await supabase.storage
        .from('lesson-videos')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      if (onProgress) {
        onProgress(1);
      }

      // Return the signed URL path
      const signedUrl = await videoStorage.getVideoUrl(data.path);
      return { path: signedUrl, error: null };
    } catch (error) {
      console.error('Error uploading video:', error);
      return { 
        path: '', 
        error: error instanceof Error ? error : new Error('Failed to upload video') 
      };
    }
  },

  // Delete a video
  deleteVideo: async (path: string): Promise<{ error: Error | null }> => {
    try {
      // Check if file exists before attempting to delete
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

      const { error } = await supabase.storage
        .from('lesson-videos')
        .remove([path]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error deleting video:', error);
      return { error: error instanceof Error ? error : new Error('Failed to delete video') };
    }
  }
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
      console.error('Detailed bucket check error:', {
        error: listError,
        message: listError.message
      });

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
    console.error('Error checking avatars bucket:', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
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
        console.error('Error checking avatar existence:', existsError);
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
        console.error('Error getting signed URL:', error);
        throw error;
      }

      return data.signedUrl;
    } catch (error) {
      console.error('Error in getAvatarUrl:', error);
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
          console.error('Error deleting existing avatar:', deleteError);
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
        console.error('Supabase upload error:', error);
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
      console.error('Error uploading avatar:', error);
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
      console.error('Error deleting avatar:', error);
      return { error: error instanceof Error ? error : new Error('Failed to delete avatar') };
    }
  }
}; 