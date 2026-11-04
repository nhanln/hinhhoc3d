import React, { useState, useMemo } from 'react';
import {
  Calculator,
  Search,
  Sparkles,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  BookOpen,
  HelpCircle,
  Shapes,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import {
  GEOMETRY_FORMULAS,
  GeometryFormulaItem,
  ShapeCategory,
  SHAPE_CATEGORY_META,
  detectShapeCategory
} from '../data/geometryFormulas';
import { useTheme } from '../context/ThemeContext';

interface FormulasPanelProps {
  currentShapeType: string;
}

export const FormulasPanel: React.FC<FormulasPanelProps> = ({ currentShapeType }) => {
  const { isLight } = useTheme();

  // Auto-detected shape from current 3D problem
  const detectedCategory = useMemo(() => detectShapeCategory(currentShapeType), [currentShapeType]);

  // Selected shape filter (defaults to auto-detected)
  const [selectedShape, setSelectedShape] = useState<ShapeCategory | 'all'>(detectedCategory);
  // Category filter
  const [categoryFilter, setCategoryFilter] = useState<
    'all' | 'volume' | 'surface' | 'pythagoras' | 'distance-angle'
  >('all');
  // Search text
  const [searchQuery, setSearchQuery] = useState('');
  // Expanded calculator state
  const [expandedCalculatorId, setExpandedCalculatorId] = useState<string | null>(null);
  // Calculator inputs state: Record<formulaId, Record<paramKey, number>>
  const [calculatorInputs, setCalculatorInputs] = useState<Record<string, Record<string, number>>>({});
  // Copied formula state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync selected shape when currentShapeType changes
  React.useEffect(() => {
    setSelectedShape(detectShapeCategory(currentShapeType));
  }, [currentShapeType]);

  const handleCopyFormula = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInputChange = (formulaId: string, paramKey: string, val: number) => {
    setCalculatorInputs((prev) => ({
      ...prev,
      [formulaId]: {
        ...(prev[formulaId] || {}),
        [paramKey]: val,
      },
    }));
  };

  // Filter formulas
  const filteredFormulas = useMemo(() => {
    return GEOMETRY_FORMULAS.filter((formula) => {
      // Shape match
      if (selectedShape !== 'all') {
        const matchesShape = formula.shapeTags.includes(selectedShape);
        if (!matchesShape) return false;
      }

      // Category match
      if (categoryFilter !== 'all') {
        if (!formula.categories.includes(categoryFilter)) return false;
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          formula.name.toLowerCase().includes(q) ||
          formula.formulaDisplay.toLowerCase().includes(q) ||
          formula.description.toLowerCase().includes(q) ||
          formula.variables.some((v) => v.label.toLowerCase().includes(q) || v.symbol.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    }).sort((a, b) => {
      // Prioritize formulas highlighted for currently active 3D model
      const aIsActive = a.highlightForShapes.includes(detectedCategory) ? 1 : 0;
      const bIsActive = b.highlightForShapes.includes(detectedCategory) ? 1 : 0;
      return bIsActive - aIsActive;
    });
  }, [selectedShape, categoryFilter, searchQuery, detectedCategory]);

  return (
    <div className="space-y-4">
      {/* Top Banner: Auto-detected Shape Info */}
      <div
        className={`p-3 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-colors ${
          isLight
            ? 'bg-gradient-to-r from-indigo-50/80 via-sky-50/60 to-purple-50/80 border-indigo-200 text-indigo-950'
            : 'bg-gradient-to-r from-indigo-950/40 via-slate-900 to-sky-950/30 border-indigo-500/30 text-indigo-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0">
            {SHAPE_CATEGORY_META[detectedCategory].icon}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">Mô hình hiện tại:</span>
              <span className="px-2 py-0.2 rounded-full text-[10px] font-extrabold bg-indigo-500 text-white shadow-xs">
                {currentShapeType}
              </span>
            </div>
            <p className="text-[11px] opacity-80 mt-0.5">
              {SHAPE_CATEGORY_META[detectedCategory].description}
            </p>
          </div>
        </div>

        {selectedShape !== detectedCategory && (
          <button
            type="button"
            onClick={() => setSelectedShape(detectedCategory)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Về hình hiện tại</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Shape Selector Horizontal Strip */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-semibold px-0.5 text-slate-500">
          <div className="flex items-center gap-1">
            <Shapes className="w-3 h-3 text-indigo-500" />
            <span>Tra cứu theo hình khối:</span>
          </div>
          <span className="text-[10px] opacity-75">{filteredFormulas.length} công thức</span>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedShape('all')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
              selectedShape === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                : isLight
                ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            Tất cả hình khối
          </button>

          {(Object.keys(SHAPE_CATEGORY_META) as ShapeCategory[]).map((shapeKey) => {
            const isCurrent = shapeKey === detectedCategory;
            const isSelected = selectedShape === shapeKey;
            const meta = SHAPE_CATEGORY_META[shapeKey];

            return (
              <button
                key={shapeKey}
                type="button"
                onClick={() => setSelectedShape(shapeKey)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm font-bold'
                    : isCurrent
                    ? isLight
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-semibold'
                      : 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300 font-semibold'
                    : isLight
                    ? 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
                }`}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 inline-block ml-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Pills & Search Bar */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'all', label: 'Tất cả' },
            { id: 'volume', label: 'Thể tích (V)' },
            { id: 'surface', label: 'Diện tích (S_xq, S_tp)' },
            { id: 'pythagoras', label: 'Định lý Pytago & Cạnh' },
            { id: 'distance-angle', label: 'Góc & Khoảng cách' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-slate-800 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                  : isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm công thức (ví dụ: Pytago, thể tích nón, bán kính...)"
            className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs border outline-none transition focus:ring-2 focus:ring-indigo-500/50 ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 placeholder-slate-400'
                : 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500'
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[10px] font-bold"
            >
              Xóa
            </button>
          )}
        </div>
      </div>

      {/* Formula Cards List */}
      <div className="space-y-3">
        {filteredFormulas.length === 0 ? (
          <div
            className={`p-6 rounded-2xl border text-center space-y-2 ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}
          >
            <HelpCircle className="w-6 h-6 mx-auto opacity-50" />
            <p className="text-xs">Không tìm thấy công thức phù hợp với từ khóa & bộ lọc.</p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setCategoryFilter('all');
                setSelectedShape('all');
              }}
              className="text-xs text-indigo-500 font-semibold hover:underline"
            >
              Đặt lại tất cả bộ lọc
            </button>
          </div>
        ) : (
          filteredFormulas.map((formula) => {
            const isRelevantToModel = formula.highlightForShapes.includes(detectedCategory);
            const isCalcOpen = expandedCalculatorId === formula.id;

            return (
              <div
                key={formula.id}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isRelevantToModel
                    ? isLight
                      ? 'bg-white border-indigo-200 shadow-sm hover:border-indigo-400 ring-1 ring-indigo-100'
                      : 'bg-slate-900/90 border-indigo-500/40 shadow-md hover:border-indigo-400 ring-1 ring-indigo-500/20'
                    : isLight
                    ? 'bg-white border-slate-200 hover:border-slate-300'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Formula Header */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-xs md:text-sm tracking-tight">
                          {formula.name}
                        </h4>
                        {isRelevantToModel && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> Khối hiện tại
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                        {formula.description}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleCopyFormula(formula.id, formula.formulaDisplay)}
                      className={`p-1.5 rounded-lg border transition cursor-pointer shrink-0 ${
                        copiedId === formula.id
                          ? 'bg-emerald-500 text-white border-emerald-500'
                          : isLight
                          ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-600'
                          : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                      }`}
                      title="Sao chép công thức"
                    >
                      {copiedId === formula.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Math Formula Display Box */}
                  <div
                    className={`p-2.5 rounded-lg font-mono text-xs md:text-sm font-bold flex items-center justify-between border ${
                      isLight
                        ? 'bg-slate-50 border-slate-200 text-indigo-950'
                        : 'bg-slate-950 border-slate-800 text-indigo-300'
                    }`}
                  >
                    <span className="tracking-wide select-all">{formula.formulaDisplay}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded font-sans font-semibold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                      {formula.symbol}
                    </span>
                  </div>

                  {/* Variables Legend */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 pt-1 text-[11px]">
                    {formula.variables.map((v, vIdx) => (
                      <div key={vIdx} className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 shrink-0">
                          {v.symbol}:
                        </span>
                        <span className="text-slate-600 dark:text-slate-300 truncate" title={v.meaning}>
                          {v.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Quick Calculator Accordion Toggle */}
                  {formula.calculation && (
                    <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800/80">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCalculatorId(isCalcOpen ? null : formula.id)
                        }
                        className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                          isCalcOpen
                            ? 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                            : isLight
                            ? 'hover:bg-slate-100 text-slate-600'
                            : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Calculator className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Thực hành tính nhanh với công thức này</span>
                        </div>
                        {isCalcOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>

                      {/* Interactive Calculator Section */}
                      {isCalcOpen && (
                        <div
                          className={`mt-2 p-3 rounded-xl border space-y-2.5 animate-in fade-in duration-150 ${
                            isLight ? 'bg-indigo-50/40 border-indigo-100' : 'bg-slate-950/80 border-indigo-500/30'
                          }`}
                        >
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 block">
                            Nhập giá trị tham số để tính toán:
                          </span>

                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {formula.calculation.inputs.map((param) => {
                              const currentVal =
                                calculatorInputs[formula.id]?.[param.key] ?? param.defaultValue;

                              return (
                                <div key={param.key} className="space-y-1">
                                  <label className="text-[10px] font-semibold text-slate-500 block truncate">
                                    {param.label}
                                  </label>
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={currentVal}
                                      onChange={(e) =>
                                        handleInputChange(
                                          formula.id,
                                          param.key,
                                          parseFloat(e.target.value) || 0
                                        )
                                      }
                                      className={`w-full text-xs font-mono px-2 py-1 rounded-lg border outline-none font-bold ${
                                        isLight
                                          ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                                          : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-indigo-400'
                                      }`}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Calculated Result Output */}
                          {(() => {
                            const currentVals: Record<string, number> = {};
                            formula.calculation.inputs.forEach((param) => {
                              currentVals[param.key] =
                                calculatorInputs[formula.id]?.[param.key] ?? param.defaultValue;
                            });

                            const calculationResult = formula.calculation.compute(currentVals);

                            return (
                              <div
                                className={`p-2.5 rounded-lg border flex flex-col gap-1 text-xs font-mono ${
                                  isLight
                                    ? 'bg-white border-emerald-200 text-slate-800'
                                    : 'bg-slate-900 border-emerald-500/30 text-emerald-200'
                                }`}
                              >
                                <div className="flex items-center justify-between font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                                  <span>Kết quả: {calculationResult.resultText}</span>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">
                                  {calculationResult.stepsText}
                                </p>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pedagogical Note */}
      <div
        className={`p-3 rounded-xl border text-[11px] space-y-1 ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
        }`}
      >
        <span className="font-bold text-slate-800 dark:text-slate-200 block">
          💡 Ghi nhớ nhanh cho học sinh THPT:
        </span>
        <p>• Khối có 1 đỉnh nhọn (chóp, nón) luôn có hệ số 1/3 trong thể tích: V = 1/3 · B · h.</p>
        <p>• Khối có 2 đáy bằng nhau (trụ, lăng trụ) có thể tích bằng đáy nhân chiều cao: V = B · h.</p>
        <p>• Luôn vẽ đúng đường cao vuông góc đáy để áp dụng định lý Pytago và hệ thức lượng tam giác vuông.</p>
      </div>
    </div>
  );
};
