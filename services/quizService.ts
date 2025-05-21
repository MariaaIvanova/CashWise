import { supabase, database } from '../supabase';
import { auth } from '../supabase';

export interface QuizAttempt {
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

export interface QuizCompletionData {
  score: number;
  totalQuestions: number;
  xpEarned: number;
  timeBonus: number;
  perfectScore: boolean;
  passedQuiz: boolean;
  previousBestScore: number;
  attemptsCount: number;
  recommendations: string[];
  tips: string[];
  personalityType?: string;
  description?: string;
  explanation?: string;
  personalityColor?: string;
  currentXP?: number;
  newXP?: number;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  timeRemaining: number;
  passed: boolean;
  perfectScore: boolean;
}

class QuizService {
  private static instance: QuizService;
  private readonly BASE_XP = 100;
  private readonly PERFECT_SCORE_BONUS = 50;
  private readonly TIME_BONUS_MULTIPLIER = 0.167; // 10 XP per minute
  private readonly PASSING_SCORE_PERCENTAGE = 80;

  private constructor() {}

  public static getInstance(): QuizService {
    if (!QuizService.instance) {
      QuizService.instance = new QuizService();
    }
    return QuizService.instance;
  }

  private calculateScore(result: QuizResult): number {
    return (result.score / result.totalQuestions) * 100;
  }

  private calculateTimeBonus(timeRemaining: number): number {
    return Math.floor(timeRemaining * this.TIME_BONUS_MULTIPLIER);
  }

  private async getPreviousAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    const { data, error } = await database.getQuizAttempts(userId);
    if (error) throw error;
    return (data as QuizAttempt[] || []).filter(attempt => attempt.quiz_id === quizId);
  }

  private async calculateXP(
    userId: string,
    quizId: string,
    result: QuizResult
  ): Promise<{ xpEarned: number; previousBestScore: number }> {
    const attempts = await this.getPreviousAttempts(userId, quizId);
    const scorePercentage = this.calculateScore(result);
    const previousBestScore = attempts.length > 0
      ? Math.max(...attempts.map(attempt => (attempt.score / attempt.total_questions) * 100))
      : 0;

    let xpEarned = 0;
    if (result.passed) {
      if (attempts.length === 0) {
        // First attempt - award full XP
        xpEarned = this.BASE_XP + this.calculateTimeBonus(result.timeRemaining);
        if (result.perfectScore) {
          xpEarned += this.PERFECT_SCORE_BONUS;
        }
      } else if (scorePercentage > previousBestScore) {
        // Score improvement - award difference in XP
        const previousXP = Math.floor((previousBestScore / 100) * this.BASE_XP);
        const currentXP = Math.floor((scorePercentage / 100) * this.BASE_XP);
        xpEarned = Math.max(0, currentXP - previousXP);
        
        if (result.perfectScore && previousBestScore < 100) {
          xpEarned += this.PERFECT_SCORE_BONUS;
        }
        xpEarned += this.calculateTimeBonus(result.timeRemaining);
      }
    }

    return { xpEarned, previousBestScore };
  }

  private generateRecommendations(
    result: QuizResult,
    attemptsCount: number,
    previousBestScore: number
  ): { recommendations: string[]; tips: string[] } {
    const recommendations: string[] = [];
    const tips: string[] = [];
    const scorePercentage = this.calculateScore(result);

    if (!result.passed) {
      recommendations.push(
        "За да преминете урока и получите XP, трябва да наберете поне 80% от възможните точки.",
        "Препоръчваме да прегледате урока отново внимателно."
      );
      tips.push(
        "Направете бележки по време на четенето за по-добро разбиране.",
        "Не бързайте с отговорите - внимателно прочетете всеки въпрос.",
        "Използвайте обясненията след всеки въпрос за по-добро разбиране."
      );
    } else if (attemptsCount > 0) {
      if (scorePercentage > previousBestScore) {
        recommendations.push(
          "Поздравления! Подобрихте резултата си!",
          "Продължете да подобрявате знанията си с други уроци."
        );
        tips.push(
          "Запазете знанията си свежи, като редовно преглеждате материалите.",
          "Споделете успеха си с приятели и покани ги да се присъединят!"
        );
      } else {
        recommendations.push(
          "Добър резултат, но не подобрихте предишния си най-добър резултат.",
          "Опитайте отново, за да подобрите резултата си и да спечелите допълнителна XP."
        );
        tips.push(
          "Фокусирайте се върху темите, в които имате затруднения.",
          "Направете бележки по време на урока за по-лесно запомняне."
        );
      }
    } else {
      if (result.perfectScore) {
        recommendations.push(
          "Перфектен резултат! Отлично представяне!",
          "Продължете към по-напреднали теми за още знания."
        );
        tips.push(
          "Вашите знания са на отлично ниво - споделете ги с други!",
          "Пробвайте ежедневните предизвикателства за допълнителна XP.",
          "Помогнете на други потребители в общността."
        );
      } else {
        recommendations.push(
          "Отлично представяне! Можете да продължите към по-напреднали теми.",
          "Пробвайте ежедневните предизвикателства за допълнителна XP."
        );
        tips.push(
          "Запазете знанията си свежи, като редовно преглеждате материалите.",
          "Споделете успеха си с приятели и покани ги да се присъединят!"
        );
      }
    }

    return { recommendations, tips };
  }

