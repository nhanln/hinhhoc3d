import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Flame,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Award,
  Sparkles,
  Lock,
  ChevronRight,
  RotateCcw,
  Star,
  Zap,
  Target,
  ArrowRight,
  BookOpen,
  Calendar,
  X
} from 'lucide-react';
import { DailyChallenge, Badge, UserChallengeStats } from '../types/challenge';
import { CHALLENGES } from '../data/challengeData';
import {
  getTodayChallenge,
  getTodayDateString,
  getUserStats,
  recordChallengeCompletion,
  getBadgesWithProgress
} from '../utils/dailyChallengeStorage';
import { useTheme } from '../context/ThemeContext';
import { SolidGeometryOutput } from '../types/geometry';

interface DailyChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadGeometry: (data: SolidGeometryOutput, title: string) => void;
}

export function DailyChallengeModal({
  isOpen,
  onClose,
  onLoadGeometry
}: DailyChallengeModalProps) {
  const { isLight } = useTheme();

  // Active Tab: 'daily' | 'badges' | 'all'
  const [activeTab, setActiveTab] = useState<'daily' | 'badges' | 'all'>('daily');

  // Stats
  const [stats, setStats] = useState<UserChallengeStats>(getUserStats());
  const [badges, setBadges] = useState<Badge[]>(getBadgesWithProgress(stats));

  // Current selected challenge (defaults to today's challenge)
  const [currentChallenge, setCurrentChallenge] = useState<DailyChallenge>(getTodayChallenge());

  // Question answers state: { [questionId]: selectedOptionId }
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  // Show hints state: { [questionId]: boolean }
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});

  // Newly unlocked badge banner
  const [newlyUnlocked, setNewlyUnlocked] = useState<Badge | null>(null);
  const [isChallengeCompleted, setIsChallengeCompleted] = useState<boolean>(false);

  // Sync state whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const currentStats = getUserStats();
      setStats(currentStats);
      setBadges(getBadgesWithProgress(currentStats));

      const todayChallenge = getTodayChallenge();
      setCurrentChallenge(todayChallenge);

      // Check if already completed
      const alreadyCompleted = currentStats.solvedChallengeIds.includes(todayChallenge.id);
      setIsChallengeCompleted(alreadyCompleted);

      // Pre-select correct options if already completed
      if (alreadyCompleted) {
        const preAnswers: Record<string, string> = {};
        todayChallenge.questions.forEach((q) => {
          const correctOpt = q.options.find((o) => o.isCorrect);
          if (correctOpt) preAnswers[q.id] = correctOpt.id;
        });
        setSelectedAnswers(preAnswers);
      } else {
        setSelectedAnswers({});
      }
      setShowHints({});
      setNewlyUnlocked(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const triggerConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 55,
          origin: { x: 0 }
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 55,
          origin: { x: 1 }
        });
      }, 250);
    } catch {
      // Ignore if confetti not available in test
    }
  };

  const handleSelectOption = (questionId: string, optionId: string) => {
    const newAnswers = { ...selectedAnswers, [questionId]: optionId };
    setSelectedAnswers(newAnswers);

    // Check if ALL questions in the current challenge have been answered correctly
    const allAnswered = currentChallenge.questions.every((q) => newAnswers[q.id] !== undefined);
    const allCorrect = currentChallenge.questions.every((q) => {
      const chosenOptId = newAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      return correctOpt && chosenOptId === correctOpt.id;
    });

    if (allAnswered && allCorrect && !isChallengeCompleted) {
      setIsChallengeCompleted(true);
      triggerConfetti();

      // Record completion
      const { updatedStats, newlyUnlockedBadges } = recordChallengeCompletion(currentChallenge.id);
      setStats(updatedStats);
      setBadges(getBadgesWithProgress(updatedStats));

      if (newlyUnlockedBadges.length > 0) {
        setNewlyUnlocked(newlyUnlockedBadges[0]);
      }
    }
  };

  const handleSwitchChallenge = (challenge: DailyChallenge) => {
    setCurrentChallenge(challenge);
    const isCompleted = stats.solvedChallengeIds.includes(challenge.id);
    setIsChallengeCompleted(isCompleted);

    if (isCompleted) {
      const preAnswers: Record<string, string> = {};
      challenge.questions.forEach((q) => {
        const correctOpt = q.options.find((o) => o.isCorrect);
        if (correctOpt) preAnswers[q.id] = correctOpt.id;
      });
      setSelectedAnswers(preAnswers);
    } else {
      setSelectedAnswers({});
    }
    setShowHints({});
    setNewlyUnlocked(null);
    setActiveTab('daily');
  };

  const handleLoadToViewport = () => {
    onLoadGeometry(currentChallenge.geometryData, currentChallenge.title);
  };

  const todayStr = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const unlockedBadgesCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
          isLight
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-slate-900 border-slate-700/80 text-slate-100'
        }`}
      >
        {/* Top Header Bar */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'bg-gradient-to-r from-amber-50 via-indigo-50 to-amber-50 border-slate-200'
              : 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Thử Thách Mỗi Ngày</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> GDPT 2018
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" /> {todayStr}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 font-semibold text-orange-500">
                  <Flame className="w-3.5 h-3.5 fill-orange-500" /> Chuỗi {stats.currentStreak} ngày
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Streak & Score pills */}
            <div
              className={`hidden sm:flex items-center gap-3 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                isLight ? 'bg-white border-slate-200' : 'bg-slate-800 border-slate-700'
              }`}
            >
              <span className="flex items-center gap-1 text-amber-500 font-bold">
                <Zap className="w-3.5 h-3.5 fill-amber-500" /> {stats.totalPoints} XP
              </span>
              <span className="text-slate-300 dark:text-slate-600">|</span>
              <span className="flex items-center gap-1 text-emerald-500 font-semibold">
                <Award className="w-3.5 h-3.5" /> {unlockedBadgesCount}/{badges.length} Huy hiệu
              </span>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isLight
                  ? 'hover:bg-slate-200 text-slate-500'
                  : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Đóng modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switcher */}
        <div
          className={`flex border-b px-6 pt-2 gap-4 ${
            isLight ? 'border-slate-200 bg-slate-50/60' : 'border-slate-800 bg-slate-950/40'
          }`}
        >
          <button
            onClick={() => setActiveTab('daily')}
            className={`pb-2.5 pt-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'daily'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Target className="w-4 h-4" />
            Thử thách bài tập
            {isChallengeCompleted && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('badges')}
            className={`pb-2.5 pt-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'badges'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            Bộ sưu tập Huy hiệu
            <span
              className={`px-1.5 py-0.2 text-xs rounded-full ${
                isLight ? 'bg-indigo-100 text-indigo-700' : 'bg-indigo-950 text-indigo-300'
              }`}
            >
              {unlockedBadgesCount}/{badges.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 pt-1 text-sm font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'all'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Kho thử thách ({CHALLENGES.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Newly Unlocked Badge Banner */}
          {newlyUnlocked && (
            <div className="p-4 rounded-xl border border-amber-400/50 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 backdrop-blur flex items-center justify-between animate-bounce-subtle">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{newlyUnlocked.icon}</span>
                <div>
                  <div className="text-xs font-bold text-amber-500 uppercase tracking-wide flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Mới mở khóa huy hiệu!
                  </div>
                  <h4 className="text-base font-bold">{newlyUnlocked.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {newlyUnlocked.description}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('badges')}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1"
              >
                Xem chi tiết <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* TAB 1: DAILY CHALLENGE */}
          {activeTab === 'daily' && (
            <div className="space-y-6">
              {/* Challenge Card Header */}
              <div
                className={`p-5 rounded-xl border ${
                  isLight
                    ? 'bg-slate-50/80 border-slate-200'
                    : 'bg-slate-800/40 border-slate-700/60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> {currentChallenge.difficulty}
                      </span>
                      <div className="flex items-center text-amber-400">
                        {Array.from({ length: currentChallenge.stars }).map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                        ))}
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                        +{currentChallenge.points} XP
                      </span>
                      {isChallengeCompleted && (
                        <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Đã hoàn thành
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-bold">{currentChallenge.title}</h3>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {currentChallenge.description}
                    </p>
                  </div>

                  {/* 3D Viewport Load Action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleLoadToViewport}
                      className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                    >
                      <Eye className="w-4 h-4" />
                      Mở trên Khung nhìn 3D
                    </button>
                  </div>
                </div>

                {/* Problem Statement Box */}
                <div
                  className={`mt-4 p-3.5 rounded-lg border text-xs leading-relaxed ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-700'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Đề bài tóm tắt:
                  </div>
                  <p>{currentChallenge.geometryData.problem_analysis.problem_statement}</p>
                  <div className="mt-2 font-medium text-slate-500 dark:text-slate-400">
                    <span className="text-rose-500 font-semibold">Mục tiêu:</span>{' '}
                    {currentChallenge.geometryData.problem_analysis.target}
                  </div>
                </div>
              </div>

              {/* Questions Section */}
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-indigo-500" />
                    Các câu hỏi tư duy hình học ({currentChallenge.questions.length} câu)
                  </h4>
                  <span className="text-xs text-slate-400">
                    Chọn đáp án đúng dựa trên suy luận và quan sát mô hình 3D
                  </span>
                </div>

                {currentChallenge.questions.map((question, qIdx) => {
                  const selectedOptId = selectedAnswers[question.id];
                  const hasAnswered = selectedOptId !== undefined;
                  const chosenOpt = question.options.find((o) => o.id === selectedOptId);
                  const isCorrect = chosenOpt?.isCorrect === true;

                  return (
                    <div
                      key={question.id}
                      className={`p-5 rounded-xl border transition-all ${
                        isLight
                          ? 'bg-white border-slate-200 shadow-sm'
                          : 'bg-slate-800/30 border-slate-700/60'
                      }`}
                    >
                      {/* Question prompt */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                            {qIdx + 1}
                          </span>
                          <span className="font-semibold text-sm leading-snug">
                            {question.question}
                          </span>
                        </div>

                        {question.hint && (
                          <button
                            onClick={() =>
                              setShowHints((prev) => ({
                                ...prev,
                                [question.id]: !prev[question.id]
                              }))
                            }
                            className={`text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1 shrink-0 transition-colors ${
                              showHints[question.id]
                                ? 'bg-amber-500/20 text-amber-500 border-amber-500/40'
                                : 'text-slate-400 hover:text-slate-200 border-slate-700'
                            }`}
                          >
                            <HelpCircle className="w-3.5 h-3.5" />
                            {showHints[question.id] ? 'Ẩn gợi ý' : 'Gợi ý'}
                          </button>
                        )}
                      </div>

                      {/* Hint display */}
                      {showHints[question.id] && question.hint && (
                        <div className="mb-3.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs flex items-start gap-2">
                          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold">Gợi ý tư duy:</span> {question.hint}
                          </div>
                        </div>
                      )}

                      {/* Options */}
                      <div className="grid grid-cols-1 gap-2.5">
                        {question.options.map((option) => {
                          const isSelected = selectedOptId === option.id;
                          let optStyle = isLight
                            ? 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                            : 'bg-slate-900/40 border-slate-700/60 hover:bg-slate-700/30';

                          if (hasAnswered) {
                            if (option.isCorrect) {
                              optStyle =
                                'bg-emerald-500/15 border-emerald-500/50 text-emerald-600 dark:text-emerald-400 font-medium';
                            } else if (isSelected && !option.isCorrect) {
                              optStyle =
                                'bg-rose-500/15 border-rose-500/50 text-rose-600 dark:text-rose-400';
                            }
                          } else if (isSelected) {
                            optStyle = 'bg-indigo-500/15 border-indigo-500 text-indigo-500';
                          }

                          return (
                            <button
                              key={option.id}
                              onClick={() => handleSelectOption(question.id, option.id)}
                              className={`p-3 rounded-xl border text-left text-xs sm:text-sm flex items-start justify-between gap-3 transition-all ${optStyle}`}
                            >
                              <div className="flex items-start gap-2.5">
                                <span className="font-bold text-xs uppercase px-1.5 py-0.5 rounded bg-slate-200/50 dark:bg-slate-700/50 shrink-0 mt-0.5">
                                  {option.id.replace('opt-', '').toUpperCase()}
                                </span>
                                <span>{option.text}</span>
                              </div>

                              {hasAnswered && option.isCorrect && (
                                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                              )}
                              {hasAnswered && isSelected && !option.isCorrect && (
                                <XCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Feedback explanation */}
                      {hasAnswered && chosenOpt && (
                        <div
                          className={`mt-3 p-3 rounded-lg text-xs leading-relaxed border ${
                            isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          <div className="font-bold mb-0.5 flex items-center gap-1.5">
                            {isCorrect ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                Chính xác!
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                Chưa đúng, hãy đọc lý giải và chọn lại:
                              </>
                            )}
                          </div>
                          <p>{chosenOpt.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Completion Banner */}
              {isChallengeCompleted && (
                <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-emerald-500/20 border border-emerald-500/40 text-center space-y-3">
                  <div className="w-12 h-12 mx-auto rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      Chúc mừng! Bạn đã hoàn thành thử thách!
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto">
                      Bạn đã củng cố vững chắc kiến thức hình học không gian THPT và nhận được{' '}
                      <span className="font-bold text-amber-500">+{currentChallenge.points} XP</span>!
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setActiveTab('badges')}
                      className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow flex items-center gap-1.5"
                    >
                      <Award className="w-4 h-4" /> Xem Huy hiệu của bạn
                    </button>
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-colors ${
                        isLight
                          ? 'bg-white hover:bg-slate-100 border-slate-300'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                      }`}
                    >
                      Thử thách bài khác
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BADGE SHOWCASE */}
          {activeTab === 'badges' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/10">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-400 to-yellow-500 flex items-center justify-center text-2xl shadow-md">
                    🏆
                  </div>
                  <div>
                    <h3 className="font-bold text-base">Huy Hiệu Thành Tích Hình Học</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mở khóa bằng cách hoàn thành các thử thách và duy trì streak học tập.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="text-xl font-black text-indigo-500">
                      {unlockedBadgesCount} / {badges.length}
                    </div>
                    <div className="text-[11px] text-slate-400 uppercase font-semibold">Đã đạt</div>
                  </div>
                </div>
              </div>

              {/* Grid of Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {badges.map((badge) => {
                  return (
                    <div
                      key={badge.id}
                      className={`p-4 rounded-xl border relative overflow-hidden transition-all ${
                        badge.unlocked
                          ? isLight
                            ? 'bg-gradient-to-br from-amber-50/50 to-white border-amber-300/80 shadow-sm'
                            : 'bg-gradient-to-br from-amber-950/20 to-slate-800/40 border-amber-500/40'
                          : isLight
                          ? 'bg-slate-50/50 border-slate-200 opacity-75'
                          : 'bg-slate-900/30 border-slate-800 opacity-60'
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                            badge.unlocked
                              ? 'bg-amber-500/20 border border-amber-500/30 shadow-inner'
                              : 'bg-slate-700/30 border border-slate-600/30 grayscale'
                          }`}
                        >
                          {badge.icon}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4
                              className={`font-bold text-sm truncate ${
                                badge.unlocked ? 'text-amber-600 dark:text-amber-400' : ''
                              }`}
                            >
                              {badge.title}
                            </h4>
                            {badge.unlocked ? (
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                Đã mở khóa
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                                <Lock className="w-3 h-3" /> Chưa đạt
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                            {badge.description}
                          </p>

                          <div className="mt-3">
                            <div className="flex items-center justify-between text-[11px] mb-1 font-medium text-slate-400">
                              <span>Điều kiện: {badge.requirement}</span>
                              <span>{badge.progress}%</span>
                            </div>
                            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  badge.unlocked
                                    ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                                    : 'bg-indigo-500'
                                }`}
                                style={{ width: `${badge.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ALL CHALLENGES LIBRARY */}
          {activeTab === 'all' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-base">Kho Thử Thách Hình Học Khó</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Luyện tập không giới hạn các bài toán chóp, lăng trụ, và khối lập phương theo
                    chuẩn GDPT 2018.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {CHALLENGES.map((challenge, idx) => {
                  const isSolved = stats.solvedChallengeIds.includes(challenge.id);
                  const isCurrent = currentChallenge.id === challenge.id;

                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                        isCurrent
                          ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                          : isLight
                          ? 'bg-white border-slate-200 hover:border-slate-300'
                          : 'bg-slate-800/30 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-500 font-bold flex items-center justify-center shrink-0 text-sm">
                          {idx + 1}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-500">
                              {challenge.difficulty}
                            </span>
                            <span className="text-xs font-semibold text-amber-500">
                              +{challenge.points} XP
                            </span>
                            {isSolved && (
                              <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Hoàn thành
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm">{challenge.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {challenge.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => handleSwitchChallenge(challenge)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white'
                              : isLight
                              ? 'bg-slate-100 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                          }`}
                        >
                          {isCurrent ? 'Đang giải' : 'Giải bài này'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Mỗi ngày 1 thử thách mới để duy trì thói quen tư duy không gian 3D.</span>
          </div>
          <button
            onClick={onClose}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
