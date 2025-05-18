import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Initialize the Supabase client
// Replace these with your actual Supabase project URL and anon key
const supabaseUrl = 'https://tvjrolyteabegukldhln.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2anJvbHl0ZWFiZWd1a2xkaGxuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3MDkyMTQsImV4cCI6MjA2MjI4NTIxNH0.rWSopj0XKxyMtL8ggzWvajg4ilQkFgQjNm6sfvtHork';

// Initialize the Supabase client with persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

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

  // Add new session management functions
  onAuthStateChange: (callback: (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION', session: any) => void) => {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(event as 'SIGNED_IN' | 'SIGNED_OUT' | 'USER_UPDATED' | 'PASSWORD_RECOVERY' | 'INITIAL_SESSION', session);
    });
  },

  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  refreshSession: async () => {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    return { session, error };
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
  createProfile: async (profile: ProfileCreate) => {
    console.log('Attempting to create/update profile with data:', profile);
    try {
      // Validate social links
      const social_links = validateSocialLinks(profile.social_links || {});

      // Use upsert instead of insert to handle both new and existing profiles
      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          name: profile.name,
          avatar_url: profile.avatar_url || null,
          age: profile.age || null,
          interests: profile.interests || [],
          xp: profile.xp || 0,
          streak: profile.streak || 0,
          completed_lessons: profile.completed_lessons || 0,
          completed_quizzes: profile.completed_quizzes || 0,
          social_links,
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
          age,
          interests,
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
            age: null,
            interests: [],
            xp: 0,
            streak: 0,
            completed_lessons: 0,
            completed_quizzes: 0,
            social_links: { facebook: '', linkedin: '', instagram: '' },
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
      // First check if profile exists
      const { data: existingProfile, error: getError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single();

      // If profile doesn't exist, create it first
      if (getError?.code === 'PGRST116') {
        console.log('Profile not found, creating default profile...');
        const { error: createError } = await database.createProfile({
          id: userId,
          name: '', // Empty name as we don't have it
          avatar_url: null,
          age: null,
          interests: [],
          xp: 0,
          streak: 0,
          completed_lessons: 0,
          completed_quizzes: 0,
          social_links: { facebook: '', linkedin: '', instagram: '' },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

        if (createError) {
          console.error('Error creating default profile:', createError);
          throw createError;
        }
      } else if (getError) {
        throw getError;
      }

      // If updating social links, validate them
      if (updates.socialLinks) {
        updates.social_links = validateSocialLinks(updates.socialLinks);
        delete updates.socialLinks; // Remove the camelCase version
      }

      // If updating XP, add it to the current value
      if (updates.xp) {
        const { data: currentProfile } = await database.getProfile(userId);
        if (currentProfile && 'xp' in currentProfile) {
          updates.xp = (currentProfile.xp || 0) + updates.xp;
        }
      }

      // If updating streak, get the actual streak from learning activity
      if (updates.streak !== undefined) {
        const { data: streakInfo } = await database.getStreakInfo(userId);
        if (streakInfo) {
          updates.streak = streakInfo.currentStreak;
        }
      }

      // Now update the profile
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select();

      if (error) throw error;

      // Check for achievements after profile update
      await database.checkAchievements(userId);

      return { data: data?.[0] || null, error: null };
    } catch (err) {
      console.error('Error in updateProfile:', err);
      return { data: null, error: err };
    }
  },

  // Achievement operations
  getAchievements: async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('id', { ascending: true });
      return { data, error };
    } catch (err) {
      console.error('Error in getAchievements:', err);
      return { data: null, error: err };
    }
  },

  getUserAchievements: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq('user_id', userId);

      if (error) throw error;

      // Transform the data to match the Achievement interface
      const achievements = data.map((ua: any) => ({
        id: ua.achievement.id,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        completed: true,
        completed_at: ua.completed_at
      }));

      return { data: achievements, error: null };
    } catch (err) {
      console.error('Error in getUserAchievements:', err);
      return { data: [], error: err };
    }
  },

  unlockAchievement: async (userId: string, achievementId: number) => {
    try {
      // Check if achievement is already unlocked
      const { data: existing } = await supabase
        .from('user_achievements')
        .select('id')
        .eq('user_id', userId)
        .eq('achievement_id', achievementId)
        .single();

      if (existing) return { data: existing, error: null };

      // Get achievement details
      const { data: achievement } = await supabase
        .from('achievements')
        .select('*')
        .eq('id', achievementId)
        .single();

      if (!achievement) throw new Error('Achievement not found');

      // Insert user achievement
      const { data, error } = await supabase
        .from('user_achievements')
        .insert([{
          user_id: userId,
          achievement_id: achievementId,
          completed_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Update user XP
      await database.updateProfile(userId, {
        xp: achievement.xp_reward
      });

      return { data, error: null };
    } catch (err) {
      console.error('Error in unlockAchievement:', err);
      return { data: null, error: err };
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
      .eq('profile_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  saveQuizAttempt: async (attempt: Omit<QuizAttempt, 'id' | 'created_at' | 'completed_at'>) => {
    const { data, error } = await supabase
      .from('quiz_attempts')
      .insert([{
        ...attempt,
        completed_at: new Date().toISOString()
      }]);
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
      // Use local date for activity_date
      const activityDate = activity.activity_date || formatLocalDate();
      
      const { data, error } = await supabase
        .from('learning_activity')
        .insert([{
          user_id: activity.user_id,
          activity_date: activityDate,
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
      console.log('=== Streak Calculation Debug ===');
      console.log('User ID:', userId);
      console.log('Current time:', new Date().toLocaleString());

      // Call the database function to calculate streaks
      const { data, error } = await supabase
        .rpc('calculate_user_streaks', {
          p_user_id: userId
        });

      if (error) {
        console.error('Error calculating streaks:', error);
        throw error;
      }

      // The function returns an array, we need the first element
      const streakData = data[0];
      console.log('Streak calculation result:', streakData);

      // Transform the activity dates into the marked dates format
      const markedDates = Object.fromEntries(
        (streakData.activity_dates || []).map((date: string) => [
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
      );

      return {
        data: {
          currentStreak: streakData.current_streak,
          longestStreak: streakData.longest_streak,
          totalDays: streakData.total_days,
          markedDates
        },
        error: null
      };
    } catch (err) {
      console.error('Error calculating streak info:', err);
      return { data: null, error: err };
    }
  },

  createInvitation: async (inviterId: string, invitation: InvitationCreate) => {
    try {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + 7); // Invitation expires in 7 days

      const { data, error } = await supabase
        .from('invitations')
        .insert([{
          inviter_id: inviterId,
          invitee_email: invitation.invitee_email,
          status: 'pending',
          invitation_code: await database.generateInvitationCode(),
          expires_at: expirationDate.toISOString()
        }])
        .select();

      if (error) throw error;
      return { data: data[0] as Invitation, error: null };
    } catch (err) {
      console.error('Error creating invitation:', err);
      return { data: null, error: err };
    }
  },

  generateInvitationCode: async () => {
    try {
      const { data, error } = await supabase
        .rpc('generate_invitation_code');

      if (error) throw error;
      return data as string;
    } catch (err) {
      console.error('Error generating invitation code:', err);
      throw err;
    }
  },

  getInvitationByCode: async (code: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('invitation_code', code)
        .single();

      if (error) throw error;
      return { data: data as Invitation, error: null };
    } catch (err) {
      console.error('Error getting invitation:', err);
      return { data: null, error: err };
    }
  },

  acceptInvitation: async (invitationCode: string, userId: string) => {
    try {
      // Find the inviter by their referral code
      const { data: inviter, error: inviterError } = await supabase
        .from('profiles')
        .select('id')
        .eq('referral_code', invitationCode)
        .single();

      if (inviterError || !inviter) {
        throw new Error('Invalid or expired invitation code');
      }

      // Update the new user's profile to record who referred them
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ referred_by: inviter.id })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Award XP to both users
      await database.updateProfile(inviter.id, { xp: 300 }); // Award XP to referrer
      await database.updateProfile(userId, { xp: 100 }); // Award XP to new user

      // Unlock the referral achievement for the inviter
      await database.unlockAchievement(inviter.id, 7); // Achievement ID 7 is the referral achievement

      return { data: { inviter_id: inviter.id }, error: null };
    } catch (err) {
      console.error('Error accepting invitation:', err);
      return { data: null, error: err };
    }
  },

  getUserInvitations: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('invitations')
        .select('*')
        .eq('inviter_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data as Invitation[], error: null };
    } catch (err) {
      console.error('Error getting user invitations:', err);
      return { data: null, error: err };
    }
  },

  checkAchievements: async (userId: string) => {
    try {
      const { data: profile } = await database.getProfile(userId);
      if (!profile || !('xp' in profile)) return;

      // Get all achievements
      const { data: achievements } = await database.getAchievements();
      if (!achievements) return;

      // Get user's current achievements
      const { data: userAchievements } = await database.getUserAchievements(userId);
      const unlockedIds = userAchievements.map(ua => ua.id);

      // Check each achievement condition
      for (const achievement of achievements) {
        if (unlockedIds.includes(achievement.id)) continue;

        let shouldUnlock = false;

        switch (achievement.id) {
          case 1: // First lesson
            shouldUnlock = profile.completed_lessons > 0;
            break;
          case 2: // 7-day streak
            shouldUnlock = profile.streak >= 7;
            break;
          case 3: // 10 lessons
            shouldUnlock = profile.completed_lessons >= 10;
            break;
          case 4: // 5 perfect quizzes
            shouldUnlock = profile.completed_quizzes >= 5;
            break;
          case 5: // Social links
            shouldUnlock = Object.values(profile.social_links).some(link => link !== '');
            break;
          case 6: // Level 5
            shouldUnlock = Math.floor(profile.xp / 1000) >= 5;
            break;
        }

        if (shouldUnlock) {
          await database.unlockAchievement(userId, achievement.id);
        }
      }
    } catch (err) {
      console.error('Error in checkAchievements:', err);
    }
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