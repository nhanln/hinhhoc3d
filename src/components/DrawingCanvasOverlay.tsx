import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Pencil,
  Eraser,
  Trash2,
  Undo2,
  Redo2,
  Minus,
  MoveUpRight,
  Highlighter,
  Hand,
  Check,
  Eye,
  EyeOff,
  Palette,
  X,
  Sparkles
} from 'lucide-react';
import { DrawStroke, DrawingTool, DrawPoint } from '../types/drawing';

interface DrawingCanvasOverlayProps {
  isActive: boolean;
  onToggleActive: () => void;
  isLight: boolean;
  onDrawingStateChange?: (isDrawingOnScreen: boolean) => void;
  onStrokesChange?: (strokes: DrawStroke[]) => void;
}

const COLOR_PALETTE = [
  { name: 'Đỏ (Đường cao)', hex: '#ef4444' },
  { name: 'Xanh dương (Cạnh phụ)', hex: '#3b82f6' },
  { name: 'Xanh lá (Mặt phẳng)', hex: '#10b981' },
  { name: 'Vàng cam (Điểm nhấn)', hex: '#f59e0b' },
  { name: 'Tím (Góc nhị diện)', hex: '#a855f7' },
  { name: 'Trắng/Đen', hex: '#ffffff', hexLight: '#0f172a' },
];

