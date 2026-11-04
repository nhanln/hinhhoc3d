import React, { useState, useEffect, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Sparkles,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
  Eye,
  Plus,
  Trash2,
  Save,
  Edit3,
  X,
  Award,
  Clock,
  Check,
  AlertCircle,
  BookOpen,
  Wand2,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SolidGeometryOutput, GeometryVertex, GeometryEdge } from '../types/geometry';
import { ModelQuizSet, QuizQuestion, QuizOption, QuizAttemptResult } from '../types/quiz';
import {
  getQuizForModel,
  saveQuizForModel,
  resetQuizForModel,
  recordQuizAttempt,
  generateSmartQuizForModel
} from '../utils/quizGenerator';
import { useTheme } from '../context/ThemeContext';

interface QuickQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SolidGeometryOutput;
  onHighlightTarget?: (type: 'vertex' | 'edge' | 'face', id: string) => void;
  onSelectVertex?: (vertex: GeometryVertex | null) => void;
  onSelectEdge?: (edge: GeometryEdge | null) => void;
}

export const QuickQuizModal: React.FC<QuickQuizModalProps> = ({
  isOpen,
  onClose,
  data,
  onHighlightTarget,
  onSelectVertex,
  onSelectEdge
}) => {
  const { isLight } = useTheme();

  // Mode: 'student' (taking quiz) | 'teacher' (editing questions)
  const [mode, setMode] = useState<'student' | 'teacher'>('student');

  // Quiz Data
  const [quizSet, setQuizSet] = useState<ModelQuizSet>(() => getQuizForModel(data));

  // Reload quiz when input model changes
  useEffect(() => {
    if (isOpen) {
      setQuizSet(getQuizForModel(data));
      // Reset student test state
      setCurrentQuestionIndex(0);
      setSelectedAnswers({});
      setIsSubmitted(false);
      setShowHint(false);
      setQuizStartTime(Date.now());
      setIsCompleted(false);
    }
  }, [isOpen, data]);

  // Student test states
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({}); // questionId -> optionId
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [showHint, setShowHint] = useState<boolean>(false);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [quizStartTime, setQuizStartTime] = useState<number>(Date.now());
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [notification, setNotification] = useState<string | null>(null);

  // Teacher editing states
  const [editingQuestion, setEditingQuestion] = useState<QuizQuestion | null>(null);
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Timer while taking quiz
  useEffect(() => {
    if (!isOpen || isCompleted || mode !== 'student') return;
    const interval = setInterval(() => {
      setTimeElapsed(Math.floor((Date.now() - quizStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, isCompleted, mode, quizStartTime]);

  const questions = quizSet.questions || [];
  const currentQ = questions[currentQuestionIndex] || null;

  // Selected option for current question
  const currentAnswer = currentQ ? selectedAnswers[currentQ.id] : null;

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  // Student selects an answer
  const handleSelectOption = (optionId: string) => {
    if (isCompleted || !currentQ) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionId
    }));
  };

  // Calculate score upon completion
  const quizResult = useMemo<QuizAttemptResult | null>(() => {
    if (!isCompleted || questions.length === 0) return null;
    let correct = 0;
    questions.forEach((q) => {
      const ansId = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (ansId && correctOpt && ansId === correctOpt.id) {
        correct++;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    return {
      totalQuestions: questions.length,
      correctAnswers: correct,
      score,
      timeSpentSeconds: timeElapsed,
      completedAt: new Date().toISOString(),
      answers: selectedAnswers
    };
  }, [isCompleted, questions, selectedAnswers, timeElapsed]);

  // Finish quiz
  const handleFinishQuiz = () => {
    setIsCompleted(true);
    let correct = 0;
    questions.forEach((q) => {
      const ansId = selectedAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (ansId && correctOpt && ansId === correctOpt.id) correct++;
    });
    const score = Math.round((correct / questions.length) * 100);

    const res: QuizAttemptResult = {
      totalQuestions: questions.length,
      correctAnswers: correct,
      score,
      timeSpentSeconds: timeElapsed,
      completedAt: new Date().toISOString(),
      answers: selectedAnswers
    };
    recordQuizAttempt(res);

    if (score >= 70) {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
      });
    }
  };

  // Retake quiz
  const handleRetakeQuiz = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setIsCompleted(false);
    setShowHint(false);
    setQuizStartTime(Date.now());
    setTimeElapsed(0);
  };

  // Teacher: Save all quiz changes
  const handleSaveTeacherQuiz = () => {
    saveQuizForModel(quizSet);
    showToast('Đã lưu thành công bộ câu hỏi trắc nghiệm!');
  };

  // Teacher: Auto-regenerate smart questions
  const handleAutoGenerate = () => {
    const smart = generateSmartQuizForModel(data);
    setQuizSet(smart);
    saveQuizForModel(smart);
    showToast('Đã tự động tạo bộ câu hỏi thông minh từ mô hình 3D!');
  };

  // Teacher: Reset to default
  const handleResetDefault = () => {
    const reset = resetQuizForModel(data);
    setQuizSet(reset);
    showToast('Đã khôi phục bộ câu hỏi mặc định!');
  };

  // Teacher: Delete a question
  const handleDeleteQuestion = (qId: string) => {
    const updated = {
      ...quizSet,
      questions: quizSet.questions.filter((q) => q.id !== qId)
    };
    setQuizSet(updated);
    saveQuizForModel(updated);
    showToast('Đã xóa câu hỏi.');
  };

  // Highlight on 3D viewport
  const handleInspectOn3D = (targetRef?: { type: 'vertex' | 'edge' | 'face'; id: string }) => {
    if (!targetRef) return;
    if (targetRef.type === 'vertex') {
      const v = data.geometry_3d.vertices.find((item) => item.id === targetRef.id);
      if (v) onSelectVertex?.(v);
    } else if (targetRef.type === 'edge') {
      const parts = targetRef.id.split('-');
      const e = data.geometry_3d.edges.find(
        (item) =>
          (item.start === parts[0] && item.end === parts[1]) ||
          (item.start === parts[1] && item.end === parts[0])
      );
      if (e) onSelectEdge?.(e);
    }
    onHighlightTarget?.(targetRef.type, targetRef.id);
  };

  if (!isOpen) return null;

  const shapeTitle = data.problem_analysis?.shape_type || 'Mô hình 3D';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-3xl max-h-[92vh] flex flex-col rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700/80 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-5 py-4 border-b flex items-center justify-between gap-3 shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700/80'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold leading-tight">Quiz Kiểm Tra Nhanh</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold">
                  {shapeTitle}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {mode === 'student'
                  ? 'Kiểm tra kiến thức hình học không gian & nhận phản hồi tức thì'
                  : 'Chế độ Giáo viên: Tùy chỉnh câu hỏi, đáp án và lời giải chi tiết'}
              </p>
            </div>
          </div>

          {/* Mode Switcher & Close Button */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl border border-slate-300/80 dark:border-slate-700 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setMode('student')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  mode === 'student'
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Học sinh</span>
              </button>
              <button
                type="button"
                onClick={() => setMode('teacher')}
                className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                  mode === 'teacher'
                    ? isLight
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Giáo viên</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              title="Đóng cửa sổ Quiz"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className="px-4 py-2 bg-emerald-500 text-white text-xs font-semibold flex items-center justify-between animate-in slide-in-from-top-1">
            <span>{notification}</span>
            <button type="button" onClick={() => setNotification(null)} className="cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6">
          {mode === 'student' ? (
            /* STUDENT VIEW */
            !isCompleted ? (
              currentQ ? (
                <div className="space-y-5">
                  {/* Top Quiz Bar: Question Counter & Timer */}
                  <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-amber-600 dark:text-amber-400 text-sm">
                        Câu {currentQuestionIndex + 1}/{questions.length}
                      </span>
                      {currentQ.difficulty && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                          {currentQ.difficulty}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        {Math.floor(timeElapsed / 60)
                          .toString()
                          .padStart(2, '0')}
                        :{(timeElapsed % 60).toString().padStart(2, '0')}
                      </span>
                    </div>
                  </div>

                  {/* Question Content */}
                  <div className="space-y-2">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                      {currentQ.question}
                    </h3>

                    {currentQ.hint && showHint && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2 animate-in fade-in">
                        <HelpCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold">Gợi ý tư duy: </span>
                          <span>{currentQ.hint}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 4 Multiple Choice Options */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentQ.options.map((opt) => {
                      const isSelected = currentAnswer === opt.id;
                      const hasAnswered = !!currentAnswer;
                      const isCorrect = opt.isCorrect;

                      // Highlight styles when answered (instant feedback!)
                      let buttonStyle = isLight
                        ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700 text-slate-200';

                      if (hasAnswered) {
                        if (isCorrect) {
                          buttonStyle = isLight
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-2 ring-emerald-300'
                            : 'bg-emerald-950/40 border-emerald-500 text-emerald-300 font-bold ring-2 ring-emerald-500/40';
                        } else if (isSelected && !isCorrect) {
                          buttonStyle = isLight
                            ? 'bg-rose-50 border-rose-400 text-rose-950 font-bold ring-2 ring-rose-300'
                            : 'bg-rose-950/40 border-rose-500 text-rose-300 font-bold ring-2 ring-rose-500/40';
                        }
                      }

                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => handleSelectOption(opt.id)}
                          className={`w-full p-3.5 rounded-2xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer group ${buttonStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                hasAnswered && isCorrect
                                  ? 'bg-emerald-500 text-white'
                                  : hasAnswered && isSelected && !isCorrect
                                  ? 'bg-rose-500 text-white'
                                  : isLight
                                  ? 'bg-slate-200 text-slate-700 group-hover:bg-amber-100 group-hover:text-amber-800'
                                  : 'bg-slate-700 text-slate-300 group-hover:bg-amber-500/20 group-hover:text-amber-300'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="text-sm font-medium leading-snug">{opt.text}</span>
                          </div>

                          {/* Feedback status icons */}
                          {hasAnswered && (
                            <div className="shrink-0">
                              {isCorrect ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              ) : isSelected ? (
                                <XCircle className="w-5 h-5 text-rose-500" />
                              ) : null}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Instant Pedagogical Feedback Card (Displayed immediately once student clicks an option) */}
                  {currentAnswer && (
                    <div
                      className={`p-4 rounded-2xl border transition-all animate-in fade-in slide-in-from-bottom-2 ${
                        currentQ.options.find((o) => o.id === currentAnswer)?.isCorrect
                          ? isLight
                            ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950'
                            : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
                          : isLight
                          ? 'bg-rose-50/80 border-rose-300 text-rose-950'
                          : 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          {currentQ.options.find((o) => o.id === currentAnswer)?.isCorrect ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              <span>Chính xác! Làm rất tốt.</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-500" />
                              <span>
                                Chưa chính xác. Đáp án đúng là{' '}
                                <span className="underline">
                                  {currentQ.options.find((o) => o.isCorrect)?.id}
                                </span>
                              </span>
                            </>
                          )}
                        </div>

                        {currentQ.targetRef && (
                          <button
                            type="button"
                            onClick={() => handleInspectOn3D(currentQ.targetRef)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-700 dark:text-cyan-300 border border-cyan-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition"
                            title="Xoay và phát sáng đối tượng tương ứng trên mô hình 3D"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Xem trên 3D</span>
                          </button>
                        )}
                      </div>

                      <p className="text-xs leading-relaxed opacity-95">
                        <span className="font-bold">💡 Giải thích chi tiết: </span>
                        {currentQ.explanation}
                      </p>
                    </div>
                  )}

                  {/* Actions & Navigation Controls */}
                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {currentQ.hint && !showHint && (
                        <button
                          type="button"
                          onClick={() => setShowHint(true)}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition cursor-pointer flex items-center gap-1.5"
                        >
                          <HelpCircle className="w-3.5 h-3.5" />
                          <span>Xem gợi ý</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={currentQuestionIndex === 0}
                        onClick={() => {
                          setCurrentQuestionIndex((prev) => Math.max(0, prev - 1));
                          setShowHint(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1 transition cursor-pointer ${
                          currentQuestionIndex === 0
                            ? 'opacity-40 cursor-not-allowed border-slate-200 dark:border-slate-800'
                            : isLight
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                        }`}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Câu trước</span>
                      </button>

                      {currentQuestionIndex < questions.length - 1 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentQuestionIndex((prev) => prev + 1);
                            setShowHint(false);
                          }}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 flex items-center gap-1 transition cursor-pointer"
                        >
                          <span>Câu tiếp theo</span>
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={handleFinishQuiz}
                          className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Award className="w-4 h-4" />
                          <span>Hoàn thành bài kiểm tra</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 space-y-3">
                  <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
                  <p className="text-sm font-semibold text-slate-500">
                    Chưa có câu hỏi nào trong bộ Quiz này.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMode('teacher')}
                    className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                  >
                    Chuyển sang chế độ Giáo viên để thêm câu hỏi
                  </button>
                </div>
              )
            ) : (
              /* RESULTS SCREEN */
              quizResult && (
                <div className="space-y-6 text-center py-4">
                  <div className="w-20 h-20 rounded-full mx-auto bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-3xl shadow-xl shadow-orange-500/30 animate-bounce">
                    <Award className="w-10 h-10" />
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                      {quizResult.score >= 80
                        ? '🎉 Xuất sắc! Bạn nắm bài rất vững!'
                        : quizResult.score >= 50
                        ? '👍 Làm tốt lắm! Tiếp tục cố gắng!'
                        : '💪 Hãy ôn lại các khái niệm và thử lại nhé!'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Đã hoàn thành kiểm tra nhanh mô hình {shapeTitle}
                    </p>
                  </div>

                  {/* Score breakdown metrics */}
                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto">
                    <div
                      className={`p-3 rounded-2xl border text-center ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Điểm số
                      </span>
                      <span className="text-2xl font-black text-amber-500">
                        {quizResult.score}/100
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border text-center ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Số câu đúng
                      </span>
                      <span className="text-2xl font-black text-emerald-500">
                        {quizResult.correctAnswers}/{quizResult.totalQuestions}
                      </span>
                    </div>

                    <div
                      className={`p-3 rounded-2xl border text-center ${
                        isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/60 border-slate-700'
                      }`}
                    >
                      <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1">
                        Thời gian
                      </span>
                      <span className="text-2xl font-black text-cyan-500 font-mono">
                        {Math.floor(quizResult.timeSpentSeconds / 60)}m{quizResult.timeSpentSeconds % 60}s
                      </span>
                    </div>
                  </div>

                  {/* Detailed question review */}
                  <div className="text-left space-y-3 pt-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Xem lại chi tiết từng câu hỏi & lời giải
                    </h4>
                    <div className="space-y-2.5 max-h-[240px] overflow-y-auto pr-1">
                      {questions.map((q, idx) => {
                        const ansId = selectedAnswers[q.id];
                        const correctOpt = q.options.find((o) => o.isCorrect);
                        const isCorrect = ansId && correctOpt && ansId === correctOpt.id;

                        return (
                          <div
                            key={q.id}
                            className={`p-3 rounded-xl border text-xs space-y-1.5 ${
                              isCorrect
                                ? isLight
                                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                                  : 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                                : isLight
                                ? 'bg-rose-50/50 border-rose-200 text-rose-950'
                                : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-bold">
                                Câu {idx + 1}: {q.question}
                              </span>
                              {isCorrect ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500 text-white font-bold text-[10px] shrink-0">
                                  Đúng
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-bold text-[10px] shrink-0">
                                  Sai
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] opacity-90">
                              Đáp án của bạn: <b>{ansId || 'Chưa chọn'}</b> | Đáp án đúng: <b>{correctOpt?.id}. {correctOpt?.text}</b>
                            </div>
                            <p className="text-[11px] opacity-80 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                              💡 <b>Giải thích:</b> {q.explanation}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Actions after quiz */}
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                    <button
                      type="button"
                      onClick={handleRetakeQuiz}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Làm lại bài kiểm tra</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('teacher')}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4 text-amber-500" />
                      <span>Chế độ soạn đề của giáo viên</span>
                    </button>
                  </div>
                </div>
              )
            )
          ) : (
            /* TEACHER VIEW (Editor & Question Manager) */
            <div className="space-y-6">
              {/* Teacher Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAutoGenerate}
                    className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    title="Phân tích mô hình 3D hiện tại và tự động sinh câu hỏi hình học"
                  >
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Tự động tạo câu hỏi từ 3D</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newQ: QuizQuestion = {
                        id: `q-custom-${Date.now()}`,
                        question: 'Nhập câu hỏi trắc nghiệm mới tại đây...',
                        options: [
                          { id: 'A', text: 'Lựa chọn A', isCorrect: true },
                          { id: 'B', text: 'Lựa chọn B', isCorrect: false },
                          { id: 'C', text: 'Lựa chọn C', isCorrect: false },
                          { id: 'D', text: 'Lựa chọn D', isCorrect: false }
                        ],
                        explanation: 'Nhập lời giải thích sư phạm chi tiết...',
                        hint: 'Gợi ý giải bài...',
                        difficulty: 'Thông hiểu'
                      };
                      setQuizSet((prev) => ({
                        ...prev,
                        questions: [...prev.questions, newQ]
                      }));
                      setEditingQuestion(newQ);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Thêm câu hỏi mới</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleResetDefault}
                    className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition cursor-pointer"
                  >
                    Khôi phục gốc
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveTeacherQuiz}
                    className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Lưu đề kiểm tra</span>
                  </button>
                </div>
              </div>

              {/* Editing Form when a question is being edited */}
              {editingQuestion && (
                <div
                  className={`p-4 sm:p-5 rounded-2xl border space-y-4 shadow-lg ${
                    isLight ? 'bg-amber-50/50 border-amber-300' : 'bg-slate-800/90 border-amber-500/40'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                    <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Edit3 className="w-4 h-4" />
                      <span>Chỉnh sửa nội dung câu hỏi</span>
                    </h4>
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                    >
                      Đóng biểu mẫu ✕
                    </button>
                  </div>

                  {/* Question Content Input */}
                  <div className="space-y-1">
                    <label className="text-xs font-bold">Nội dung câu hỏi:</label>
                    <textarea
                      rows={2}
                      value={editingQuestion.question}
                      onChange={(e) =>
                        setEditingQuestion({ ...editingQuestion, question: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-400 outline-none"
                    />
                  </div>

                  {/* 4 Options editor */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold block">
                      Các phương án lựa chọn (Tích chọn nút tròn ở đáp án ĐÚNG):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {editingQuestion.options.map((opt, idx) => (
                        <div
                          key={opt.id}
                          className={`flex items-center gap-2 p-2 rounded-xl border ${
                            opt.isCorrect
                              ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 dark:text-emerald-200'
                              : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700'
                          }`}
                        >
                          <input
                            type="radio"
                            name="correctOption"
                            checked={opt.isCorrect}
                            onChange={() => {
                              const updatedOpts = editingQuestion.options.map((o) => ({
                                ...o,
                                isCorrect: o.id === opt.id
                              }));
                              setEditingQuestion({ ...editingQuestion, options: updatedOpts });
                            }}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            title="Đánh dấu đáp án này là ĐÚNG"
                          />
                          <span className="font-bold text-xs w-4">{opt.id}.</span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) => {
                              const updatedOpts = [...editingQuestion.options];
                              updatedOpts[idx] = { ...updatedOpts[idx], text: e.target.value };
                              setEditingQuestion({ ...editingQuestion, options: updatedOpts });
                            }}
                            className="flex-1 p-1 text-xs bg-transparent border-b border-transparent focus:border-amber-400 outline-none"
                            placeholder={`Nội dung lựa chọn ${opt.id}...`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Explanation & Hint */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-bold">💡 Lời giải thích sư phạm:</label>
                      <textarea
                        rows={2}
                        value={editingQuestion.explanation}
                        onChange={(e) =>
                          setEditingQuestion({
                            ...editingQuestion,
                            explanation: e.target.value
                          })
                        }
                        className="w-full p-2 rounded-xl border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-400 outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold">🔍 Gợi ý tư duy:</label>
                      <textarea
                        rows={2}
                        value={editingQuestion.hint || ''}
                        onChange={(e) =>
                          setEditingQuestion({ ...editingQuestion, hint: e.target.value })
                        }
                        className="w-full p-2 rounded-xl border text-xs bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 focus:ring-2 focus:ring-amber-400 outline-none"
                        placeholder="Gợi ý phương pháp giải..."
                      />
                    </div>
                  </div>

                  {/* Save to list button */}
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingQuestion(null)}
                      className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updatedQuestions = quizSet.questions.map((q) =>
                          q.id === editingQuestion.id ? editingQuestion : q
                        );
                        const newQuizSet = { ...quizSet, questions: updatedQuestions };
                        setQuizSet(newQuizSet);
                        saveQuizForModel(newQuizSet);
                        setEditingQuestion(null);
                        showToast('Đã cập nhật câu hỏi!');
                      }}
                      className="px-4 py-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer shadow"
                    >
                      Cập nhật câu hỏi vào đề
                    </button>
                  </div>
                </div>
              )}

              {/* List of current questions */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Danh sách câu hỏi trong đề ({quizSet.questions.length} câu)
                </h4>

                <div className="space-y-2">
                  {quizSet.questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        editingQuestion?.id === q.id
                          ? 'border-amber-500 bg-amber-500/10'
                          : isLight
                          ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                          : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-amber-600 dark:text-amber-400">
                            Câu {idx + 1}:
                          </span>
                          <span className="text-xs font-medium line-clamp-1">{q.question}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                          <span>
                            Đáp án đúng: <b>{q.options.find((o) => o.isCorrect)?.id}</b>
                          </span>
                          <span>•</span>
                          <span className="line-clamp-1">{q.explanation}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {q.targetRef && (
                          <button
                            type="button"
                            onClick={() => handleInspectOn3D(q.targetRef)}
                            className="p-1.5 rounded-lg text-cyan-600 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 transition cursor-pointer"
                            title="Xem đối tượng liên quan trên 3D"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setEditingQuestion(q)}
                          className="px-2.5 py-1 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-amber-500 hover:text-slate-950 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Sửa</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                          title="Xóa câu hỏi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          className={`px-5 py-3 border-t flex items-center justify-between text-xs shrink-0 ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-800/60 border-slate-700/80 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>
              {mode === 'student'
                ? 'Học sinh chọn đáp án để nhận phản hồi và lời giải chi tiết ngay lập tức'
                : 'Giáo viên có thể thêm, sửa, xóa hoặc tự động sinh câu hỏi theo mô hình 3D'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 font-semibold cursor-pointer transition text-slate-800 dark:text-white"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
