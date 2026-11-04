import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  BookOpen,
  Camera,
  PlusCircle,
  Ruler,
  Compass,
  Code2,
  HelpCircle,
  Shapes,
  RotateCcw,
  Layers,
  ChevronDown,
  Info,
  StickyNote,
  Presentation,
  Printer,
  Sun,
  Moon,
  Trophy,
  Flame,
  Award,
  Zap,
  Star,
  Scan,
  Pencil,
  FileText,
  Radio,
  Columns2
} from 'lucide-react';
import { SolidGeometryOutput, GeometryVertex, GeometryEdge, GeometryFace, GeometryNote } from './types/geometry';
import { PRESET_PROBLEMS, PresetProblem } from './data/presetProblems';
import { GeometryViewport3D } from './components/GeometryViewport3D';
import { ProblemInputModal } from './components/ProblemInputModal';
import { MeasurementTool, DistanceMeasurement, DihedralAngleMeasurement } from './components/MeasurementTool';
import { StickyNotesManager } from './components/StickyNotesManager';
import { AnalysisAndHintsPanel } from './components/AnalysisAndHintsPanel';
import { GeometryJsonExporter } from './components/GeometryJsonExporter';
import { Export3DModal } from './components/Export3DModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { VoiceTourModal } from './components/VoiceTourModal';
import { DailyChallengeModal } from './components/DailyChallengeModal';
import { getTodayChallenge, getUserStats } from './utils/dailyChallengeStorage';
import { VoiceTourScript, VoiceTourStep, VoiceTourSettings } from './types/voiceTour';
import { generateVoiceTourScript, saveVoiceTourScript, loadVoiceTourScript } from './utils/voiceTourGenerator';
import { speechManager } from './utils/speechManager';
import { useTheme } from './context/ThemeContext';

