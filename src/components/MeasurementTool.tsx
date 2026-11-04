import React, { useState, useMemo } from 'react';
import {
  Ruler,
  Compass,
  ArrowRight,
  Sparkles,
  Calculator,
  CheckCircle2,
  Info,
  Maximize2,
  RotateCcw
} from 'lucide-react';
import { SolidGeometryOutput, GeometryVertex, GeometryFace } from '../types/geometry';
import { useTheme } from '../context/ThemeContext';
import {
  calculateDistance,
  formatAlgebraicApproximation,
  calculatePlaneNormal,
  calculateDihedralAngle
} from '../utils/math3d';

export interface DistanceMeasurement {
  vertex1: GeometryVertex;
  vertex2: GeometryVertex;
  distance: number;
  approxText: string;
  vector: [number, number, number];
}

export interface DihedralAngleMeasurement {
  plane1Name: string;
  plane1Vertices: GeometryVertex[];
  plane2Name: string;
  plane2Vertices: GeometryVertex[];
  angleDeg: number;
  cosVal: number;
  normal1: [number, number, number];
  normal2: [number, number, number];
}

interface MeasurementToolProps {
  data: SolidGeometryOutput;
  activeDistance: DistanceMeasurement | null;
  activeAngle: DihedralAngleMeasurement | null;
  onUpdateDistance: (measurement: DistanceMeasurement | null) => void;
  onUpdateAngle: (measurement: DihedralAngleMeasurement | null) => void;
  onClearMeasurement: () => void;
}

