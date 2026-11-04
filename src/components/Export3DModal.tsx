import React, { useState } from 'react';
import {
  Download,
  Box,
  Layers,
  Sparkles,
  Printer,
  X,
  FileCode,
  CheckCircle2,
  Sliders,
  Info
} from 'lucide-react';
import { SolidGeometryOutput } from '../types/geometry';
import { export3DModel, Export3DOptions } from '../utils/export3D';
import { useTheme } from '../context/ThemeContext';

interface Export3DModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SolidGeometryOutput;
}

export const Export3DModal: React.FC<Export3DModalProps> = ({
  isOpen,
  onClose,
  data,
}) => {
  const { isLight } = useTheme();
  const [format, setFormat] = useState<'stl' | 'obj'>('stl');
  const [includeStrutsAndJoints, setIncludeStrutsAndJoints] = useState<boolean>(true);
  const [includeFaces, setIncludeFaces] = useState<boolean>(false);
  const [strutRadius, setStrutRadius] = useState<number>(0.08);
  const [jointRadius, setJointRadius] = useState<number>(0.16);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    try {
      const options: Export3DOptions = {
        format,
        includeStrutsAndJoints,
        includeFaces,
        strutRadius,
        jointRadius,
      };
      export3DModel(data, options);
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 600);
    } catch (err) {
      console.error('Export error:', err);
      setIsExporting(false);
    }
  };

  const defaultFilename = `mo_hinh_3d_${data.problem_analysis.shape_type.toLowerCase().replace(/[^a-z0-9]/gi, '_')}.${format}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-lg border rounded-3xl shadow-2xl overflow-hidden flex flex-col transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/70'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isLight ? 'bg-cyan-50 text-cyan-600 border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}>
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Xuất Tệp 3D (.OBJ / .STL)
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                In 3D vật lý hoặc mở trong Blender, AutoCAD, SolidWorks
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${
              isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-200' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Format Selection Cards */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              1. Chọn định dạng tệp xuất:
            </label>
            <div className="grid grid-cols-2 gap-3">
              {/* STL Option */}
              <button
                type="button"
                onClick={() => setFormat('stl')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                  format === 'stl'
                    ? isLight
                      ? 'bg-cyan-50/80 border-cyan-500 text-cyan-950 shadow-md ring-1 ring-cyan-500'
                      : 'bg-cyan-950/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                    : isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Printer className={`w-4 h-4 ${format === 'stl' ? 'text-cyan-600' : isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-xs">.STL (Khuyên dùng)</span>
                  </div>
                  {format === 'stl' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                </div>
                <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Định dạng nhị phân chuẩn cho máy in 3D (Cura, PrusaSlicer, Bambu Lab).
                </p>
              </button>

              {/* OBJ Option */}
              <button
                type="button"
                onClick={() => setFormat('obj')}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer relative ${
                  format === 'obj'
                    ? isLight
                      ? 'bg-cyan-50/80 border-cyan-500 text-cyan-950 shadow-md ring-1 ring-cyan-500'
                      : 'bg-cyan-950/40 border-cyan-400 text-white shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400'
                    : isLight
                      ? 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-600'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <FileCode className={`w-4 h-4 ${format === 'obj' ? 'text-cyan-600' : isLight ? 'text-slate-400' : 'text-slate-500'}`} />
                    <span className="font-bold text-xs">.OBJ (Wavefront)</span>
                  </div>
                  {format === 'obj' && <CheckCircle2 className="w-4 h-4 text-cyan-600" />}
                </div>
                <p className={`text-[11px] leading-snug ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                  Phù hợp dựng phim, thiết kế CAD trong Blender, SketchUp, AutoCAD, Maya.
                </p>
              </button>
            </div>
          </div>

          {/* Model Elements Selection */}
          <div className={`space-y-3 p-4 rounded-2xl border ${
            isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/70 border-slate-800/80'
          }`}>
            <span className={`text-xs font-semibold block ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              2. Cấu trúc mô hình in 3D:
            </span>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeStrutsAndJoints}
                onChange={(e) => setIncludeStrutsAndJoints(e.target.checked)}
                className="mt-0.5 rounded border-slate-400 text-cyan-600 focus:ring-cyan-500/40 cursor-pointer"
              />
              <div>
                <span className={`text-xs font-medium group-hover:text-cyan-600 transition ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  Tạo khung que và khớp cầu đặc (Wireframe Struts & Joint Spheres)
                </span>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Tạo các thanh trụ đặc có thể tích nối giữa các đỉnh và khối cầu tại đỉnh để máy in 3D có thể in thành mô hình cầm tay.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={includeFaces}
                onChange={(e) => setIncludeFaces(e.target.checked)}
                className="mt-0.5 rounded border-slate-400 text-cyan-600 focus:ring-cyan-500/40 cursor-pointer"
              />
              <div>
                <span className={`text-xs font-medium group-hover:text-cyan-600 transition ${
                  isLight ? 'text-slate-800' : 'text-slate-200'
                }`}>
                  Bao gồm các mặt phẳng đa giác (Faces)
                </span>
                <p className={`text-[11px] mt-0.5 ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                  Xuất các mặt phẳng đáy và mặt bên dạng lưới tam giác 3D.
                </p>
              </div>
            </label>

            {/* Custom Strut Thickness (when struts are enabled) */}
            {includeStrutsAndJoints && (
              <div className={`pt-3 border-t space-y-3 ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Độ dày thanh que (Strut Radius):</span>
                    <span className="font-mono text-cyan-600 font-bold">{strutRadius.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.04"
                    max="0.18"
                    step="0.01"
                    value={strutRadius}
                    onChange={(e) => setStrutRadius(parseFloat(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>Bán kính khớp đỉnh (Joint Sphere Radius):</span>
                    <span className="font-mono text-cyan-600 font-bold">{jointRadius.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="0.08"
                    max="0.25"
                    step="0.01"
                    value={jointRadius}
                    onChange={(e) => setJointRadius(parseFloat(e.target.value))}
                    className="w-full accent-cyan-600 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Model Statistics Overview */}
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
            isLight ? 'bg-cyan-50/60 border-cyan-200 text-cyan-900' : 'bg-cyan-950/20 border-cyan-500/30 text-cyan-300'
          }`}>
            <div className="flex items-center gap-2">
              <Box className="w-4 h-4 text-cyan-600" />
              <span className="font-medium">Dữ liệu: {data.problem_analysis.shape_type}</span>
            </div>
            <div className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              {data.geometry_3d.vertices.length} Đỉnh • {data.geometry_3d.edges.length} Cạnh
            </div>
          </div>

          <div className={`flex items-start gap-2 text-[11px] p-3 rounded-xl border ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950/40 border-slate-800/80 text-slate-400'
          }`}>
            <Info className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <span>
              Tệp xuất ra sẽ tự động tải về trình duyệt dưới tên: <strong className={`font-mono ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>{defaultFilename}</strong>. Học sinh có thể nạp trực tiếp vào máy in 3D của trường học.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${
          isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/80'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
              isLight
                ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={!includeStrutsAndJoints && !includeFaces}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Đang tạo tệp 3D...' : `Tải tệp .${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
