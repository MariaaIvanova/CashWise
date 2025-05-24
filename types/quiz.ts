export interface QuizAttempt {
    id: string;
    profile_id: string;
    quiz_id: string;
    score: number;
    total_questions: number;
    time_taken: number;
    completed_at: string;
    xp_earned: number;
    is_perfect: boolean;
    created_at: string;
}

export interface QuizCompletionResult {
    xpEarned: number;
    isPerfect: boolean;
    passed: boolean;
    quizId: string;
}

export interface QuizStats {
    totalAttempts: number;
    averageScore: number;
    bestScore: number;
    perfectAttempts: number;
}

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number;
    explanation?: string;
}

export interface Quiz {
    id: string;
    title: string;
    description: string;
    questions: QuizQuestion[];
    timeLimit: number;  // in seconds
    passingScore: number;  // percentage
    xpReward: number;
} 