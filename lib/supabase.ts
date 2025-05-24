import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Database } from '../types/supabase';

// Get environment variables from Expo config
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. Please check your app.config.js and .env file');
}

// Create Supabase client with auth configuration
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
    },
    db: {
        schema: 'public'
    }
});

// Function to ensure user profile exists
export async function ensureProfile() {
    try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
            throw new Error('Authentication error');
        }
        
        if (!user) {
            throw new Error('User not authenticated');
        }

        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profileError) {
            // If profile doesn't exist (PGRST116), create it
            if (profileError.code === 'PGRST116') {
                const { error: insertError } = await supabase
                    .from('profiles')
                    .insert({
                        id: user.id,
                        xp: 0,
                        completed_quizzes: [],
                        completed_lessons: []
                    });

                if (insertError) {
                    throw insertError;
                }

                // Return the newly created profile
                return {
                    id: user.id,
                    xp: 0,
                    completed_quizzes: [],
                    completed_lessons: []
                };
            }
            throw profileError;
        }

        return profile;
    } catch (error) {
        throw error;
    }
}

// Type for quiz completion result
type QuizCompletionResult = {
    xp_earned: number;
    is_perfect: boolean;
    passed: boolean;
};

// Helper function to complete a quiz
export async function completeQuiz(
    quizId: string | number,
    score: number,
    totalQuestions: number,
    timeTaken: number
): Promise<QuizCompletionResult> {
    try {
        const profile = await ensureProfile();
        
        // Get the user's session for the access token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.access_token) throw new Error('No access token available');

        // Make the RPC call
        const { data, error } = await supabase.rpc('complete_quiz', {
            p_profile_id: profile.id,
            p_quiz_id: String(quizId),
            p_score: score,
            p_time_taken: timeTaken,
            p_total_questions: totalQuestions,
        });

        if (error) {
            throw error;
        }

        if (!data) {
            throw new Error('No data returned from complete_quiz');
        }

        return data;
    } catch (error) {
        throw error;
    }
}

// Test function to generate random quiz completion
export async function testQuizCompletion() {
    try {
        // Get the user's session for the access token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!session?.access_token) throw new Error('No access token available');

        // Get the user's profile
        const profile = await ensureProfile();

        // Generate random quiz data
        const quizId = '1';  // Using a fixed quiz ID for testing
        const score = Math.floor(Math.random() * 10) + 1;  // Random score between 1-10
        const totalQuestions = 10;  // Fixed total questions
        const timeTaken = Math.floor(Math.random() * 300) + 60;  // Random time between 60-360 seconds

        return {
            profileId: profile.id,
            quizId,
            score,
            totalQuestions,
            timeTaken,
            accessToken: session.access_token
        };
    } catch (error) {
        throw error;
    }
} 