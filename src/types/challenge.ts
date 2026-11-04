import { SolidGeometryOutput } from './geometry';

export interface ChallengeQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
  hint?: string;
  relatedTarget?: string;
}

export interface DailyChallenge {
  id: string;
  presetId: string;
  title: string;
  difficulty: 'Trung bình' | 'Khó' | 'Vận dụng cao';
  stars: number; // 3, 4, or 5
  description: string;
  tags: string[];
  points: number;
  geometryData: SolidGeometryOutput;
  questions: ChallengeQuestion[];
}

export interface Badge {
  id: string;
  title: string;
  description: string;
  category: 'streak' | 'mastery' | 'milestone' | 'special';
  icon: string; // Emoji or Lucide icon name
  unlockedAt?: string; // ISO date string
  requirement: string;
  progress: number; // 0 to 100
  unlocked: boolean;
}

export interface UserChallengeStats {
  currentStreak: number;
  bestStreak: number;
  lastSolvedDate: string | null; // 'YYYY-MM-DD'
  totalSolved: number;
  totalPoints: number;
  solvedChallengeIds: string[];
  unlockedBadgeIds: string[];
}