  public async completeQuiz(
    quizId: string,
    result: QuizResult,
    personalityType?: string
  ): Promise<QuizCompletionData> {
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError || !user) throw new Error('User not found');

      // Get current profile for XP
      const { data: profile, error: profileError } = await database.getProfile(user.id);
      if (profileError || !profile) throw new Error('Profile not found');

      const currentXP = profile.xp || 0;
      const attempts = await this.getPreviousAttempts(user.id, quizId);
      const { xpEarned, previousBestScore } = await this.calculateXP(user.id, quizId, result);
      const { recommendations, tips } = this.generateRecommendations(
        result,
        attempts.length,
        previousBestScore
      );

      // Insert quiz attempt
      const { error: insertError } = await supabase
        .from('quiz_attempts')
        .insert({
          profile_id: user.id,
          quiz_id: quizId,
          score: result.score,
          total_questions: result.totalQuestions,
          time_taken: 60 - result.timeRemaining,
          personality_type: personalityType,
          completed_at: new Date().toISOString()
        });

      if (insertError) throw insertError;

      // Convert quizId to integer
      const quizIdInt = parseInt(quizId, 10);
      if (isNaN(quizIdInt)) {
        throw new Error('Invalid quiz ID format');
      }

      // Update profile XP and completed quizzes
      const { error: updateError } = await supabase
        .rpc('update_profile_quiz_completion', {
          p_user_id: user.id,
          p_xp: currentXP + xpEarned,
          p_completed_quizzes: quizIdInt,  // Pass single integer instead of array
          p_updated_at: new Date().toISOString()
        });

      if (updateError) throw updateError;

      // If quiz is passed, mark the lesson as complete
      if (result.passed) {
        const { error: lessonError } = await supabase
          .rpc('complete_lesson', {
            p_user_id: user.id,
            p_lesson_id: quizId,
            p_xp_earned: xpEarned,
            p_current_xp: currentXP,
            p_current_completed_lessons: profile.completed_lessons || 0
          });

        if (lessonError) {
          console.error('Error marking lesson as complete:', lessonError);
          // Don't throw here, as the quiz completion was successful
        }
      }

      return {
        score: result.score,
        totalQuestions: result.totalQuestions,
        xpEarned,
        timeBonus: this.calculateTimeBonus(result.timeRemaining),
        perfectScore: result.perfectScore,
        passedQuiz: result.passed,
        previousBestScore,
        attemptsCount: attempts.length,
        recommendations,
        tips,
        personalityType,
        currentXP,
        newXP: currentXP + xpEarned
      };
    } catch (error) {
      console.error('Error completing quiz:', error);
      throw error;
    }
  }

  public async checkPreviousAttempts(quizId: string): Promise<boolean> {
    try {
      const { user, error: userError } = await auth.getCurrentUser();
      if (userError || !user) throw new Error('User not found');

      const attempts = await this.getPreviousAttempts(user.id, quizId);
      return attempts.length > 0;
    } catch (error) {
      console.error('Error checking previous attempts:', error);
      throw error;
    }
  }
}

export const quizService = QuizService.getInstance(); 