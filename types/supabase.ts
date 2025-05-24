export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          xp: number
          completed_quizzes: number[]
          completed_lessons: number[]
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          xp?: number
          completed_quizzes?: number[]
          completed_lessons?: number[]
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          xp?: number
          completed_quizzes?: number[]
          completed_lessons?: number[]
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          profile_id: string
          quiz_id: string
          score: number
          total_questions: number
          time_taken: number
          completed_at: string
          xp_earned: number
          is_perfect: boolean
          created_at: string
        }
        Insert: {
          id?: string
          profile_id: string
          quiz_id: string
          score: number
          total_questions: number
          time_taken: number
          completed_at?: string
          xp_earned?: number
          is_perfect?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          profile_id?: string
          quiz_id?: string
          score?: number
          total_questions?: number
          time_taken?: number
          completed_at?: string
          xp_earned?: number
          is_perfect?: boolean
          created_at?: string
        }
      }
      quizzes: {
        Row: {
          id: string
          title: string
          description: string
          time_limit: number
          passing_score: number
          xp_reward: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          time_limit: number
          passing_score: number
          xp_reward: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          time_limit?: number
          passing_score?: number
          xp_reward?: number
          created_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          quiz_id: string
          question: string
          options: string[]
          correct_answer: number
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          quiz_id: string
          question: string
          options: string[]
          correct_answer: number
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          quiz_id?: string
          question?: string
          options?: string[]
          correct_answer?: number
          explanation?: string | null
          created_at?: string
        }
      }
      learning_activity: {
        Row: {
          id: string
          user_id: string
          activity_date: string
          activity_type: string
          quiz_id: string | null
          xp_earned: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_date: string
          activity_type: string
          quiz_id?: string | null
          xp_earned: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_date?: string
          activity_type?: string
          quiz_id?: string | null
          xp_earned?: number
          created_at?: string
        }
      }
    }
    Functions: {
      complete_quiz: {
        Args: {
          p_profile_id: string
          p_quiz_id: string
          p_score: number
          p_total_questions: number
          p_time_taken: number
        }
        Returns: {
          xp_earned: number
          is_perfect: boolean
          passed: boolean
        }[]
      }
      calculate_quiz_xp: {
        Args: {
          p_score: number
          p_total_questions: number
          p_time_taken: number
        }
        Returns: number
      }
    }
  }
} 