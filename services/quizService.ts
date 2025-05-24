import { supabase, ensureProfile } from '../lib/supabase';
import { QuizAttempt, QuizCompletionResult, QuizStats, QuizQuestion, Quiz } from '../types/quiz';

export class QuizService {
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
    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('profile_id', userId)
      .eq('quiz_id', quizId)
      .order('completed_at', { ascending: false });
    if (error) throw error;
    return data || [];
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

  async completeQuiz(
    quizId: string,
    score: number,
    totalQuestions: number,
    timeTaken: number
  ): Promise<QuizCompletionResult> {
    try {
      // Ensure user is authenticated and has a profile
      const profile = await ensureProfile();

      // Call the complete_quiz function
      const { data, error } = await supabase
        .rpc('complete_quiz', {
          p_profile_id: profile.id,
          p_quiz_id: quizId,
          p_score: score,
          p_total_questions: totalQuestions,
          p_time_taken: timeTaken
        });

      if (error) {
        console.error('Error completing quiz:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        throw new Error('No data returned from quiz completion');
      }

      const result = data[0];
      return {
        xpEarned: result.xp_earned,
        isPerfect: result.is_perfect,
        passed: result.passed,
        quizId
      };
    } catch (error) {
      console.error('Error in completeQuiz:', error);
      throw error;
    }
  }

  async getQuizAttempts(quizId: string): Promise<QuizAttempt[]> {
    try {
      // Ensure user is authenticated and has a profile
      await ensureProfile();

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('*')
        .eq('quiz_id', quizId)
        .order('completed_at', { ascending: false });

      if (error) {
        console.error('Error fetching quiz attempts:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getQuizAttempts:', error);
      throw error;
    }
  }

  async getQuizStats(quizId: string): Promise<QuizStats> {
    try {
      // Ensure user is authenticated and has a profile
      await ensureProfile();

      const { data, error } = await supabase
        .from('quiz_attempts')
        .select('score, total_questions, is_perfect')
        .eq('quiz_id', quizId);

      if (error) {
        console.error('Error fetching quiz stats:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        return {
          totalAttempts: 0,
          averageScore: 0,
          bestScore: 0,
          perfectAttempts: 0
        };
      }

      const totalAttempts = data.length;
      const perfectAttempts = data.filter((attempt: QuizAttempt) => attempt.is_perfect).length;
      const averageScore = data.reduce((sum: number, attempt: QuizAttempt) => 
        sum + (attempt.score / attempt.total_questions), 0) / totalAttempts * 100;
      const bestScore = Math.max(...data.map((attempt: QuizAttempt) => 
        (attempt.score / attempt.total_questions) * 100));

      return {
        totalAttempts,
        averageScore,
        bestScore,
        perfectAttempts
      };
    } catch (error) {
      console.error('Error in getQuizStats:', error);
      throw error;
    }
  }

  async getQuiz(quizId: string): Promise<Quiz | null> {
    try {
      // Ensure user is authenticated and has a profile
      await ensureProfile();

      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();

      if (error) {
        console.error('Error fetching quiz:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error in getQuiz:', error);
      throw error;
    }
  }

  async getQuizQuestions(quizId: string): Promise<QuizQuestion[]> {
    try {
      // Ensure user is authenticated and has a profile
      await ensureProfile();

      const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('id');

      if (error) {
        console.error('Error fetching quiz questions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getQuizQuestions:', error);
      throw error;
    }
  }
}

export const quizService = QuizService.getInstance(); 