import { DailyChallenge, Badge, UserChallengeStats } from '../types/challenge';
import { CHALLENGES, BADGES } from '../data/challengeData';

const STORAGE_KEY = 'daily_geometry_challenge_stats_v1';

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Deterministically pick today's challenge based on the date string
 */
export function getTodayChallenge(): DailyChallenge {
  const dateStr = getTodayDateString();
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = (hash << 5) - hash + dateStr.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % CHALLENGES.length;
  return CHALLENGES[index];
}

/**
 * Get user stats from localStorage with default fallback
 */
export function getUserStats(): UserChallengeStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        currentStreak: 0,
        bestStreak: 0,
        lastSolvedDate: null,
        totalSolved: 0,
        totalPoints: 0,
        solvedChallengeIds: [],
        unlockedBadgeIds: []
      };
    }
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load user challenge stats from localStorage:', e);
    return {
      currentStreak: 0,
      bestStreak: 0,
      lastSolvedDate: null,
      totalSolved: 0,
      totalPoints: 0,
      solvedChallengeIds: [],
      unlockedBadgeIds: []
    };
  }
}

/**
 * Save user stats to localStorage
 */
export function saveUserStats(stats: UserChallengeStats): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
  } catch (e) {
    console.error('Failed to save user challenge stats to localStorage:', e);
  }
}

/**
 * Record a completed challenge, update streak, calculate points, and evaluate unlocked badges
 */
export function recordChallengeCompletion(challengeId: string): {
  updatedStats: UserChallengeStats;
  newlyUnlockedBadges: Badge[];
} {
  const stats = getUserStats();
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const challenge = CHALLENGES.find((c) => c.id === challengeId);
  const pointsEarned = challenge ? challenge.points : 100;

  // Streak logic
  let newStreak = stats.currentStreak;
  if (stats.lastSolvedDate !== today) {
    if (stats.lastSolvedDate === yesterday) {
      newStreak += 1;
    } else {
      newStreak = 1; // start new streak
    }
  }

  const bestStreak = Math.max(stats.bestStreak, newStreak);
  const isNewSolve = !stats.solvedChallengeIds.includes(challengeId);
  const solvedChallengeIds = isNewSolve
    ? [...stats.solvedChallengeIds, challengeId]
    : stats.solvedChallengeIds;

  const totalPoints = isNewSolve ? stats.totalPoints + pointsEarned : stats.totalPoints;
  const totalSolved = solvedChallengeIds.length;

  const updatedStats: UserChallengeStats = {
    ...stats,
    currentStreak: newStreak,
    bestStreak,
    lastSolvedDate: today,
    totalSolved,
    totalPoints,
    solvedChallengeIds
  };

  // Check badges to unlock
  const previouslyUnlocked = new Set(stats.unlockedBadgeIds);
  const newlyUnlockedBadges: Badge[] = [];
  const currentUnlockedIds = [...stats.unlockedBadgeIds];

  const checkAndUnlock = (badgeId: string) => {
    if (!previouslyUnlocked.has(badgeId)) {
      currentUnlockedIds.push(badgeId);
      const badgeObj = BADGES.find((b) => b.id === badgeId);
      if (badgeObj) {
        newlyUnlockedBadges.push({
          ...badgeObj,
          unlocked: true,
          unlockedAt: new Date().toLocaleDateString('vi-VN'),
          progress: 100
        });
      }
    }
  };

  // 1. First solve
  if (totalSolved >= 1) {
    checkAndUnlock('first_solve');
  }

  // 2. Streak 3
  if (newStreak >= 3 || bestStreak >= 3) {
    checkAndUnlock('streak_3');
  }

  // 3. Streak 7
  if (newStreak >= 7 || bestStreak >= 7) {
    checkAndUnlock('streak_7');
  }

  // 4. Perpendicular master (Chóp tam giác)
  if (solvedChallengeIds.includes('challenge-chop-tam-giac')) {
    checkAndUnlock('perpendicular_master');
  }

  // 5. Dihedral master (Chóp tứ giác đều)
  if (solvedChallengeIds.includes('challenge-chop-tu-giac-deu')) {
    checkAndUnlock('dihedral_master');
  }

  // 6. Cube explorer (Hình lập phương)
  if (solvedChallengeIds.includes('challenge-hinh-lap-phuong')) {
    checkAndUnlock('cube_explorer');
  }

  // 7. Skew lines master (Lăng trụ đứng)
  if (solvedChallengeIds.includes('challenge-lang-tru-tam-giac')) {
    checkAndUnlock('skew_lines_master');
  }

  // 8. All-rounder (Solved all 5)
  if (totalSolved >= CHALLENGES.length) {
    checkAndUnlock('all_rounder');
  }

  updatedStats.unlockedBadgeIds = currentUnlockedIds;
  saveUserStats(updatedStats);

  return {
    updatedStats,
    newlyUnlockedBadges
  };
}

/**
 * Returns all badges with computed progress & unlocked status
 */
export function getBadgesWithProgress(stats: UserChallengeStats): Badge[] {
  const solvedCount = stats.solvedChallengeIds.length;
  const unlockedSet = new Set(stats.unlockedBadgeIds);

  return BADGES.map((b) => {
    const isUnlocked = unlockedSet.has(b.id);
    let progress = 0;

    switch (b.id) {
      case 'first_solve':
        progress = Math.min(100, solvedCount >= 1 ? 100 : 0);
        break;
      case 'streak_3':
        progress = Math.min(100, Math.round((Math.max(stats.currentStreak, stats.bestStreak) / 3) * 100));
        break;
      case 'streak_7':
        progress = Math.min(100, Math.round((Math.max(stats.currentStreak, stats.bestStreak) / 7) * 100));
        break;
      case 'perpendicular_master':
        progress = stats.solvedChallengeIds.includes('challenge-chop-tam-giac') ? 100 : 0;
        break;
      case 'dihedral_master':
        progress = stats.solvedChallengeIds.includes('challenge-chop-tu-giac-deu') ? 100 : 0;
        break;
      case 'cube_explorer':
        progress = stats.solvedChallengeIds.includes('challenge-hinh-lap-phuong') ? 100 : 0;
        break;
      case 'skew_lines_master':
        progress = stats.solvedChallengeIds.includes('challenge-lang-tru-tam-giac') ? 100 : 0;
        break;
      case 'all_rounder':
        progress = Math.min(100, Math.round((solvedCount / CHALLENGES.length) * 100));
        break;
      default:
        progress = isUnlocked ? 100 : 0;
    }

    return {
      ...b,
      unlocked: isUnlocked,
      progress: isUnlocked ? 100 : progress
    };
  });
}