export const MeasurementTool: React.FC<MeasurementToolProps> = ({
  data,
  activeDistance,
  activeAngle,
  onUpdateDistance,
  onUpdateAngle,
  onClearMeasurement,
}) => {
  const { isLight } = useTheme();
  const [mode, setMode] = useState<'distance' | 'angle'>('distance');

  // Distance state
  const [selectedV1Id, setSelectedV1Id] = useState<string>(
    data.geometry_3d.vertices[0]?.id || ''
  );
  const [selectedV2Id, setSelectedV2Id] = useState<string>(
    data.geometry_3d.vertices[1]?.id || ''
  );

  // Plane angle state: Preset face selection OR custom 3-point selection
  const [planeSelectionType, setPlaneSelectionType] = useState<'preset' | 'custom'>('preset');

  // Preset faces
  const [presetFace1Name, setPresetFace1Name] = useState<string>(
    data.geometry_3d.faces[0]?.name || ''
  );
  const [presetFace2Name, setPresetFace2Name] = useState<string>(
    data.geometry_3d.faces[1]?.name || data.geometry_3d.faces[0]?.name || ''
  );

  // Custom plane points
  const [customP1Ids, setCustomP1Ids] = useState<[string, string, string]>([
    data.geometry_3d.vertices[0]?.id || '',
    data.geometry_3d.vertices[1]?.id || '',
    data.geometry_3d.vertices[2]?.id || '',
  ]);
  const [customP2Ids, setCustomP2Ids] = useState<[string, string, string]>([
    data.geometry_3d.vertices[0]?.id || '',
    data.geometry_3d.vertices[1]?.id || '',
    data.geometry_3d.vertices[3]?.id || data.geometry_3d.vertices[2]?.id || '',
  ]);

  const verticesMap = useMemo(() => {
    const map = new Map<string, GeometryVertex>();
    data.geometry_3d.vertices.forEach((v) => map.set(v.id, v));
    return map;
  }, [data]);

  // Compute distance
  const computedDistance = useMemo(() => {
    const v1 = verticesMap.get(selectedV1Id);
    const v2 = verticesMap.get(selectedV2Id);
    if (!v1 || !v2 || v1.id === v2.id) return null;

    const dist = calculateDistance(v1.coord, v2.coord);
    const approx = formatAlgebraicApproximation(dist);
    const vec: [number, number, number] = [
      parseFloat((v2.coord[0] - v1.coord[0]).toFixed(2)),
      parseFloat((v2.coord[1] - v1.coord[1]).toFixed(2)),
      parseFloat((v2.coord[2] - v1.coord[2]).toFixed(2)),
    ];

    return {
      vertex1: v1,
      vertex2: v2,
      distance: parseFloat(dist.toFixed(3)),
      approxText: approx,
      vector: vec,
    };
  }, [selectedV1Id, selectedV2Id, verticesMap]);

  // Handle apply distance
  const handleApplyDistance = () => {
    if (computedDistance) {
      onUpdateDistance(computedDistance);
    }
  };

  // Compute Angle
  const computedAngle = useMemo(() => {
    let p1Verts: GeometryVertex[] = [];
    let p2Verts: GeometryVertex[] = [];
    let p1Name = '';
    let p2Name = '';

    if (planeSelectionType === 'preset') {
      const face1 = data.geometry_3d.faces.find((f) => f.name === presetFace1Name);
      const face2 = data.geometry_3d.faces.find((f) => f.name === presetFace2Name);
      if (!face1 || !face2) return null;

      p1Verts = face1.vertices.map((id) => verticesMap.get(id)!).filter(Boolean);
      p2Verts = face2.vertices.map((id) => verticesMap.get(id)!).filter(Boolean);
      p1Name = face1.name;
      p2Name = face2.name;
    } else {
      p1Verts = customP1Ids.map((id) => verticesMap.get(id)!).filter(Boolean);
      p2Verts = customP2Ids.map((id) => verticesMap.get(id)!).filter(Boolean);
      p1Name = `Mặt phẳng (${p1Verts.map((v) => v.label).join('')})`;
      p2Name = `Mặt phẳng (${p2Verts.map((v) => v.label).join('')})`;
    }

    if (p1Verts.length < 3 || p2Verts.length < 3) return null;

    const normal1 = calculatePlaneNormal(p1Verts[0].coord, p1Verts[1].coord, p1Verts[2].coord);
    const normal2 = calculatePlaneNormal(p2Verts[0].coord, p2Verts[1].coord, p2Verts[2].coord);

    const result = calculateDihedralAngle(normal1, normal2);

    return {
      plane1Name: p1Name,
      plane1Vertices: p1Verts,
      plane2Name: p2Name,
      plane2Vertices: p2Verts,
      angleDeg: result.degrees,
      cosVal: result.cosVal,
      normal1,
      normal2,
    };
  }, [
    planeSelectionType,
    presetFace1Name,
    presetFace2Name,
    customP1Ids,
    customP2Ids,
    data.geometry_3d.faces,
    verticesMap,
  ]);

  // Handle apply angle
  const handleApplyAngle = () => {
    if (computedAngle) {
      onUpdateAngle(computedAngle);
    }
  };

  return (
    <div className={`border rounded-2xl p-4 shadow-xl space-y-4 transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900/95 border-slate-800 text-slate-100'
    }`}>
      {/* Title & Mode Switcher */}
      <div className={`flex items-center justify-between border-b pb-3 ${
        isLight ? 'border-slate-200' : 'border-slate-800'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              Công Cụ Đo Hình Học Không Gian 3D
            </h3>
            <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Đo khoảng cách & góc phẳng nhị diện chuẩn GDPT 2018
            </p>
          </div>
        </div>

        <div className={`flex items-center p-1 rounded-xl border text-xs ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800'
        }`}>
          <button
            type="button"
            onClick={() => {
              setMode('distance');
              onClearMeasurement();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              mode === 'distance'
                ? 'bg-cyan-600 text-white shadow-sm font-semibold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Ruler className="w-3.5 h-3.5" />
            Đo khoảng cách
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('angle');
              onClearMeasurement();
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-medium transition cursor-pointer ${
              mode === 'angle'
                ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            Đo góc giữa 2 mặt phẳng
          </button>
        </div>
      </div>

      {/* MODE 1: DISTANCE MEASUREMENT */}
      {mode === 'distance' && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {/* Vertex 1 */}
            <div>
              <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Chọn Đỉnh thứ nhất:
              </label>
              <select
                value={selectedV1Id}
                onChange={(e) => setSelectedV1Id(e.target.value)}
                className={`w-full px-3 py-1.5 border rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-cyan-900 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-cyan-300'
                }`}
              >
                {data.geometry_3d.vertices.map((v) => (
                  <option key={v.id} value={v.id}>
                    Đỉnh {v.label} ({v.coord.join(', ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Vertex 2 */}
            <div>
              <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Chọn Đỉnh thứ hai:
              </label>
              <select
                value={selectedV2Id}
                onChange={(e) => setSelectedV2Id(e.target.value)}
                className={`w-full px-3 py-1.5 border rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-cyan-900 font-semibold'
                    : 'bg-slate-950 border-slate-800 text-cyan-300'
                }`}
              >
                {data.geometry_3d.vertices.map((v) => (
                  <option key={v.id} value={v.id}>
                    Đỉnh {v.label} ({v.coord.join(', ')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Result Card */}
          {computedDistance ? (
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLight ? 'bg-cyan-50 border-cyan-200' : 'bg-cyan-950/20 border-cyan-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <span className={`text-xs font-semibold ${isLight ? 'text-cyan-900' : 'text-cyan-400'}`}>
                  Khoảng cách d({computedDistance.vertex1.label}, {computedDistance.vertex2.label}):
                </span>
                <span className="text-sm font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2 py-0.5 rounded-md border border-amber-400/30">
                  {computedDistance.distance} đơn vị dài
                </span>
              </div>

              <div className={`grid grid-cols-2 gap-2 text-[11px] pt-1 border-t ${
                isLight ? 'border-slate-200 text-slate-700' : 'border-slate-800/80 text-slate-300'
              }`}>
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Ước tính đại số: </span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    ≈ {computedDistance.approxText}
                  </span>
                </div>
                <div>
                  <span className={isLight ? 'text-slate-500' : 'text-slate-500'}>Vecto chỉ phương: </span>
                  <span className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-300'}`}>
                    ({computedDistance.vector.join(', ')})
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleApplyDistance}
                  className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Hiển thị thước đo lên mô hình 3D
                </button>
                {activeDistance && (
                  <button
                    type="button"
                    onClick={onClearMeasurement}
                    className={`text-xs cursor-pointer transition ${isLight ? 'text-slate-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-400'}`}
                  >
                    Xóa thước đo
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded-xl border text-xs text-center ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              Vui lòng chọn 2 đỉnh khác nhau để đo khoảng cách.
            </div>
          )}
        </div>
      )}

      {/* MODE 2: DIHEDRAL ANGLE MEASUREMENT */}
      {mode === 'angle' && (
        <div className="space-y-3">
          {/* Plane selection switcher */}
          <div className={`flex items-center gap-4 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Cách chọn mặt phẳng:</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="planeSelect"
                checked={planeSelectionType === 'preset'}
                onChange={() => setPlaneSelectionType('preset')}
                className="text-indigo-600 focus:ring-0"
              />
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Từ các mặt của hình</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="planeSelect"
                checked={planeSelectionType === 'custom'}
                onChange={() => setPlaneSelectionType('custom')}
                className="text-indigo-600 focus:ring-0"
              />
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>Tự chọn 3 điểm tùy ý</span>
            </label>
          </div>

          {planeSelectionType === 'preset' ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Mặt phẳng 1 (P₁):
                </label>
                <select
                  value={presetFace1Name}
                  onChange={(e) => setPresetFace1Name(e.target.value)}
                  className={`w-full px-3 py-1.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                    isLight ? 'bg-slate-50 border-slate-300 text-indigo-950 font-semibold' : 'bg-slate-950 border-slate-800 text-indigo-300'
                  }`}
                >
                  {data.geometry_3d.faces.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-[11px] font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Mặt phẳng 2 (P₂):
                </label>
                <select
                  value={presetFace2Name}
                  onChange={(e) => setPresetFace2Name(e.target.value)}
                  className={`w-full px-3 py-1.5 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer ${
                    isLight ? 'bg-slate-50 border-slate-300 text-indigo-950 font-semibold' : 'bg-slate-950 border-slate-800 text-indigo-300'
                  }`}
                >
                  {data.geometry_3d.faces.map((f) => (
                    <option key={f.name} value={f.name}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 block">
                  3 điểm tạo mặt phẳng (P₁):
                </span>
                {[0, 1, 2].map((idx) => (
                  <select
                    key={`p1-${idx}`}
                    value={customP1Ids[idx]}
                    onChange={(e) => {
                      const next = [...customP1Ids] as [string, string, string];
                      next[idx] = e.target.value;
                      setCustomP1Ids(next);
                    }}
                    className={`w-full px-2 py-1 border rounded-lg text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-cyan-300'
                    }`}
                  >
                    {data.geometry_3d.vertices.map((v) => (
                      <option key={v.id} value={v.id}>
                        Điểm {v.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>

              <div className={`p-2.5 rounded-xl border space-y-1.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`}>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 block">
                  3 điểm tạo mặt phẳng (P₂):
                </span>
                {[0, 1, 2].map((idx) => (
                  <select
                    key={`p2-${idx}`}
                    value={customP2Ids[idx]}
                    onChange={(e) => {
                      const next = [...customP2Ids] as [string, string, string];
                      next[idx] = e.target.value;
                      setCustomP2Ids(next);
                    }}
                    className={`w-full px-2 py-1 border rounded-lg text-xs font-mono ${
                      isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-cyan-300'
                    }`}
                  >
                    {data.geometry_3d.vertices.map((v) => (
                      <option key={v.id} value={v.id}>
                        Điểm {v.label}
                      </option>
                    ))}
                  </select>
                ))}
              </div>
            </div>
          )}

          {/* Dihedral angle calculation card */}
          {computedAngle ? (
            <div className={`p-3.5 rounded-xl border space-y-2 ${
              isLight ? 'bg-indigo-50 border-indigo-200' : 'bg-indigo-950/20 border-indigo-500/30'
            }`}>
              <div className="flex items-center justify-between">
                <div>
                  <span className={`text-xs font-semibold ${isLight ? 'text-indigo-950' : 'text-indigo-300'}`}>
                    Góc nhị diện giữa {computedAngle.plane1Name} và {computedAngle.plane2Name}:
                  </span>
                  <div className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    Quy ước SGK: Góc giữa 2 mặt phẳng α ∈ [0°, 90°]
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-base font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-400/20 px-2.5 py-1 rounded-lg border border-amber-400/30 inline-block">
                    {computedAngle.angleDeg}°
                  </span>
                  <div className={`text-[10px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                    cos α = {computedAngle.cosVal}
                  </div>
                </div>
              </div>

              {/* Mathematical breakdown */}
              <div className={`text-[11px] pt-1.5 border-t space-y-1 ${
                isLight ? 'border-indigo-200 text-slate-700' : 'border-slate-800/80 text-slate-300'
              }`}>
                <div className={`font-mono text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  • Vecto pháp tuyến n₁: ({computedAngle.normal1.map((n) => n.toFixed(2)).join(', ')})
                </div>
                <div className={`font-mono text-[10px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  • Vecto pháp tuyến n₂: ({computedAngle.normal2.map((n) => n.toFixed(2)).join(', ')})
                </div>
                <div className={`text-[11px] font-medium ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  💡 Công thức: cos α = |n₁ · n₂| / (|n₁| · |n₂|) = {computedAngle.cosVal} ⇒ α = {computedAngle.angleDeg}°
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleApplyAngle}
                  className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-1.5 shadow cursor-pointer transition"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Đánh dấu 2 mặt phẳng lên mô hình 3D
                </button>
                {activeAngle && (
                  <button
                    type="button"
                    onClick={onClearMeasurement}
                    className={`text-xs cursor-pointer transition ${isLight ? 'text-slate-500 hover:text-rose-600' : 'text-slate-400 hover:text-rose-400'}`}
                  >
                    Xóa đánh dấu
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className={`p-3 rounded-xl border text-xs text-center ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-slate-950 border-slate-800 text-slate-400'
            }`}>
              Vui lòng chọn 2 mặt phẳng phân biệt để tính góc.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
