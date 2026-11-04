import React, { useState, useMemo, useRef } from 'react';
import {
  SolidGeometryOutput,
  GeometryVertex,
  GeometryEdge,
  GeometryFace
} from '../types/geometry';
import {
  Columns2,
  Grid,
  Ruler,
  Download,
  Info,
  X,
  Eye,
  Crosshair,
  Maximize2,
  Minimize2,
  Check,
  ChevronRight
} from 'lucide-react';

export type ProjectionType = 'front' | 'top' | 'side' | 'all3';

interface ParallelProjection2DViewProps {
  data: SolidGeometryOutput;
  selectedVertexId?: string | null;
  selectedEdge?: { start: string; end: string } | null;
  selectedFaceName?: string | null;
  onSelectVertex?: (vertex: GeometryVertex | null) => void;
  onSelectEdge?: (edge: GeometryEdge | null) => void;
  projectionType: ProjectionType;
  onChangeProjectionType: (type: ProjectionType) => void;
  isLight: boolean;
  onClose?: () => void;
  splitRatio?: '50-50' | '60-40' | '40-60';
  onChangeSplitRatio?: (ratio: '50-50' | '60-40' | '40-60') => void;
}

interface Point2D {
  u: number;
  v: number;
  vertex: GeometryVertex;
}