export default function App() {
  const { isLight, toggleTheme } = useTheme();
  const [geometryData, setGeometryData] = useState<SolidGeometryOutput>(PRESET_PROBLEMS[0].data);
  const [selectedVertex, setSelectedVertex] = useState<GeometryVertex | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GeometryEdge | null>(null);
  const [selectedFace, setSelectedFace] = useState<GeometryFace | null>(null);

  // Augmented Reality (AR) Mode State
  const [isArMode, setIsArMode] = useState(false);

  // Teacher Freehand Drawing Mode State (Vẽ tay lên không gian 3D)
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  // Parallel Dual View (Chế độ xem song song 3D & 2D)
  const [isDualView, setIsDualView] = useState(false);

  // Daily Challenge & Badges State
  const [isDailyChallengeOpen, setIsDailyChallengeOpen] = useState(false);
  const [userStats, setUserStats] = useState(getUserStats());
  const todayChallenge = getTodayChallenge();

  // Presentation Mode State (Full screen teaching mode)
  const [isPresentationMode, setIsPresentationMode] = useState(false);

  // 3D Model Export State (.STL / .OBJ)
  const [isExport3DModalOpen, setIsExport3DModalOpen] = useState(false);

  // Professional PDF Lesson Plan Export State
  const [isExportPdfModalOpen, setIsExportPdfModalOpen] = useState(false);
  const [pdfSnapshotUrl, setPdfSnapshotUrl] = useState<string | null>(null);
  const getSnapshotRef = useRef<(() => string | null) | null>(null);

  const handleOpenPdfExport = (providedSnapshot?: string | null) => {
    let snap = providedSnapshot;
    if (!snap && getSnapshotRef.current) {
      snap = getSnapshotRef.current();
    }
    setPdfSnapshotUrl(snap || null);
    setIsExportPdfModalOpen(true);
  };

  // Voice Tour (Hướng dẫn bằng giọng nói khi trình chiếu 3D) State
  const [isVoiceTourActive, setIsVoiceTourActive] = useState(false);
  const [voiceTourScript, setVoiceTourScript] = useState<VoiceTourScript>(() =>
    loadVoiceTourScript(PRESET_PROBLEMS[0].data.problem_analysis.shape_type) ||
    generateVoiceTourScript(PRESET_PROBLEMS[0].data)
  );
  const [currentTourStepIndex, setCurrentTourStepIndex] = useState(0);
  const [isTourSpeaking, setIsTourSpeaking] = useState(false);
  const [isTourPaused, setIsTourPaused] = useState(false);
  const [tourSettings, setTourSettings] = useState<VoiceTourSettings>({
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    autoAdvance: true,
    pauseBetweenSteps: 1.5,
    showCaptions: true,
    highlightIn3D: true,
  });
  const [isVoiceTourModalOpen, setIsVoiceTourModalOpen] = useState(false);
  const [activeFocusTarget, setActiveFocusTarget] = useState<{
    type: 'overview' | 'vertex' | 'edge' | 'face';
    id?: string;
    preset?: string;
  } | null>(null);

  const tourAutoAdvanceTimerRef = useRef<any>(null);

  // Sync script when geometryData changes
  useEffect(() => {
    const loaded =
      loadVoiceTourScript(geometryData.problem_analysis.shape_type) ||
      generateVoiceTourScript(geometryData, notes);
    setVoiceTourScript(loaded);
    setCurrentTourStepIndex(0);
    if (isVoiceTourActive) {
      if (tourAutoAdvanceTimerRef.current) clearTimeout(tourAutoAdvanceTimerRef.current);
      speechManager.stop();
      setIsVoiceTourActive(false);
      setIsTourSpeaking(false);
      setIsTourPaused(false);
      setActiveFocusTarget(null);
    }
  }, [geometryData]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      if (tourAutoAdvanceTimerRef.current) clearTimeout(tourAutoAdvanceTimerRef.current);
      speechManager.stop();
    };
  }, []);

  const applyStepFocus = (step: VoiceTourStep) => {
    setActiveFocusTarget({
      type: step.targetType,
      id: step.targetId,
      preset: step.cameraPreset,
    });

    if (step.targetType === 'vertex' && step.targetId) {
      const v = geometryData.geometry_3d.vertices.find((item) => item.id === step.targetId);
      setSelectedVertex(v || null);
      setSelectedEdge(null);
      if (v) handleOpenNoteForTarget('vertex', v.id);
    } else if (step.targetType === 'edge' && step.targetId) {
      const parts = step.targetId.split('-');
      const e = geometryData.geometry_3d.edges.find(
        (edge) =>
          (edge.start === parts[0] && edge.end === parts[1]) ||
          (edge.start === parts[1] && edge.end === parts[0])
      );
      setSelectedEdge(e || null);
      setSelectedVertex(null);
      if (e) handleOpenNoteForTarget('edge', step.targetId);
    } else {
      setSelectedVertex(null);
      setSelectedEdge(null);
    }
  };

  const playTourStep = (stepIndex: number, scriptToUse = voiceTourScript) => {
    if (tourAutoAdvanceTimerRef.current) {
      clearTimeout(tourAutoAdvanceTimerRef.current);
      tourAutoAdvanceTimerRef.current = null;
    }

    const step = scriptToUse.steps[stepIndex];
    if (!step) return;

    setCurrentTourStepIndex(stepIndex);
    applyStepFocus(step);

    speechManager.speak(step.speechText, {
      rate: tourSettings.rate,
      pitch: tourSettings.pitch,
      volume: tourSettings.volume,
      onStart: () => {
        setIsTourSpeaking(true);
        setIsTourPaused(false);
      },
      onEnd: () => {
        setIsTourSpeaking(false);
        setIsTourPaused(false);
        if (tourSettings.autoAdvance) {
          if (stepIndex < scriptToUse.steps.length - 1) {
            tourAutoAdvanceTimerRef.current = setTimeout(() => {
              playTourStep(stepIndex + 1, scriptToUse);
            }, (tourSettings.pauseBetweenSteps || 1.5) * 1000);
          }
        }
      },
      onError: () => {
        setIsTourSpeaking(false);
        setIsTourPaused(false);
      },
    });
  };

  const handleToggleVoiceTour = () => {
    if (isVoiceTourActive) {
      if (tourAutoAdvanceTimerRef.current) {
        clearTimeout(tourAutoAdvanceTimerRef.current);
        tourAutoAdvanceTimerRef.current = null;
      }
      speechManager.stop();
      setIsVoiceTourActive(false);
      setIsTourSpeaking(false);
      setIsTourPaused(false);
      showNotification('Đã dừng Hướng dẫn bằng giọng nói.');
    } else {
      setIsVoiceTourActive(true);
      playTourStep(currentTourStepIndex);
      showNotification('Bắt đầu Hướng dẫn giọng nói: Tự động di chuyển đến các đỉnh và cạnh 3D.');
    }
  };

  const handleVoiceTourNext = () => {
    if (currentTourStepIndex < voiceTourScript.steps.length - 1) {
      playTourStep(currentTourStepIndex + 1);
    }
  };

  const handleVoiceTourPrev = () => {
    if (currentTourStepIndex > 0) {
      playTourStep(currentTourStepIndex - 1);
    }
  };

  const handleVoiceTourPause = () => {
    if (tourAutoAdvanceTimerRef.current) {
      clearTimeout(tourAutoAdvanceTimerRef.current);
      tourAutoAdvanceTimerRef.current = null;
    }
    speechManager.pause();
    setIsTourSpeaking(false);
    setIsTourPaused(true);
  };

  const handleVoiceTourResume = () => {
    speechManager.resume();
    setIsTourSpeaking(true);
    setIsTourPaused(false);
  };

  // Measurement State
  const [isMeasurementOpen, setIsMeasurementOpen] = useState(false);
  const [activeDistance, setActiveDistance] = useState<DistanceMeasurement | null>(null);
  const [activeAngle, setActiveAngle] = useState<DihedralAngleMeasurement | null>(null);

  // Sticky Notes State
  const [notes, setNotes] = useState<GeometryNote[]>([
    {
      id: 'note-sa',
      targetType: 'edge',
      targetId: 'S-A',
      targetLabel: 'Cạnh SA',
      content: 'SA ⊥ (ABC) theo giả thiết. Đây là chiều cao thẳng đứng của hình chóp!',
      color: 'yellow',
      createdAt: '10:30',
      coord: [-2.0, -1.5, 1.9],
    },
    {
      id: 'note-b',
      targetType: 'vertex',
      targetId: 'B',
      targetLabel: 'Đỉnh B',
      content: 'Góc ABC = 90° (đáy vuông tại B). Suy ra BC ⊥ (SAB) và tam giác SBC vuông tại B!',
      color: 'cyan',
      createdAt: '10:32',
      coord: [1.8, -1.5, 0.0],
    },
  ]);
  const [isNotesManagerOpen, setIsNotesManagerOpen] = useState(true);
  const [selectedNoteTarget, setSelectedNoteTarget] = useState<{
    type: 'vertex' | 'edge';
    id: string;
    label: string;
    coord?: [number, number, number];
  } | null>(null);

  // Input Modal State
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Keyboard shortcut for presentation mode (Esc to exit)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPresentationMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // API Call to analyze geometry problem
  const handleAnalyzeGeometry = async (params: { prompt?: string; imageBase64?: string; mimeType?: string }) => {
    setIsLoadingAi(true);
    try {
      const response = await fetch('/api/analyze-geometry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Lỗi khi phân tích hình học không gian.');
      }

      const result: SolidGeometryOutput = await response.json();
      setGeometryData(result);
      setSelectedVertex(null);
      setSelectedEdge(null);
      setSelectedFace(null);
      setActiveDistance(null);
      setActiveAngle(null);
      setSelectedNoteTarget(null);
      showNotification(`Đã phân tích và dựng thành công mô hình 3D: ${result.problem_analysis.shape_type}`);
    } catch (err: any) {
      console.error('Error in handleAnalyzeGeometry:', err);
      showNotification(err.message || 'Không thể kết nối đến AI.', 'error');
      throw err;
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleSelectPreset = (preset: PresetProblem) => {
    setGeometryData(preset.data);
    setSelectedVertex(null);
    setSelectedEdge(null);
    setSelectedFace(null);
    setActiveDistance(null);
    setActiveAngle(null);
    setSelectedNoteTarget(null);
    showNotification(`Đã tải mô hình bài mẫu: ${preset.title}`);
  };

  // Open Sticky Note for specific Vertex or Edge
  const handleOpenNoteForTarget = (targetType: 'vertex' | 'edge', targetId: string) => {
    let label = '';
    let coord: [number, number, number] | undefined;

    if (targetType === 'vertex') {
      const v = geometryData.geometry_3d.vertices.find((item) => item.id === targetId);
      label = `Đỉnh ${v?.label || targetId}`;
      coord = v?.coord;
      if (v) setSelectedVertex(v);
    } else {
      const parts = targetId.split('-');
      const v1 = geometryData.geometry_3d.vertices.find((item) => item.id === parts[0]);
      const v2 = geometryData.geometry_3d.vertices.find((item) => item.id === parts[1]);
      label = `Cạnh ${v1?.label || parts[0]}${v2?.label || parts[1]}`;
      if (v1 && v2) {
        coord = [
          (v1.coord[0] + v2.coord[0]) / 2,
          (v1.coord[1] + v2.coord[1]) / 2,
          (v1.coord[2] + v2.coord[2]) / 2,
        ];
        const edgeObj = geometryData.geometry_3d.edges.find(
          (e) => (e.start === parts[0] && e.end === parts[1]) || (e.start === parts[1] && e.end === parts[0])
        );
        if (edgeObj) setSelectedEdge(edgeObj);
      }
    }

    setSelectedNoteTarget({
      type: targetType,
      id: targetId,
      label,
      coord,
    });
    setIsNotesManagerOpen(true);
  };

  const handleSaveNote = (noteData: Omit<GeometryNote, 'id' | 'createdAt'>) => {
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    setNotes((prev) => {
      const existingIdx = prev.findIndex(
        (n) => n.targetType === noteData.targetType && n.targetId === noteData.targetId
      );
      if (existingIdx !== -1) {
        const next = [...prev];
        next[existingIdx] = {
          ...next[existingIdx],
          content: noteData.content,
          color: noteData.color,
          createdAt: nowTime,
        };
        showNotification(`Đã cập nhật ghi chú cho ${noteData.targetLabel}`);
        return next;
      } else {
        const newNote: GeometryNote = {
          ...noteData,
          id: `note-${Date.now()}`,
          createdAt: nowTime,
        };
        showNotification(`Đã ghim ghi chú 3D cho ${noteData.targetLabel}`);
        return [newNote, ...prev];
      }
    });
  };

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showNotification('Đã xóa ghi chú cá nhân.');
  };

  const handleFocusTargetFromNote = (targetType: 'vertex' | 'edge', targetId: string) => {
    if (targetType === 'vertex') {
      const v = geometryData.geometry_3d.vertices.find((item) => item.id === targetId);
      if (v) setSelectedVertex(v);
    } else {
      const parts = targetId.split('-');
      const edgeObj = geometryData.geometry_3d.edges.find(
        (e) => (e.start === parts[0] && e.end === parts[1]) || (e.start === parts[1] && e.end === parts[0])
      );
      if (edgeObj) setSelectedEdge(edgeObj);
    }
    handleOpenNoteForTarget(targetType, targetId);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200 ${
      isLight ? 'bg-slate-100 text-slate-800' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Header Navbar */}
      <header className={`border-b sticky top-0 z-40 px-4 lg:px-8 py-3 transition-colors duration-200 backdrop-blur-md ${
        isLight ? 'bg-white/95 border-slate-200 shadow-sm' : 'bg-slate-900/80 border-slate-800/80'
      }`}>
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white shrink-0">
              <Shapes className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className={`text-sm lg:text-base font-bold tracking-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Trợ Lý AI Hình Học Không Gian 3D
                </h1>
                <span className={`hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isLight
                    ? 'bg-cyan-50 text-cyan-700 border-cyan-200'
                    : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                }`}>
                  GDPT 2018
                </span>
              </div>
              <p className={`text-[11px] hidden sm:block ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Tự động phân tích ảnh đề bài SGK, lời nói & dựng mô hình 3D chuẩn xác
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2">
            {/* Quick Presets Dropdown */}
            <div className="relative group hidden md:block">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer flex items-center gap-1.5 ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 border-slate-700/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-500" />
                <span>Bài mẫu SGK</span>
                <ChevronDown className={`w-3 h-3 ${isLight ? 'text-slate-500' : 'text-slate-400'}`} />
              </button>
              <div className={`absolute right-0 top-full mt-1.5 w-64 p-2 border rounded-2xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50 space-y-1 ${
                isLight ? 'bg-white border-slate-200 shadow-slate-200/80' : 'bg-slate-900 border-slate-800 shadow-2xl'
              }`}>
                {PRESET_PROBLEMS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset)}
                    className={`w-full text-left p-2 rounded-xl text-xs transition cursor-pointer truncate block ${
                      isLight
                        ? 'hover:bg-slate-100 text-slate-700 hover:text-cyan-700'
                        : 'hover:bg-slate-800/80 text-slate-300 hover:text-cyan-300'
                    }`}
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Daily Challenge & Badges Button */}
            <button
              type="button"
              onClick={() => setIsDailyChallengeOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-orange-400 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-orange-500/25 active:scale-95 animate-pulse-slow"
              title="Thử thách mỗi ngày bài tập hình học khó & Mở khóa huy hiệu học tập"
            >
              <Trophy className="w-3.5 h-3.5 fill-white/20" />
              <span className="hidden sm:inline">Thử thách ngày</span>
              <span className="sm:hidden">Thử thách</span>
              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-black/25 text-amber-100 font-extrabold border border-white/20">
                <Flame className="w-2.5 h-2.5 fill-amber-300 text-amber-300" />
                {userStats.currentStreak}
              </span>
            </button>

            {/* Sticky Notes Button */}
            <button
              type="button"
              onClick={() => setIsNotesManagerOpen(!isNotesManagerOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border shadow-sm relative ${
                isNotesManagerOpen
                  ? isLight
                    ? 'bg-amber-100 border-amber-300 text-amber-800 font-semibold'
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300 font-semibold'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60'
              }`}
              title="Ghi chú cá nhân trên các đỉnh và cạnh của mô hình 3D"
            >
              <StickyNote className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Ghi chú 3D</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white font-bold">
                {notes.length}
              </span>
            </button>

            {/* Measurement Tool Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMeasurementOpen(!isMeasurementOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer flex items-center gap-1.5 border shadow-sm ${
                isMeasurementOpen || activeDistance || activeAngle
                  ? isLight
                    ? 'bg-cyan-100 border-cyan-300 text-cyan-800 font-semibold'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300 font-semibold'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60'
              }`}
              title="Công cụ đo khoảng cách giữa 2 đỉnh hoặc đo góc giữa 2 mặt phẳng"
            >
              <Ruler className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">Công cụ đo</span>
            </button>

            {/* 3D Model Export Button */}
            <button
              type="button"
              onClick={() => setIsExport3DModalOpen(true)}
              className={`px-3 py-1.5 rounded-xl font-medium text-xs border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:text-cyan-700'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60 hover:text-cyan-300'
              }`}
              title="Xuất mô hình 3D thành tệp .OBJ hoặc .STL để in 3D hay mở trong AutoCAD / Blender"
            >
              <Printer className="w-3.5 h-3.5 text-cyan-500" />
              <span className="hidden sm:inline">Xuất 3D</span>
            </button>

            {/* Professional PDF Lesson Plan Export Button */}
            <button
              type="button"
              onClick={() => handleOpenPdfExport()}
              className={`px-3 py-1.5 rounded-xl font-medium text-xs border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 hover:text-rose-900 shadow-rose-500/10'
                  : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 shadow-rose-500/10'
              }`}
              title="Xuất bài giảng hình học hoàn chỉnh kèm mô hình 3D, phân tích đề, ghi chú ghim thành PDF A4 cho giáo viên"
            >
              <FileText className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline">Xuất PDF bài giảng</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* Voice-Guided Tour (Hướng dẫn bằng giọng nói) Button */}
            <button
              type="button"
              onClick={handleToggleVoiceTour}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isVoiceTourActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-400 ring-2 ring-purple-300 font-bold animate-pulse'
                  : isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:text-purple-900 shadow-purple-500/10'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 shadow-purple-500/10'
              }`}
              title="Hướng dẫn bằng giọng nói cho giáo viên khi trình chiếu 3D (Tự động di chuyển đến các đỉnh, cạnh và hiển thị ghi chú)"
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isVoiceTourActive ? 'Đang thuyết minh' : 'Thuyết minh'}</span>
              <span className="sm:hidden">Giọng nói</span>
            </button>

            {/* Augmented Reality (AR) Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isArMode;
                setIsArMode(next);
                if (next) {
                  showNotification('Đang mở Thực tế ảo (AR)... Vui lòng cho phép quyền truy cập Camera để chiếu mô hình 3D.');
                } else {
                  showNotification('Đã tắt chế độ Thực tế ảo AR.');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isArMode
                  ? 'bg-rose-500 text-white border-rose-400 ring-2 ring-rose-300 font-bold animate-pulse'
                  : isLight
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white border-emerald-600 shadow-emerald-500/20'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
              }`}
              title="Bật/Tắt chế độ Thực tế ảo (AR): Chiếu mô hình hình học 3D lên bàn học qua Camera"
            >
              <Scan className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isArMode ? 'Tắt AR' : 'Thực tế ảo AR'}</span>
              <span className="sm:hidden">AR</span>
            </button>

            {/* Teacher Freehand Drawing Mode Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isDrawingMode;
                setIsDrawingMode(next);
                if (next) {
                  showNotification('Đã kích hoạt chế độ Vẽ tay. Dùng chuột hoặc bút cảm ứng để vẽ đường phụ, đường cao lên mô hình 3D.');
                } else {
                  showNotification('Đã tắt chế độ Vẽ tay.');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isDrawingMode
                  ? 'bg-indigo-600 text-white border-indigo-400 ring-2 ring-indigo-300 font-bold'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:text-indigo-700'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60 hover:text-indigo-300'
              }`}
              title="Bật/Tắt chế độ Vẽ tay trực tiếp lên mô hình 3D (dành cho giáo viên vẽ đường phụ & giảng bài)"
            >
              <Pencil className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Vẽ tay</span>
            </button>

            {/* Dual 3D + 2D Projection Parallel View Button */}
            <button
              type="button"
              onClick={() => {
                const next = !isDualView;
                setIsDualView(next);
                if (next) {
                  showNotification('Đã bật Chế độ xem song song: Hiển thị đồng thời mô hình 3D phối cảnh và hình chiếu 2D phẳng.');
                } else {
                  showNotification('Đã tắt Chế độ xem song song.');
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isDualView
                  ? 'bg-teal-600 text-white border-teal-500 ring-2 ring-teal-300 font-bold'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 hover:text-teal-700'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700/60 hover:text-teal-300'
              }`}
              title="Bật/Tắt Chế độ xem song song: Hiển thị đồng thời mô hình 3D và hình chiếu 2D (đứng, bằng, cạnh)"
            >
              <Columns2 className="w-3.5 h-3.5 text-teal-400" />
              <span className="hidden sm:inline">Xem song song</span>
            </button>

            {/* Presentation Mode Button */}
            <button
              type="button"
              onClick={() => setIsPresentationMode(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium text-xs transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-purple-500/20"
              title="Chế độ Trình chiếu toàn màn hình dành cho giáo viên giảng bài (Phím tắt: Esc để thoát)"
            >
              <Presentation className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trình chiếu</span>
            </button>

            {/* Theme Toggle Button (Light Mode / Dark Mode) */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center justify-center shadow-sm ${
                isLight
                  ? 'bg-amber-100/90 hover:bg-amber-200 text-amber-800 border-amber-300 ring-1 ring-amber-300/50'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700/60 hover:text-cyan-300'
              }`}
              title={isLight ? 'Đang bật Chế độ Sáng (Ban ngày). Nhấp để chuyển sang Chế độ Tối' : 'Chuyển sang Chế độ Sáng (Light Mode) cho lớp học'}
              aria-label="Đổi giao diện sáng tối"
            >
              {isLight ? (
                <Sun className="w-4 h-4 text-amber-600 animate-in spin-in-180 duration-300" />
              ) : (
                <Moon className="w-4 h-4 text-slate-300 animate-in spin-in-180 duration-300" />
              )}
            </button>

            {/* Input Problem Button */}
            <button
              type="button"
              onClick={() => setIsInputModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span className="hidden sm:inline">Nhập đề mới (Ảnh/Mic)</span>
              <span className="sm:hidden">Đề mới</span>
            </button>
          </div>
        </div>
      </header>

      {/* Global Toast Notification */}
      {notification && (
        <div
          className={`fixed top-16 right-4 z-50 px-4 py-2.5 rounded-xl text-xs font-medium shadow-2xl backdrop-blur-md border animate-in slide-in-from-top duration-200 flex items-center gap-2 ${
            notification.type === 'error'
              ? isLight
                ? 'bg-rose-100 border-rose-300 text-rose-800'
                : 'bg-rose-950/90 border-rose-500/50 text-rose-200'
              : isLight
                ? 'bg-cyan-100 border-cyan-300 text-cyan-900'
                : 'bg-cyan-950/90 border-cyan-500/50 text-cyan-200'
          }`}
        >
          <Info className="w-4 h-4 shrink-0" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* Top 3D Viewport Section */}
        <section className="space-y-2">
          <GeometryViewport3D
            data={geometryData}
            selectedVertexId={selectedVertex?.id}
            selectedEdge={selectedEdge}
            selectedFaceName={selectedFace?.name}
            activeDistance={activeDistance}
            activeAngle={activeAngle}
            notes={notes}
            isPresentationMode={isPresentationMode}
            isArMode={isArMode}
            onSelectVertex={(v) => {
              setSelectedVertex(v);
              if (v) handleOpenNoteForTarget('vertex', v.id);
            }}
            onSelectEdge={(e) => {
              setSelectedEdge(e);
              if (e) handleOpenNoteForTarget('edge', `${e.start}-${e.end}`);
            }}
            onSelectFace={(f) => setSelectedFace(f)}
            onOpenMeasurement={() => setIsMeasurementOpen(true)}
            onOpenNoteForTarget={handleOpenNoteForTarget}
            onOpenNotesManager={() => setIsNotesManagerOpen(true)}
            onTogglePresentationMode={() => setIsPresentationMode(!isPresentationMode)}
            onOpenExport3D={() => setIsExport3DModalOpen(true)}
            onOpenExportPdf={(snap) => handleOpenPdfExport(snap)}
            registerGetSnapshot={(fn) => {
              getSnapshotRef.current = fn;
            }}
            onToggleArMode={() => setIsArMode((prev) => !prev)}
            isDrawingMode={isDrawingMode}
            onToggleDrawingMode={() => setIsDrawingMode((prev) => !prev)}
            isDualView={isDualView}
            onToggleDualView={() => setIsDualView((prev) => !prev)}
            isVoiceTourActive={isVoiceTourActive}
            onToggleVoiceTour={handleToggleVoiceTour}
            voiceTourScript={voiceTourScript}
            currentVoiceTourIndex={currentTourStepIndex}
            isVoiceTourSpeaking={isTourSpeaking}
            isVoiceTourPaused={isTourPaused}
            voiceTourSettings={tourSettings}
            activeFocusTarget={activeFocusTarget}
            onVoiceTourPlay={() => playTourStep(currentTourStepIndex)}
            onVoiceTourPause={handleVoiceTourPause}
            onVoiceTourResume={handleVoiceTourResume}
            onVoiceTourNext={handleVoiceTourNext}
            onVoiceTourPrev={handleVoiceTourPrev}
            onVoiceTourSelectStep={(idx) => playTourStep(idx)}
            onVoiceTourUpdateSettings={(newSt) => setTourSettings((prev) => ({ ...prev, ...newSt }))}
            onOpenVoiceTourEditor={() => setIsVoiceTourModalOpen(true)}
          />
        </section>

        {/* Sticky Notes Manager Section */}
        {isNotesManagerOpen && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-200">
            <StickyNotesManager
              notes={notes}
              selectedTarget={selectedNoteTarget}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onCloseEditor={() => setSelectedNoteTarget(null)}
              onFocusTarget={handleFocusTargetFromNote}
            />
          </section>
        )}

        {/* Measurement Tool Section (When Activated) */}
        {isMeasurementOpen && (
          <section className="animate-in fade-in slide-in-from-top-2 duration-200">
            <MeasurementTool
              data={geometryData}
              activeDistance={activeDistance}
              activeAngle={activeAngle}
              onUpdateDistance={(m) => {
                setActiveDistance(m);
                setActiveAngle(null);
                if (m) {
                  showNotification(`Đã đo khoảng cách: d(${m.vertex1.label}, ${m.vertex2.label}) = ${m.distance}`);
                }
              }}
              onUpdateAngle={(m) => {
                setActiveAngle(m);
                setActiveDistance(null);
                if (m) {
                  showNotification(`Đã tính góc nhị diện: ${m.angleDeg}° giữa ${m.plane1Name} và ${m.plane2Name}`);
                }
              }}
              onClearMeasurement={() => {
                setActiveDistance(null);
                setActiveAngle(null);
              }}
            />
          </section>
        )}

        {/* Two-Column Grid: Problem Analysis & Pedagogical Hints + Coordinate Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <AnalysisAndHintsPanel
              data={geometryData}
              selectedVertexId={selectedVertex?.id}
              selectedEdge={selectedEdge}
              selectedFaceName={selectedFace?.name}
              onSelectVertex={(v) => {
                setSelectedVertex(v);
                if (v) handleOpenNoteForTarget('vertex', v.id);
              }}
              onSelectEdge={(e) => {
                setSelectedEdge(e);
                if (e) handleOpenNoteForTarget('edge', `${e.start}-${e.end}`);
              }}
              onSelectFace={(f) => setSelectedFace(f)}
            />
          </div>

          <div className="space-y-6">
            {/* Daily Challenge Mini-Widget Card */}
            <div
              className={`p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isLight
                  ? 'bg-gradient-to-br from-amber-50/80 via-white to-orange-50/80 border-amber-200/90 shadow-sm'
                  : 'bg-gradient-to-br from-amber-950/25 via-slate-900 to-orange-950/20 border-amber-500/30'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-sm">
                    <Trophy className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      Thử Thách Mỗi Ngày
                    </h3>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="flex items-center gap-0.5 text-xs font-bold text-orange-500">
                    <Flame className="w-3.5 h-3.5 fill-orange-500" />
                    {userStats.currentStreak}
                  </span>
                  <span className="text-[11px] text-slate-400">ngày</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {todayChallenge.difficulty}
                  </span>
                  <div className="flex text-amber-400">
                    {Array.from({ length: todayChallenge.stars }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 fill-amber-400" />
                    ))}
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-500">
                    +{todayChallenge.points} XP
                  </span>
                </div>
                <h4 className="text-xs font-bold line-clamp-1 text-slate-800 dark:text-slate-100">
                  {todayChallenge.title}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                  {todayChallenge.description}
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-amber-200/50 dark:border-amber-500/20 flex items-center justify-between gap-2">
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <Award className="w-3 h-3 text-amber-500" />
                  <span>{userStats.unlockedBadgeIds.length}/8 Huy hiệu</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDailyChallengeOpen(true)}
                  className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-sm flex items-center gap-1 transition-all hover:scale-105 active:scale-95"
                >
                  <span>Bắt đầu giải</span>
                  <Trophy className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Quick Action & Info Card */}
            <div className={`p-4 rounded-2xl border space-y-3 transition-colors ${
              isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}>
              <h3 className={`text-xs font-semibold flex items-center gap-1.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                <span>Quy Ước Hình Học Không Gian GDPT 2018</span>
              </h3>
              <div className={`space-y-2 text-[11px] leading-relaxed ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <p>
                  • <strong className={isLight ? 'text-slate-900 font-semibold' : 'text-slate-200'}>Giao diện sáng/tối (Themes):</strong> Hỗ trợ chế độ nền sáng có độ tương phản cao phục vụ máy chiếu và màn hình tương tác lớp học ban ngày.
                </p>
                <p>
                  • <strong className={isLight ? 'text-slate-900 font-semibold' : 'text-slate-200'}>Ghi chú cá nhân (Sticky Notes):</strong> Nhấp vào bất kỳ đỉnh hoặc cạnh nào trong không gian 3D để đính kèm ghi chú, mẹo tư duy hoặc giả thiết bài toán.
                </p>
                <p>
                  • <strong className={isLight ? 'text-slate-900 font-semibold' : 'text-slate-200'}>Hệ trục tọa độ:</strong> Mặt đáy nằm trên Oxy (z = 0), chiều cao thẳng đứng theo Oz (z &gt; 0).
                </p>
                <p>
                  • <strong className={isLight ? 'text-slate-900 font-semibold' : 'text-slate-200'}>Nét đứt SGK:</strong> Tự động đánh dấu cạnh khuất (isDashed = true) khi nhìn từ góc quan sát chính diện.
                </p>
                <p>
                  • <strong className={isLight ? 'text-slate-900 font-semibold' : 'text-slate-200'}>Ký hiệu góc vuông:</strong> Tự động đánh dấu 3D tại chân đường cao và các góc vuông của đáy.
                </p>
              </div>
            </div>

            {/* JSON Schema Exporter */}
            <GeometryJsonExporter
              data={geometryData}
              onImportJson={(imported) => {
                setGeometryData(imported);
                showNotification(`Đã nạp thành công mô hình từ tệp JSON: ${imported.problem_analysis.shape_type}`);
              }}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={`border-t py-4 px-6 text-center text-xs transition-colors ${
        isLight ? 'border-slate-200 bg-white text-slate-500' : 'border-slate-800/80 bg-slate-950 text-slate-500'
      }`}>
        Trợ lý AI Hình Học Không Gian 3D • Chương trình GDPT 2018 môn Toán THPT • Tích hợp Three.js & Gemini 3.8 Flash
      </footer>

      {/* Input Modal */}
      <ProblemInputModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onSubmit={handleAnalyzeGeometry}
        onSelectPreset={handleSelectPreset}
        isLoading={isLoadingAi}
      />

      {/* 3D Model Export Modal (.OBJ / .STL) */}
      <Export3DModal
        isOpen={isExport3DModalOpen}
        onClose={() => setIsExport3DModalOpen(false)}
        data={geometryData}
      />

      {/* Professional PDF Lesson Plan Export Modal */}
      <ExportPdfModal
        isOpen={isExportPdfModalOpen}
        onClose={() => setIsExportPdfModalOpen(false)}
        data={geometryData}
        notes={notes}
        snapshotDataUrl={pdfSnapshotUrl}
      />

      {/* Daily Geometry Challenge & Badges Modal */}
      <DailyChallengeModal
        isOpen={isDailyChallengeOpen}
        onClose={() => {
          setIsDailyChallengeOpen(false);
          setUserStats(getUserStats());
        }}
        onLoadGeometry={(challengeGeom, title) => {
          setGeometryData(challengeGeom);
          setSelectedVertex(null);
          setSelectedEdge(null);
          setSelectedFace(null);
          setActiveDistance(null);
          setActiveAngle(null);
          setSelectedNoteTarget(null);
          setIsDailyChallengeOpen(false);
          showNotification(`Đã mở mô hình thử thách 3D: ${title}`);
        }}
      />

      {/* Voice-Guided Tour Script Editor Modal */}
      <VoiceTourModal
        isOpen={isVoiceTourModalOpen}
        onClose={() => setIsVoiceTourModalOpen(false)}
        script={voiceTourScript}
        geometryData={geometryData}
        settings={tourSettings}
        onSaveScript={(updated) => {
          setVoiceTourScript(updated);
          showNotification('Đã cập nhật kịch bản thuyết minh giọng nói.');
        }}
        onUpdateSettings={(newSt) => setTourSettings((prev) => ({ ...prev, ...newSt }))}
        isLight={isLight}
      />
    </div>
  );
}
