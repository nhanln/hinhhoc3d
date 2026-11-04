import { SolidGeometryOutput } from './geometry';

export interface QuizOption {
  id: string; // 'A' | 'B' | 'C' | 'D'
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
  explanation: string;
  hint?: string;
  targetRef?: {
    type: 'vertex' | 'edge' | 'face';
    id: string;
    label?: string;
  };
  difficulty?: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng';
}

export interface ModelQuizSet {
  shapeType: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  updatedAt: string;
  isCustom?: boolean;
}

export interface QuizAttemptResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number; // 0 - 100
  timeSpentSeconds: number;
  completedAt: string;
  answers: Record<string, string>; // questionId -> optionId
}