export const ParallelProjection2DView: React.FC<ParallelProjection2DViewProps> = ({
  data,
  selectedVertexId,
  selectedEdge,
  selectedFaceName,
  onSelectVertex,
  onSelectEdge,
  projectionType,
  onChangeProjectionType,
  isLight,
  onClose,
  splitRatio = '50-50',
  onChangeSplitRatio
}) => {
  const [showGuidelines, setShowGuidelines] = useState(true);
  const [showCoords, setShowCoords] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [hoveredVertexId, setHoveredVertexId] = useState<string | null>(null);
  const [hoveredEdgeKey, setHoveredEdgeKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const svgContainerRef = useRef<SVGSVGElement | null>(null);

  // Active highlighted vertex (either selected or hovered)
  const activeVertexId = hoveredVertexId || selectedVertexId;
  const activeVertex = useMemo(() => {
    return data.geometry_3d.vertices.find((v) => v.id === activeVertexId) || null;
  }, [data.geometry_3d.vertices, activeVertexId]);

  // Project 3D vertex [x, y, z] to 2D (u, v) based on projection plane
  const projectVertex = (coord: [number, number, number], type: 'front' | 'top' | 'side'): { u: number; v: number } => {
    const [x, y, z] = coord;
    switch (type) {
      case 'front': // Hình chiếu đứng lên Oxz: nhìn theo trục y, giữ x và z
        return { u: x, v: z };
      case 'top': // Hình chiếu bằng lên Oxy: nhìn theo trục z, giữ x và y
        return { u: x, v: y };
      case 'side': // Hình chiếu cạnh lên Oyz: nhìn theo trục x, giữ y và z
        return { u: y, v: z };
      default:
        return { u: x, v: z };
    }
  };

  const getAxisLabels = (type: 'front' | 'top' | 'side') => {
    switch (type) {
      case 'front':
        return {
          h: 'Ox (Hoành độ x)',
          v: 'Oz (Cao độ z)',
          planeName: 'Mặt phẳng hình chiếu đứng (Oxz)',
          description: 'Chiếu vuông góc từ trước ra sau: Giữ nguyên hoành độ x và cao độ z, triệt tiêu chiều sâu y.'
        };
      case 'top':
        return {
          h: 'Ox (Hoành độ x)',
          v: 'Oy (Tung độ y)',
          planeName: 'Mặt phẳng hình chiếu bằng (Oxy)',
          description: 'Chiếu vuông góc từ trên xuống dưới đáy: Giữ nguyên hoành độ x và chiều sâu y, cao độ z = 0.'
        };
      case 'side':
        return {
          h: 'Oy (Chiều sâu y)',
          v: 'Oz (Cao độ z)',
          planeName: 'Mặt phẳng hình chiếu cạnh (Oyz)',
          description: 'Chiếu vuông góc từ trái sang phải: Giữ nguyên chiều sâu y và chiều cao z, triệt tiêu hoành độ x.'
        };
    }
  };

  // Helper to compute SVG bounds and transformation for a specific single projection
  const computeProjectionLayout = (type: 'front' | 'top' | 'side', svgWidth: number, svgHeight: number) => {
    const points: Point2D[] = data.geometry_3d.vertices.map((v) => {
      const { u, v: projV } = projectVertex(v.coord, type);
      return { u, v: projV, vertex: v };
    });

    // Determine domain bounds
    let minU = Math.min(...points.map((p) => p.u), 0);
    let maxU = Math.max(...points.map((p) => p.u), 1);
    let minV = Math.min(...points.map((p) => p.v), 0);
    let maxV = Math.max(...points.map((p) => p.v), 1);

    // Padding in math coordinate space
    const rangeU = Math.max(maxU - minU, 1);
    const rangeV = Math.max(maxV - minV, 1);
    const paddingU = Math.max(rangeU * 0.22, 0.8);
    const paddingV = Math.max(rangeV * 0.22, 0.8);

    minU -= paddingU;
    maxU += paddingU;
    minV -= paddingV;
    maxV += paddingV;

    const spanU = maxU - minU;
    const spanV = maxV - minV;

    // Preserve aspect ratio inside SVG canvas
    const margin = 40;
    const availWidth = Math.max(svgWidth - margin * 2, 100);
    const availHeight = Math.max(svgHeight - margin * 2, 100);
    const scale = Math.min(availWidth / spanU, availHeight / spanV);

    const offsetX = (svgWidth - spanU * scale) / 2;
    const offsetY = (svgHeight - spanV * scale) / 2;

    const toSvg = (u: number, v: number) => ({
      x: offsetX + (u - minU) * scale,
      y: svgHeight - (offsetY + (v - minV) * scale) // Invert Y for Cartesian SVG
    });

    const originSvg = toSvg(0, 0);

    return {
      points,
      toSvg,
      originSvg,
      minU,
      maxU,
      minV,
      maxV,
      scale
    };
  };

  // Render a single projection canvas inside an SVG
  const renderSingleProjectionSVG = (
    type: 'front' | 'top' | 'side',
    svgW: number = 540,
    svgH: number = 380,
    isSubView: boolean = false
  ) => {
    const { points, toSvg, originSvg, minU, maxU, minV, maxV } = computeProjectionLayout(type, svgW, svgH);
    const axisInfo = getAxisLabels(type);

    // Create a map from vertex id to svg coordinate
    const vertexMap = new Map<string, { x: number; y: number; vertex: GeometryVertex }>();
    points.forEach((p) => {
      const pos = toSvg(p.u, p.v);
      vertexMap.set(p.vertex.id, { ...pos, vertex: p.vertex });
    });

    // Grid ticks
    const uTicks: number[] = [];
    for (let u = Math.ceil(minU); u <= Math.floor(maxU); u++) {
      uTicks.push(u);
    }
    const vTicks: number[] = [];
    for (let v = Math.ceil(minV); v <= Math.floor(maxV); v++) {
      vTicks.push(v);
    }

    return (
      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        className="w-full h-full select-none"
        style={{ minHeight: isSubView ? 160 : 280 }}
      >
        <defs>
          {/* Arrowhead marker for axes */}
          <marker id={`arrow-${type}`} viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 10 5 L 0 8.5 z" fill={isLight ? '#64748b' : '#94a3b8'} />
          </marker>
          {/* Active selection glow filter */}
          <filter id={`glow-${type}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Background Grid Lines */}
        {showGrid && (
          <g opacity={isLight ? 0.45 : 0.25}>
            {uTicks.map((u) => {
              const pTop = toSvg(u, maxV);
              const pBottom = toSvg(u, minV);
              const isOrigin = u === 0;
              return (
                <line
                  key={`ugrid-${u}`}
                  x1={pTop.x}
                  y1={pTop.y}
                  x2={pBottom.x}
                  y2={pBottom.y}
                  stroke={isOrigin ? (isLight ? '#334155' : '#64748b') : (isLight ? '#cbd5e1' : '#1e293b')}
                  strokeWidth={isOrigin ? 1.5 : 0.8}
                  strokeDasharray={isOrigin ? undefined : '3,3'}
                />
              );
            })}
            {vTicks.map((v) => {
              const pLeft = toSvg(minU, v);
              const pRight = toSvg(maxU, v);
              const isOrigin = v === 0;
              return (
                <line
                  key={`vgrid-${v}`}
                  x1={pLeft.x}
                  y1={pLeft.y}
                  x2={pRight.x}
                  y2={pRight.y}
                  stroke={isOrigin ? (isLight ? '#334155' : '#64748b') : (isLight ? '#cbd5e1' : '#1e293b')}
                  strokeWidth={isOrigin ? 1.5 : 0.8}
                  strokeDasharray={isOrigin ? undefined : '3,3'}
                />
              );
            })}
          </g>
        )}

        {/* Main Coordinate Axes */}
        <g>
          {/* Horizontal Axis */}
          <line
            x1={toSvg(minU, 0).x}
            y1={originSvg.y}
            x2={toSvg(maxU, 0).x}
            y2={originSvg.y}
            stroke={isLight ? '#475569' : '#94a3b8'}
            strokeWidth={1.8}
            markerEnd={`url(#arrow-${type})`}
          />
          {/* Vertical Axis */}
          <line
            x1={originSvg.x}
            y1={toSvg(0, minV).y}
            x2={originSvg.x}
            y2={toSvg(0, maxV).y}
            stroke={isLight ? '#475569' : '#94a3b8'}
            strokeWidth={1.8}
            markerEnd={`url(#arrow-${type})`}
          />

          {/* Axis Labels */}
          <text
            x={toSvg(maxU, 0).x - 6}
            y={originSvg.y + 16}
            textAnchor="end"
            className={`font-mono text-[11px] font-bold ${isLight ? 'fill-slate-700' : 'fill-slate-300'}`}
          >
            {axisInfo.h.split(' ')[0]}
          </text>
          <text
            x={originSvg.x + 10}
            y={toSvg(0, maxV).y + 12}
            className={`font-mono text-[11px] font-bold ${isLight ? 'fill-slate-700' : 'fill-slate-300'}`}
          >
            {axisInfo.v.split(' ')[0]}
          </text>

          {/* Origin O */}
          <text
            x={originSvg.x - 10}
            y={originSvg.y + 14}
            className={`font-mono text-[10px] font-semibold ${isLight ? 'fill-slate-500' : 'fill-slate-400'}`}
          >
            O
          </text>
        </g>

        {/* Projected Faces (Subtle translucent polygons) */}
        <g opacity={0.12}>
          {data.geometry_3d.faces.map((f, idx) => {
            const polygonPoints = f.vertices
              .map((vId) => vertexMap.get(vId))
              .filter(Boolean)
              .map((p) => `${p!.x},${p!.y}`)
              .join(' ');

            if (!polygonPoints) return null;
            return (
              <polygon
                key={`face-${f.name}-${idx}`}
                points={polygonPoints}
                fill={f.color || '#3b82f6'}
              />
            );
          })}
        </g>

        {/* Dynamic Guidelines to Axes for Active Vertex */}
        {showGuidelines && activeVertex && vertexMap.has(activeVertex.id) && (() => {
          const vPos = vertexMap.get(activeVertex.id)!;
          const { u, v } = projectVertex(activeVertex.coord, type);
          const uAxisPos = toSvg(u, 0);
          const vAxisPos = toSvg(0, v);

          return (
            <g className="animate-in fade-in duration-150">
              {/* Line down to U axis */}
              <line
                x1={vPos.x}
                y1={vPos.y}
                x2={uAxisPos.x}
                y2={uAxisPos.y}
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />
              {/* Line across to V axis */}
              <line
                x1={vPos.x}
                y1={vPos.y}
                x2={vAxisPos.x}
                y2={vAxisPos.y}
                stroke="#06b6d4"
                strokeWidth={1.5}
                strokeDasharray="4,4"
              />

              {/* Tick marker & coordinate value on U axis */}
              <circle cx={uAxisPos.x} cy={uAxisPos.y} r={3} fill="#06b6d4" />
              <rect
                x={uAxisPos.x - 14}
                y={uAxisPos.y + (uAxisPos.y > originSvg.y - 10 ? 4 : -18)}
                width={28}
                height={14}
                rx={3}
                fill={isLight ? '#e0f2fe' : '#083344'}
                stroke="#06b6d4"
                strokeWidth={0.8}
              />
              <text
                x={uAxisPos.x}
                y={uAxisPos.y + (uAxisPos.y > originSvg.y - 10 ? 14 : -8)}
                textAnchor="middle"
                className="font-mono text-[9px] font-bold fill-cyan-700 dark:fill-cyan-300"
              >
                {u}
              </text>

              {/* Tick marker & coordinate value on V axis */}
              <circle cx={vAxisPos.x} cy={vAxisPos.y} r={3} fill="#06b6d4" />
              <rect
                x={vAxisPos.x - (vAxisPos.x > originSvg.x - 10 ? -4 : 32)}
                y={vAxisPos.y - 7}
                width={28}
                height={14}
                rx={3}
                fill={isLight ? '#e0f2fe' : '#083344'}
                stroke="#06b6d4"
                strokeWidth={0.8}
              />
              <text
                x={vAxisPos.x - (vAxisPos.x > originSvg.x - 10 ? -18 : 18)}
                y={vAxisPos.y + 3}
                textAnchor="middle"
                className="font-mono text-[9px] font-bold fill-cyan-700 dark:fill-cyan-300"
              >
                {v}
              </text>
            </g>
          );
        })()}

        {/* Projected Edges */}
        <g>
          {data.geometry_3d.edges.map((e, idx) => {
            const p1 = vertexMap.get(e.start);
            const p2 = vertexMap.get(e.end);
            if (!p1 || !p2) return null;

            const edgeKey = `${e.start}-${e.end}`;
            const isSelected =
              selectedEdge &&
              ((selectedEdge.start === e.start && selectedEdge.end === e.end) ||
                (selectedEdge.start === e.end && selectedEdge.end === e.start));
            const isHovered = hoveredEdgeKey === edgeKey;
            const isAltitude = e.isAltitude;

            // In SGK: Dashed edges represent hidden lines
            const isDashed = e.isDashed;

            return (
              <g
                key={`edge-${edgeKey}-${idx}`}
                className="cursor-pointer group"
                onClick={() => onSelectEdge?.(e)}
                onMouseEnter={() => setHoveredEdgeKey(edgeKey)}
                onMouseLeave={() => setHoveredEdgeKey(null)}
              >
                {/* Hit test wider transparent stroke */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="transparent"
                  strokeWidth={14}
                />
                {/* Visible rendered edge */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={
                    isSelected
                      ? '#f59e0b'
                      : isHovered
                      ? '#38bdf8'
                      : isAltitude
                      ? '#ea580c'
                      : e.color || (isLight ? '#1e293b' : '#e2e8f0')
                  }
                  strokeWidth={isSelected ? 3.5 : isHovered ? 3 : isAltitude ? 2.5 : 2}
                  strokeDasharray={isDashed ? '5,5' : undefined}
                  filter={isSelected ? `url(#glow-${type})` : undefined}
                  className="transition-all duration-150"
                />
              </g>
            );
          })}
        </g>

        {/* Projected Vertices & Labels */}
        <g>
          {points.map((p) => {
            const pos = vertexMap.get(p.vertex.id);
            if (!pos) return null;

            const isSelected = selectedVertexId === p.vertex.id;
            const isHovered = hoveredVertexId === p.vertex.id;
            const isAltitudeFoot = p.vertex.isAltitudeFoot;
            const isApex = p.vertex.coord[2] > 0;

            const radius = isSelected ? 7 : isHovered ? 6 : isAltitudeFoot ? 5 : 4.5;
            const fillColor = isSelected
              ? '#f59e0b'
              : isHovered
              ? '#38bdf8'
              : isAltitudeFoot
              ? '#ea580c'
              : isApex
              ? '#ef4444'
              : '#3b82f6';

            return (
              <g
                key={`v-${p.vertex.id}`}
                className="cursor-pointer group"
                onClick={() => onSelectVertex?.(p.vertex)}
                onMouseEnter={() => setHoveredVertexId(p.vertex.id)}
                onMouseLeave={() => setHoveredVertexId(null)}
              >
                {/* Large transparent click target */}
                <circle cx={pos.x} cy={pos.y} r={16} fill="transparent" />

                {/* Halo for selected or altitude foot */}
                {(isSelected || isAltitudeFoot) && (
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={radius + 4}
                    fill="none"
                    stroke={isSelected ? '#f59e0b' : '#ea580c'}
                    strokeWidth={1.5}
                    strokeDasharray={isAltitudeFoot ? '3,2' : undefined}
                    opacity={0.8}
                  />
                )}

                {/* Vertex Point */}
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={radius}
                  fill={fillColor}
                  stroke={isLight ? '#ffffff' : '#0f172a'}
                  strokeWidth={1.5}
                  filter={isSelected ? `url(#glow-${type})` : undefined}
                  className="transition-transform duration-150"
                />

                {/* Vertex Label Badge */}
                <g transform={`translate(${pos.x + 8}, ${pos.y - 8})`}>
                  <rect
                    x={-2}
                    y={-11}
                    width={showCoords ? 48 : 20}
                    height={16}
                    rx={3}
                    fill={
                      isSelected
                        ? '#f59e0b'
                        : isLight
                        ? '#ffffff'
                        : '#1e293b'
                    }
                    stroke={
                      isSelected
                        ? '#d97706'
                        : isLight
                        ? '#cbd5e1'
                        : '#475569'
                    }
                    strokeWidth={0.8}
                    opacity={0.95}
                  />
                  <text
                    x={2}
                    y={1}
                    className={`font-mono text-[10px] font-bold ${
                      isSelected
                        ? 'fill-slate-950 font-black'
                        : isLight
                        ? 'fill-slate-900'
                        : 'fill-cyan-300'
                    }`}
                  >
                    {p.vertex.label}
                  </text>
                  {showCoords && (
                    <text
                      x={14}
                      y={1}
                      className={`font-mono text-[8px] ${
                        isSelected
                          ? 'fill-slate-900 font-bold'
                          : isLight
                          ? 'fill-slate-500'
                          : 'fill-slate-400'
                      }`}
                    >
                      ({p.u},{p.v})
                    </text>
                  )}
                </g>
              </g>
            );
          })}
        </g>
      </svg>
    );
  };

  // Export 2D SVG file
  const handleExportSvg = () => {
    if (!svgContainerRef.current) return;
    try {
      const svgContent = svgContainerRef.current.outerHTML;
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `hinh_chieu_2d_${projectionType}.svg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2000);
    } catch (e) {
      console.error('Error exporting SVG', e);
    }
  };

  return (
    <div
      className={`h-full flex flex-col border-l transition-all duration-200 overflow-hidden ${
        isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}
    >
      {/* Top Header of 2D Projection View */}
      <div
        className={`px-3 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 shrink-0 ${
          isLight ? 'bg-slate-50/90 border-slate-200' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center border border-teal-500/20">
            <Columns2 className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold leading-tight flex items-center gap-1.5">
              <span>Hình chiếu 2D vuông góc</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded font-mono font-normal bg-teal-500/15 text-teal-700 dark:text-teal-300 border border-teal-500/30">
                Song song
              </span>
            </h3>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Liên hệ trực quan giữa tọa độ không gian 3D và mặt phẳng chiếu
            </p>
          </div>
        </div>

        {/* Projection View Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg border border-slate-300/60 dark:border-slate-700/60 text-[11px] font-semibold">
          <button
            type="button"
            onClick={() => onChangeProjectionType('front')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${
              projectionType === 'front'
                ? isLight
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Hình chiếu đứng (Mặt phẳng Oxz): Nhìn từ trước ra sau"
          >
            Đứng (Oxz)
          </button>
          <button
            type="button"
            onClick={() => onChangeProjectionType('top')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${
              projectionType === 'top'
                ? isLight
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Hình chiếu bằng (Mặt phẳng Oxy): Nhìn từ trên xuống đáy"
          >
            Bằng (Oxy)
          </button>
          <button
            type="button"
            onClick={() => onChangeProjectionType('side')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${
              projectionType === 'side'
                ? isLight
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Hình chiếu cạnh (Mặt phẳng Oyz): Nhìn từ bên cạnh"
          >
            Cạnh (Oyz)
          </button>
          <button
            type="button"
            onClick={() => onChangeProjectionType('all3')}
            className={`px-2 py-1 rounded-md transition cursor-pointer ${
              projectionType === 'all3'
                ? isLight
                  ? 'bg-white text-teal-800 font-bold shadow-xs'
                  : 'bg-teal-600 text-white font-bold shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Bộ 3 hình chiếu kỹ thuật (Tam diện vuông góc tiêu chuẩn SGK)"
          >
            Bộ 3 hình chiếu
          </button>
        </div>

        {/* Action Controls & Close */}
        <div className="flex items-center gap-1">
          {/* Split Ratio toggle */}
          {onChangeSplitRatio && (
            <div className="hidden md:flex items-center border border-slate-300 dark:border-slate-700 rounded-lg p-0.5 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => onChangeSplitRatio('60-40')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${splitRatio === '60-40' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300' : 'opacity-60'}`}
                title="Tỉ lệ 60% 3D / 40% 2D"
              >
                6:4
              </button>
              <button
                type="button"
                onClick={() => onChangeSplitRatio('50-50')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${splitRatio === '50-50' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300' : 'opacity-60'}`}
                title="Tỉ lệ 50% 3D / 50% 2D"
              >
                5:5
              </button>
              <button
                type="button"
                onClick={() => onChangeSplitRatio('40-60')}
                className={`px-1.5 py-0.5 rounded cursor-pointer ${splitRatio === '40-60' ? 'bg-teal-500/20 text-teal-600 dark:text-teal-300' : 'opacity-60'}`}
                title="Tỉ lệ 40% 3D / 60% 2D"
              >
                4:6
              </button>
            </div>
          )}

          {/* Toggle Guidelines */}
          <button
            type="button"
            onClick={() => setShowGuidelines(!showGuidelines)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              showGuidelines
                ? isLight
                  ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Bật/Tắt đường dóng tọa độ vuông góc đến các trục"
          >
            <Crosshair className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Coords on Vertices */}
          <button
            type="button"
            onClick={() => setShowCoords(!showCoords)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              showCoords
                ? isLight
                  ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Bật/Tắt nhãn tọa độ số cạnh đỉnh"
          >
            <Ruler className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Grid */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded-lg border text-xs font-semibold transition cursor-pointer ${
              showGrid
                ? isLight
                  ? 'bg-cyan-100 border-cyan-300 text-cyan-800'
                  : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Bật/Tắt lưới tọa độ ô vuông"
          >
            <Grid className="w-3.5 h-3.5" />
          </button>

          {/* Export SVG */}
          <button
            type="button"
            onClick={handleExportSvg}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition cursor-pointer"
            title="Tải bản vẽ hình chiếu 2D dạng file SVG"
          >
            {downloadSuccess ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Download className="w-3.5 h-3.5" />}
          </button>

          {/* Close Dual View Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer ml-1"
              title="Đóng chế độ xem song song (Trở về chế độ 3D toàn màn hình)"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Projection Explanatory Banner */}
      <div
        className={`px-3 py-1.5 text-[11px] border-b flex items-center justify-between gap-2 shrink-0 ${
          isLight ? 'bg-cyan-50/70 border-cyan-100 text-cyan-900' : 'bg-cyan-950/30 border-cyan-900/40 text-cyan-300'
        }`}
      >
        <div className="flex items-center gap-1.5 truncate">
          <Info className="w-3.5 h-3.5 shrink-0 text-cyan-600 dark:text-cyan-400" />
          <span className="font-semibold truncate">
            {projectionType === 'all3'
              ? 'Quy chuẩn bản vẽ kỹ thuật: Đứng (trên trái) - Bằng (dưới trái) - Cạnh (trên phải)'
              : getAxisLabels(projectionType).description}
          </span>
        </div>
        {activeVertex && (
          <div className="shrink-0 font-mono text-[10px] bg-cyan-200/60 dark:bg-cyan-900/60 px-2 py-0.5 rounded border border-cyan-400/40 font-bold">
            {activeVertex.label}(3D): [{activeVertex.coord.join(', ')}]
          </div>
        )}
      </div>

      {/* Main 2D Drawing Canvas Area */}
      <div className="flex-1 min-h-0 relative p-2 overflow-auto flex items-center justify-center">
        {projectionType !== 'all3' ? (
          <div className="w-full h-full flex items-center justify-center" ref={(el) => {
            if (el && el.querySelector('svg')) {
              svgContainerRef.current = el.querySelector('svg');
            }
          }}>
            {renderSingleProjectionSVG(projectionType, 580, 420)}
          </div>
        ) : (
          /* Bộ 3 hình chiếu kỹ thuật (Technical Monge Projection: 2x2 Grid) */
          <div
            ref={(el) => {
              if (el && el.querySelector('svg')) {
                svgContainerRef.current = el.querySelector('svg');
              }
            }}
            className="w-full h-full grid grid-cols-2 grid-rows-2 gap-2 p-1 overflow-auto"
          >
            {/* Top-Left: Hình chiếu đứng (Oxz) */}
            <div className={`relative rounded-xl border p-1.5 flex flex-col ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-teal-700 dark:text-teal-300 px-1 mb-1">
                <span>1. HÌNH CHIẾU ĐỨNG (Oxz)</span>
                <span className="text-slate-400 font-mono text-[9px]">(Nhìn từ trước)</span>
              </div>
              <div className="flex-1 min-h-[140px]">
                {renderSingleProjectionSVG('front', 270, 180, true)}
              </div>
            </div>

            {/* Top-Right: Hình chiếu cạnh (Oyz) */}
            <div className={`relative rounded-xl border p-1.5 flex flex-col ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-teal-700 dark:text-teal-300 px-1 mb-1">
                <span>3. HÌNH CHIẾU CẠNH (Oyz)</span>
                <span className="text-slate-400 font-mono text-[9px]">(Nhìn từ trái sang)</span>
              </div>
              <div className="flex-1 min-h-[140px]">
                {renderSingleProjectionSVG('side', 270, 180, true)}
              </div>
            </div>

            {/* Bottom-Left: Hình chiếu bằng (Oxy) */}
            <div className={`relative rounded-xl border p-1.5 flex flex-col ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-800/40 border-slate-700/60'}`}>
              <div className="flex items-center justify-between text-[10px] font-bold text-teal-700 dark:text-teal-300 px-1 mb-1">
                <span>2. HÌNH CHIẾU BẰNG (Oxy)</span>
                <span className="text-slate-400 font-mono text-[9px]">(Nhìn từ trên xuống)</span>
              </div>
              <div className="flex-1 min-h-[140px]">
                {renderSingleProjectionSVG('top', 270, 180, true)}
              </div>
            </div>

            {/* Bottom-Right: Bảng tổng hợp liên hệ Không gian - Mặt phẳng */}
            <div className={`relative rounded-xl border p-2 flex flex-col justify-between text-xs overflow-auto ${isLight ? 'bg-teal-50/50 border-teal-200' : 'bg-teal-950/20 border-teal-800/40'}`}>
              <div>
                <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 block mb-1">
                  💡 Liên hệ Không gian ➔ Mặt phẳng
                </span>
                <div className="space-y-1 text-[10px] text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span><b>Đứng</b> & <b>Bằng</b> dóng chung: <b>hoành độ x</b> (chiều dài)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span><b>Đứng</b> & <b>Cạnh</b> dóng chung: <b>cao độ z</b> (chiều cao h)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    <span><b>Bằng</b> & <b>Cạnh</b> dóng chung: <b>chiều sâu y</b> (chiều rộng)</span>
                  </div>
                </div>
              </div>

              {activeVertex ? (
                <div className={`mt-2 p-1.5 rounded-lg border text-[10px] font-mono ${isLight ? 'bg-white border-teal-300 text-teal-950' : 'bg-slate-900 border-teal-700 text-teal-300'}`}>
                  <span className="font-bold text-amber-500">Đỉnh {activeVertex.label}:</span>
                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-0.5 text-[9px]">
                    <span>3D: ({activeVertex.coord.join(', ')})</span>
                    <span>Đứng: ({activeVertex.coord[0]}, {activeVertex.coord[2]})</span>
                    <span>Bằng: ({activeVertex.coord[0]}, {activeVertex.coord[1]})</span>
                    <span>Cạnh: ({activeVertex.coord[1]}, {activeVertex.coord[2]})</span>
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 italic text-center py-2">
                  Nhấp vào một đỉnh hoặc cạnh bất kỳ để xem tọa độ dóng liên hệ
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Interactive Footer Toast for selected element */}
      {activeVertex && (
        <div
          className={`px-3 py-2 border-t flex items-center justify-between text-xs shrink-0 ${
            isLight ? 'bg-amber-50 border-amber-200 text-amber-950' : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-bold">Đỉnh {activeVertex.label}:</span>
            <span className="font-mono text-[11px] truncate">
              Không gian 3D [{activeVertex.coord.join(', ')}]
            </span>
            <ChevronRight className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="font-mono text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 truncate">
              {projectionType === 'front'
                ? `Chiếu đứng Oxz (${activeVertex.coord[0]}, ${activeVertex.coord[2]}) - Cao độ h=${activeVertex.coord[2]}`
                : projectionType === 'top'
                ? `Chiếu bằng Oxy (${activeVertex.coord[0]}, ${activeVertex.coord[1]}) - Mặt đáy`
                : projectionType === 'side'
                ? `Chiếu cạnh Oyz (${activeVertex.coord[1]}, ${activeVertex.coord[2]})`
                : `Hệ 3 hình chiếu [x=${activeVertex.coord[0]}, y=${activeVertex.coord[1]}, z=${activeVertex.coord[2]}]`}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectVertex?.(null)}
            className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline cursor-pointer shrink-0 ml-2"
          >
            Bỏ chọn
          </button>
        </div>
      )}
    </div>
  );
};