export function DrawingCanvasOverlay({
  isActive,
  onToggleActive,
  isLight,
  onDrawingStateChange,
  onStrokesChange
}: DrawingCanvasOverlayProps) {
  const [tool, setTool] = useState<DrawingTool>('pen');
  const [color, setColor] = useState<string>('#ef4444');
  const [strokeWidth, setStrokeWidth] = useState<number>(3);
  const [isOrbitingPaused, setIsOrbitingPaused] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  // Strokes history
  const [strokes, setStrokes] = useState<DrawStroke[]>([]);
  const [redoStack, setRedoStack] = useState<DrawStroke[][]>([]);
  const [currentStroke, setCurrentStroke] = useState<DrawStroke | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const isPointerDownRef = useRef<boolean>(false);

  // Notify parent whether drawing layer is capturing pointer
  useEffect(() => {
    const isCapturing = isActive && !isOrbitingPaused;
    onDrawingStateChange?.(isCapturing);
  }, [isActive, isOrbitingPaused, onDrawingStateChange]);

  // Notify parent of stroke changes for snapshot export
  useEffect(() => {
    onStrokesChange?.(strokes);
  }, [strokes, onStrokesChange]);

  // Convert array of points into SVG path string with smooth quadratic curves
  const getSvgPathFromPoints = (points: DrawPoint[]): string => {
    if (points.length === 0) return '';
    if (points.length === 1) {
      return `M ${points[0].x} ${points[0].y} L ${points[0].x + 0.1} ${points[0].y + 0.1}`;
    }

    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      d += ` Q ${points[i].x} ${points[i].y}, ${xc} ${yc}`;
    }
    const last = points[points.length - 1];
    d += ` L ${last.x} ${last.y}`;
    return d;
  };

  const getPointerPos = (e: React.PointerEvent<SVGSVGElement>): DrawPoint => {
    if (!svgRef.current) return { x: e.clientX, y: e.clientY };
    const rect = svgRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      pressure: e.pressure > 0 ? e.pressure : 0.5
    };
  };

  // Pointer event handlers
  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isActive || isOrbitingPaused) return;
    if (e.button !== 0 && e.pointerType === 'mouse') return; // only left click

    e.preventDefault();
    (e.currentTarget as any).setPointerCapture(e.pointerId);
    isPointerDownRef.current = true;

    const pt = getPointerPos(e);

    if (tool === 'eraser') {
      eraseAtPoint(pt);
      return;
    }

    const effectiveColor = color === '#ffffff' && isLight ? '#0f172a' : color;
    const newStroke: DrawStroke = {
      id: `stroke-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      tool,
      color: effectiveColor,
      width: strokeWidth,
      points: [pt]
    };
    setCurrentStroke(newStroke);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPointerDownRef.current || !isActive || isOrbitingPaused) return;
    e.preventDefault();

    const pt = getPointerPos(e);

    if (tool === 'eraser') {
      eraseAtPoint(pt);
      return;
    }

    if (currentStroke) {
      if (tool === 'line' || tool === 'arrow') {
        // For straight line and arrow, only update start and end
        setCurrentStroke((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [prev.points[0], pt]
          };
        });
      } else {
        // For freehand, dashed, highlighter
        setCurrentStroke((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...prev.points, pt]
          };
        });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;
    try {
      (e.currentTarget as any).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (currentStroke && currentStroke.points.length > 0) {
      setStrokes((prev) => [...prev, currentStroke]);
      setRedoStack([]); // clear redo stack on new action
      setCurrentStroke(null);
    }
  };

  // Erase strokes intersecting with point
  const eraseAtPoint = (pt: DrawPoint) => {
    const radius = 22;
    setStrokes((prev) => {
      const filtered = prev.filter((stroke) => {
        // Check if any point of this stroke is close to the eraser
        return !stroke.points.some((p) => {
          const dx = p.x - pt.x;
          const dy = p.y - pt.y;
          return Math.sqrt(dx * dx + dy * dy) < radius;
        });
      });
      return filtered;
    });
  };

  // Undo / Redo / Clear
  const handleUndo = () => {
    if (strokes.length === 0) return;
    const last = strokes[strokes.length - 1];
    setRedoStack((prev) => [...prev, [last]]);
    setStrokes((prev) => prev.slice(0, -1));
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextStrokes = redoStack[redoStack.length - 1];
    setStrokes((prev) => [...prev, ...nextStrokes]);
    setRedoStack((prev) => prev.slice(0, -1));
  };

  const handleClearAll = () => {
    if (strokes.length === 0) return;
    setRedoStack((prev) => [...prev, strokes]);
    setStrokes([]);
  };

  return (
    <>
      {/* SVG Canvas Drawing Layer */}
      <svg
        ref={svgRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`absolute inset-0 w-full h-full transition-opacity duration-200 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        } ${
          isActive && !isOrbitingPaused
            ? 'z-20 cursor-crosshair touch-none pointer-events-auto'
            : 'z-20 pointer-events-none'
        }`}
      >
        <defs>
          {/* Arrowhead markers for various colors */}
          {COLOR_PALETTE.map((c) => {
            const effectiveHex = c.hex === '#ffffff' && isLight ? '#0f172a' : c.hex;
            const markerId = `arrowhead-${effectiveHex.replace('#', '')}`;
            return (
              <marker
                key={markerId}
                id={markerId}
                viewBox="0 0 10 10"
                refX="7"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={effectiveHex} />
              </marker>
            );
          })}
        </defs>

        {/* Existing strokes */}
        {strokes.map((stroke) => {
          if (stroke.points.length === 0) return null;

          if (stroke.tool === 'line') {
            const p1 = stroke.points[0];
            const p2 = stroke.points[stroke.points.length - 1];
            return (
              <line
                key={stroke.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
              />
            );
          }

          if (stroke.tool === 'arrow') {
            const p1 = stroke.points[0];
            const p2 = stroke.points[stroke.points.length - 1];
            const markerId = `url(#arrowhead-${stroke.color.replace('#', '')})`;
            return (
              <line
                key={stroke.id}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeLinecap="round"
                markerEnd={markerId}
              />
            );
          }

          if (stroke.tool === 'dashed') {
            return (
              <path
                key={stroke.id}
                d={getSvgPathFromPoints(stroke.points)}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width}
                strokeDasharray="9 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          if (stroke.tool === 'highlighter') {
            return (
              <path
                key={stroke.id}
                d={getSvgPathFromPoints(stroke.points)}
                fill="none"
                stroke={stroke.color}
                strokeWidth={stroke.width * 3.5}
                strokeOpacity={0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            );
          }

          // Default pen (solid)
          return (
            <path
              key={stroke.id}
              d={getSvgPathFromPoints(stroke.points)}
              fill="none"
              stroke={stroke.color}
              strokeWidth={stroke.width}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          );
        })}

        {/* Current stroke in progress */}
        {currentStroke && (
          <>
            {currentStroke.tool === 'line' ? (
              <line
                x1={currentStroke.points[0].x}
                y1={currentStroke.points[0].y}
                x2={currentStroke.points[currentStroke.points.length - 1].x}
                y2={currentStroke.points[currentStroke.points.length - 1].y}
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width}
                strokeLinecap="round"
              />
            ) : currentStroke.tool === 'arrow' ? (
              <line
                x1={currentStroke.points[0].x}
                y1={currentStroke.points[0].y}
                x2={currentStroke.points[currentStroke.points.length - 1].x}
                y2={currentStroke.points[currentStroke.points.length - 1].y}
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width}
                strokeLinecap="round"
                markerEnd={`url(#arrowhead-${currentStroke.color.replace('#', '')})`}
              />
            ) : currentStroke.tool === 'dashed' ? (
              <path
                d={getSvgPathFromPoints(currentStroke.points)}
                fill="none"
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width}
                strokeDasharray="9 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : currentStroke.tool === 'highlighter' ? (
              <path
                d={getSvgPathFromPoints(currentStroke.points)}
                fill="none"
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width * 3.5}
                strokeOpacity={0.35}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : (
              <path
                d={getSvgPathFromPoints(currentStroke.points)}
                fill="none"
                stroke={currentStroke.color}
                strokeWidth={currentStroke.width}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
          </>
        )}
      </svg>

      {/* Floating Teacher Toolbar */}
      {isActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex flex-wrap items-center justify-center gap-2 p-2 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-3 duration-200 max-w-[95vw]">
          {/* Tool selector buttons */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={() => {
                setTool('pen');
                setIsOrbitingPaused(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'pen' && !isOrbitingPaused
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Bút nét liền (Vẽ tay phác thảo, ghi chú)"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nét liền</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('dashed');
                setIsOrbitingPaused(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'dashed' && !isOrbitingPaused
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Bút nét đứt SGK (Đường khuất, đường phụ trong hình chóp/lăng trụ)"
            >
              <span className="font-mono text-xs font-bold">╌╌</span>
              <span className="hidden sm:inline">Nét đứt SGK</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('line');
                setIsOrbitingPaused(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'line' && !isOrbitingPaused
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Đoạn thẳng (Kẻ đường cao, đường sinh, trung đoạn)"
            >
              <Minus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Đoạn thẳng</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('arrow');
                setIsOrbitingPaused(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'arrow' && !isOrbitingPaused
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Mũi tên (Vectơ pháp tuyến, đường gióng)"
            >
              <MoveUpRight className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mũi tên</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('highlighter');
                setIsOrbitingPaused(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'highlighter' && !isOrbitingPaused
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Bút dạ quang (Tô sáng mặt phẳng hoặc góc cần chú ý)"
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dạ quang</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTool('eraser');
                setIsOrbitingPaused(false);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                tool === 'eraser' && !isOrbitingPaused
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
              }`}
              title="Tẩy nét vẽ (Quét qua nét vẽ để xóa)"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tẩy</span>
            </button>
          </div>

          {/* Color palette */}
          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
            {COLOR_PALETTE.map((c) => {
              const displayHex = c.hex === '#ffffff' && isLight ? '#0f172a' : c.hex;
              const isSelected = color === c.hex;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.hex)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer relative ${
                    isSelected ? 'scale-125 ring-2 ring-white ring-offset-1 ring-offset-slate-900' : 'hover:scale-110 opacity-80'
                  }`}
                  style={{ backgroundColor: displayHex }}
                  title={c.name}
                />
              );
            })}
          </div>

          {/* Stroke Width Selector */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1 rounded-xl border border-slate-700/60">
            {[
              { label: 'Mảnh', val: 2 },
              { label: 'Vừa', val: 3.5 },
              { label: 'Đậm', val: 6 },
            ].map((sw) => (
              <button
                key={sw.label}
                type="button"
                onClick={() => setStrokeWidth(sw.val)}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer ${
                  strokeWidth === sw.val
                    ? 'bg-indigo-500 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sw.label}
              </button>
            ))}
          </div>

          {/* Orbit/Draw Toggle Mode (Pause drawing to orbit 3D model) */}
          <button
            type="button"
            onClick={() => setIsOrbitingPaused(!isOrbitingPaused)}
            className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
              isOrbitingPaused
                ? 'bg-amber-500 text-slate-950 font-bold ring-2 ring-amber-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
            title={
              isOrbitingPaused
                ? 'Đang bật chế độ Xoay 3D (Click để quay lại Vẽ nét)'
                : 'Tạm dừng vẽ để xoay mô hình 3D (Orbit)'
            }
          >
            <Hand className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isOrbitingPaused ? 'Đang xoay 3D' : 'Xoay 3D'}</span>
          </button>

          {/* Actions: Undo / Redo / Clear / Eye */}
          <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700/60">
            <button
              type="button"
              onClick={handleUndo}
              disabled={strokes.length === 0}
              className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/50 cursor-pointer"
              title="Hoàn tác nét vẽ (Undo)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="p-1 rounded-lg text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-700/50 cursor-pointer"
              title="Làm lại nét vẽ (Redo)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleClearAll}
              disabled={strokes.length === 0}
              className="p-1 rounded-lg text-rose-400 hover:text-rose-200 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-rose-500/20 cursor-pointer"
              title="Xóa toàn bộ nét vẽ tay"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              className="p-1 rounded-lg text-slate-300 hover:text-white hover:bg-slate-700/50 cursor-pointer"
              title={isVisible ? 'Ẩn tạm thời các nét vẽ' : 'Hiện lại các nét vẽ'}
            >
              {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5 text-amber-400" />}
            </button>
          </div>

          {/* Close Teacher Drawing Toolbar */}
          <button
            type="button"
            onClick={onToggleActive}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
            title="Đóng chế độ vẽ tay"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </>
  );
}
