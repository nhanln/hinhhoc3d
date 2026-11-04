import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Settings2,
  RotateCcw,
  Sparkles,
  Maximize2,
  ChevronDown,
  ChevronUp,
  X,
  Radio,
  FileEdit,
  Pin
} from 'lucide-react';
import { VoiceTourScript, VoiceTourStep, VoiceTourSettings } from '../types/voiceTour';

interface VoiceTourFloatingWidgetProps {
  script: VoiceTourScript;
  currentStepIndex: number;
  isSpeaking: boolean;
  isPaused: boolean;
  settings: VoiceTourSettings;
  isPresentationMode: boolean;
  isLight: boolean;
  onPlay: () => void;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSelectStep: (index: number) => void;
  onUpdateSettings: (newSettings: Partial<VoiceTourSettings>) => void;
  onOpenScriptEditor: () => void;
  onClose: () => void;
}

export const VoiceTourFloatingWidget: React.FC<VoiceTourFloatingWidgetProps> = ({
  script,
  currentStepIndex,
  isSpeaking,
  isPaused,
  settings,
  isPresentationMode,
  isLight,
  onPlay,
  onPause,
  onResume,
  onNext,
  onPrev,
  onSelectStep,
  onUpdateSettings,
  onOpenScriptEditor,
  onClose,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const currentStep: VoiceTourStep | undefined = script.steps[currentStepIndex];
  const totalSteps = script.steps.length;

  if (!currentStep) return null;

  return (
    <div
      className={`absolute z-30 transition-all duration-300 pointer-events-auto ${
        isPresentationMode
          ? 'bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-4xl'
          : 'bottom-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[680px]'
      }`}
    >
      <div
        className={`rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden transition-all duration-300 ${
          isLight
            ? 'bg-white/95 border-indigo-200 shadow-indigo-950/15 text-slate-800'
            : 'bg-slate-900/95 border-indigo-500/30 shadow-black/60 text-slate-100'
        }`}
      >
        {/* Top Header Strip */}
        <div
          className={`px-4 py-2 flex items-center justify-between border-b text-xs ${
            isLight
              ? 'bg-gradient-to-r from-indigo-50/80 via-purple-50/50 to-sky-50/80 border-indigo-100 text-indigo-900'
              : 'bg-gradient-to-r from-indigo-950/50 via-slate-900 to-sky-950/40 border-slate-800 text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="relative flex items-center justify-center">
              <span className="flex h-2.5 w-2.5 relative">
                {isSpeaking && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                )}
                <span
                  className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                    isSpeaking ? 'bg-indigo-500' : isPaused ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                />
              </span>
            </div>
            <div className="flex items-center gap-1.5 font-bold tracking-tight">
              <Radio className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
              <span>Thuyết Minh 3D</span>
            </div>
            <span className="text-slate-400 dark:text-slate-600">|</span>
            <span className="text-[11px] font-medium opacity-85">
              Bước {currentStepIndex + 1}/{totalSteps}: {currentStep.title}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Speed Rate Toggle */}
            <button
              type="button"
              onClick={() => {
                const nextRate = settings.rate === 0.8 ? 1.0 : settings.rate === 1.0 ? 1.2 : 0.8;
                onUpdateSettings({ rate: nextRate });
              }}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
              title="Tốc độ đọc giọng nói"
            >
              {settings.rate}x
            </button>

            {/* Script Editor Button */}
            <button
              type="button"
              onClick={onOpenScriptEditor}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isLight ? 'hover:bg-slate-200/70 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title="Chỉnh sửa kịch bản bài giảng"
            >
              <FileEdit className="w-3.5 h-3.5 text-indigo-500" />
            </button>

            {/* Minimize / Expand Toggle */}
            <button
              type="button"
              onClick={() => setIsMinimized(!isMinimized)}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isLight ? 'hover:bg-slate-200/70 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
              }`}
              title={isMinimized ? 'Mở rộng bảng thuyết minh' : 'Thu nhỏ bảng thuyết minh'}
            >
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition cursor-pointer ${
                isLight ? 'hover:bg-rose-100 text-rose-600' : 'hover:bg-rose-950/60 text-rose-400'
              }`}
              title="Tắt hướng dẫn giọng nói"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-200 dark:bg-slate-800 h-1">
          <div
            className="bg-gradient-to-r from-indigo-500 to-sky-500 h-1 transition-all duration-300"
            style={{ width: `${((currentStepIndex + 1) / totalSteps) * 100}%` }}
          />
        </div>

        {!isMinimized && (
          <div className="p-3 md:p-4 space-y-3">
            {/* Live Subtitle / Caption Display with Audio Waveform */}
            <div
              className={`p-3 rounded-xl border flex items-start gap-3 transition-colors ${
                isLight
                  ? 'bg-indigo-50/50 border-indigo-100 text-slate-900'
                  : 'bg-slate-950/60 border-slate-800 text-slate-100'
              }`}
            >
              {/* Sound Waveform Bars */}
              <div className="flex items-end gap-0.5 pt-1 shrink-0 h-5" title="Chỉ báo âm thanh">
                <span
                  className={`w-1 bg-indigo-500 rounded-full transition-all ${
                    isSpeaking ? 'h-5 animate-pulse' : 'h-1.5 opacity-40'
                  }`}
                />
                <span
                  className={`w-1 bg-sky-500 rounded-full transition-all ${
                    isSpeaking ? 'h-3.5 animate-pulse delay-75' : 'h-2 opacity-40'
                  }`}
                />
                <span
                  className={`w-1 bg-indigo-400 rounded-full transition-all ${
                    isSpeaking ? 'h-4.5 animate-pulse delay-150' : 'h-1 opacity-40'
                  }`}
                />
                <span
                  className={`w-1 bg-purple-500 rounded-full transition-all ${
                    isSpeaking ? 'h-3 animate-pulse delay-100' : 'h-2 opacity-40'
                  }`}
                />
              </div>

              {/* Subtitle text */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                    Phụ đề bài giảng:
                  </span>
                  {currentStep.targetLabel && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                      🎯 {currentStep.targetLabel}
                    </span>
                  )}
                  {currentStep.noteId && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                      <Pin className="w-2.5 h-2.5" /> Ghi chú ghim
                    </span>
                  )}
                </div>
                <p className="text-xs md:text-sm font-medium leading-relaxed select-text">
                  "{currentStep.speechText}"
                </p>
              </div>
            </div>

            {/* Step navigation & Controls Strip */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              {/* Step indicator buttons */}
              <div className="hidden sm:flex items-center gap-1 overflow-x-auto py-1">
                {script.steps.map((st, idx) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => onSelectStep(idx)}
                    className={`h-6 px-2 rounded-md text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      idx === currentStepIndex
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400 font-bold scale-105'
                        : isLight
                        ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                    title={st.title}
                  >
                    B.{idx + 1}
                  </button>
                ))}
              </div>

              {/* Main Playback Controls */}
              <div className="flex items-center gap-2 ml-auto">
                <button
                  type="button"
                  onClick={onPrev}
                  disabled={currentStepIndex === 0}
                  className={`p-2 rounded-xl border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Bước trước đó"
                >
                  <SkipBack className="w-4 h-4" />
                </button>

                {/* Primary Play / Pause button */}
                {isSpeaking ? (
                  <button
                    type="button"
                    onClick={onPause}
                    className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition cursor-pointer active:scale-95"
                    title="Tạm dừng giọng nói"
                  >
                    <Pause className="w-4 h-4 fill-slate-950" />
                    <span>Tạm dừng</span>
                  </button>
                ) : isPaused ? (
                  <button
                    type="button"
                    onClick={onResume}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition cursor-pointer active:scale-95"
                    title="Tiếp tục nghe"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Tiếp tục</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onPlay}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition cursor-pointer active:scale-95 animate-pulse-slow"
                    title="Bắt đầu thuyết minh giọng nói"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Thuyết minh</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onNext}
                  disabled={currentStepIndex >= totalSteps - 1}
                  className={`p-2 rounded-xl border transition cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                    isLight
                      ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
                  }`}
                  title="Bước kế tiếp"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
