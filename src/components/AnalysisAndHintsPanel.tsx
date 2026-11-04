import React, { useState } from 'react';
import {
  Lightbulb,
  FileText,
  Target,
  ListFilter,
  CheckCircle,
  HelpCircle,
  Layers,
  Activity,
  Square,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Calculator,
  ArrowRight
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SolidGeometryOutput, GeometryVertex, GeometryEdge, GeometryFace } from '../types/geometry';
import { FormulasPanel } from './FormulasPanel';

interface AnalysisAndHintsPanelProps {
  data: SolidGeometryOutput;
  selectedVertexId?: string | null;
  selectedEdge?: { start: string; end: string } | null;
  selectedFaceName?: string | null;
  onSelectVertex?: (vertex: GeometryVertex | null) => void;
  onSelectEdge?: (edge: GeometryEdge | null) => void;
  onSelectFace?: (face: GeometryFace | null) => void;
}

export const AnalysisAndHintsPanel: React.FC<AnalysisAndHintsPanelProps> = ({
  data,
  selectedVertexId,
  selectedEdge,
  selectedFaceName,
  onSelectVertex,
  onSelectEdge,
  onSelectFace,
}) => {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'analysis' | 'hints' | 'formulas' | 'inspector'>('analysis');
  const [expandedSection, setExpandedSection] = useState<'hypothesis' | 'target' | 'all'>('all');

  const { problem_analysis, pedagogical_hints, geometry_3d } = data;

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-xl flex flex-col h-full transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Tab Navigation */}
      <div className={`flex border-b px-4 transition-colors ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
      }`}>
        <button
          type="button"
          onClick={() => setActiveTab('analysis')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'analysis'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
              : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Phân tích đề bài
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('hints')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'hints'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
              : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Lightbulb className="w-3.5 h-3.5" />
          Gợi ý sư phạm GDPT 2018
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('formulas')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'formulas'
              ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400 font-bold'
              : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Calculator className="w-3.5 h-3.5" />
          <span>Công thức liên quan</span>
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block ml-0.5 animate-pulse" />
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('inspector')}
          className={`flex items-center gap-1.5 py-3 px-3 text-xs font-medium border-b-2 transition cursor-pointer ${
            activeTab === 'inspector'
              ? 'border-cyan-500 text-cyan-600 dark:text-cyan-400 font-bold'
              : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Thanh tra tọa độ
        </button>
      </div>

      {/* Tab Content */}
      <div className={`p-4 overflow-y-auto space-y-4 text-xs flex-1 ${
        isLight ? 'text-slate-700' : 'text-slate-300'
      }`}>
        {/* TAB 1: Analysis */}
        {activeTab === 'analysis' && (
          <div className="space-y-3.5">
            {/* Problem Statement Card */}
            <div className={`p-3.5 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-slate-950/60 border-slate-800/80 text-slate-200'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1">
                Đề bài tóm tắt
              </span>
              <p className={`leading-relaxed font-sans text-xs ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {problem_analysis.problem_statement}
              </p>
            </div>

            {/* Shape Type & Classification */}
            <div className={`flex items-center justify-between p-3 rounded-xl border ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/40 border-slate-800/60'
            }`}>
              <span className={isLight ? 'text-slate-500' : 'text-slate-400'}>Dạng hình học:</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                {problem_analysis.shape_type}
              </span>
            </div>

            {/* Quick Link to Formulas for this Shape */}
            <div className={`flex items-center justify-between p-2.5 rounded-xl border transition-colors ${
              isLight ? 'bg-indigo-50/70 border-indigo-200/80 text-indigo-950' : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200'
            }`}>
              <div className="flex items-center gap-2">
                <Calculator className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                <span className="text-xs font-semibold">Công thức khối {problem_analysis.shape_type}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('formulas')}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Xem công thức</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            {/* Hypotheses List */}
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
            }`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Các giả thiết toán học
              </span>
              <div className="space-y-1.5">
                {problem_analysis.hypothesis.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                    <span className={`leading-snug ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Target */}
            <div className={`p-3.5 rounded-xl border space-y-1 ${
              isLight ? 'bg-amber-50 border-amber-200' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              <div className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300 text-[11px]">
                <Target className="w-3.5 h-3.5" />
                <span>Yêu cầu cần giải quyết:</span>
              </div>
              <p className={`text-xs leading-relaxed pl-5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                {problem_analysis.target}
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: Pedagogical Hints */}
        {activeTab === 'hints' && (
          <div className="space-y-3">
            <div className={`p-3 rounded-xl border text-xs ${
              isLight ? 'bg-cyan-50 border-cyan-200 text-cyan-900 font-medium' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-200'
            }`}>
              💡 Phương pháp tư duy hình học không gian chuẩn Chương trình GDPT 2018 (SGK Toán 11 & 12):
            </div>

            <div className="space-y-2.5">
              {pedagogical_hints.map((hint, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border space-y-1 transition ${
                    isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-cyan-400'
                      : 'bg-slate-950/80 border-slate-800/80 hover:border-cyan-500/40'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400 font-semibold text-[11px]">
                    <span className="w-4 h-4 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <span>Bước tư duy {idx + 1}</span>
                  </div>
                  <p className={`leading-relaxed text-xs pl-5.5 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    {hint}
                  </p>
                </div>
              ))}
            </div>

            <div className={`p-3 rounded-xl border text-[11px] space-y-1 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              <span className={`font-semibold block ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                📌 Lưu ý vẽ hình trong bài kiểm tra & thi THPT:
              </span>
              <p>• Đường thẳng vuông góc mặt phẳng đáy luôn vẽ thẳng đứng (song song với mép trang giấy).</p>
              <p>• Cạnh bị che khuất bắt buộc vẽ nét đứt (dashed), cạnh nhìn thấy vẽ nét liền.</p>
              <p>• Hãy tận dụng công cụ đo góc và khoảng cách bên dưới để kiểm tra lại kết quả tính toán.</p>
            </div>
          </div>
        )}

        {/* TAB: Relevant Geometry Formulas */}
        {activeTab === 'formulas' && (
          <FormulasPanel currentShapeType={problem_analysis.shape_type} />
        )}

        {/* TAB: Geometry Coordinates Inspector */}
        {activeTab === 'inspector' && (
          <div className="space-y-4">
            {/* Vertices List */}
            <div>
              <span className={`text-[10px] font-bold uppercase tracking-wider block mb-2 ${
                isLight ? 'text-slate-500' : 'text-slate-400'
              }`}>
                Tọa độ các đỉnh (Oxy đáy, Oz chiều cao đứng)
              </span>
              <div className="grid grid-cols-2 gap-2">
                {geometry_3d.vertices.map((v) => {
                  const isSelected = selectedVertexId === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => onSelectVertex?.(isSelected ? null : v)}
                      className={`p-2 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? isLight ? 'bg-amber-100 border-amber-400 text-amber-900' : 'bg-amber-500/20 border-amber-400 text-amber-200'
                          : isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-lg flex items-center justify-center font-mono font-bold text-[11px] ${
                          isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {v.label}
                        </span>
                        <span className="font-mono text-[11px]">
                          ({v.coord.join(', ')})
                        </span>
                      </div>
                      {v.isAltitudeFoot && (
                        <span className="text-[9px] bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded font-semibold">
                          Đường cao
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Angles List */}
            {geometry_3d.right_angles.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-2">
                  Ký hiệu góc vuông tự động ({geometry_3d.right_angles.length})
                </span>
                <div className="space-y-1.5">
                  {geometry_3d.right_angles.map((ra, idx) => (
                    <div
                      key={idx}
                      className={`p-2 rounded-xl border flex items-center justify-between text-xs font-mono ${
                        isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      <span className="text-amber-600 dark:text-amber-300 font-semibold">
                        ∠{ra.arm1}{ra.vertex}{ra.arm2} = 90°
                      </span>
                      <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        Đỉnh {ra.vertex} ⊥ ({ra.arm1}, {ra.arm2})
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Faces List */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block mb-2">
                Mặt phẳng & Thiết diện ({geometry_3d.faces.length})
              </span>
              <div className="space-y-1.5">
                {geometry_3d.faces.map((face, idx) => {
                  const isSelected = selectedFaceName === face.name;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => onSelectFace?.(isSelected ? null : face)}
                      className={`w-full p-2 rounded-xl text-left border transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? isLight ? 'bg-indigo-50 border-indigo-300 text-indigo-900' : 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                          : isLight ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700' : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full border border-slate-400"
                          style={{ backgroundColor: face.color }}
                        />
                        <span className="font-medium text-xs">{face.name}</span>
                      </div>
                      <span className={`font-mono text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                        Đỉnh: [{face.vertices.join(', ')}]
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
