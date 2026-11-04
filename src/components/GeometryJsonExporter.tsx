import React, { useState } from 'react';
import { Code2, Copy, Check, Download, Upload, Eye } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SolidGeometryOutput } from '../types/geometry';

interface GeometryJsonExporterProps {
  data: SolidGeometryOutput;
  onImportJson?: (importedData: SolidGeometryOutput) => void;
}

export const GeometryJsonExporter: React.FC<GeometryJsonExporterProps> = ({
  data,
  onImportJson,
}) => {
  const { isLight } = useTheme();
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hinh_hoc_3d_${data.problem_analysis.shape_type.replace(/\s+/g, '_')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.problem_analysis && parsed.geometry_3d) {
          onImportJson?.(parsed);
        } else {
          alert('Tệp JSON không đúng định dạng schema hình học không gian 3D.');
        }
      } catch (err) {
        alert('Tệp JSON không hợp lệ.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className={`border rounded-2xl overflow-hidden shadow-xl transition-colors ${
      isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-200'
    }`}>
      <div className={`flex items-center justify-between px-4 py-3 border-b transition-colors ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/70'
      }`}>
        <div className="flex items-center gap-2">
          <Code2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
            Dữ Liệu JSON Chuẩn Three.js / GDPT 2018
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 ${
              isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {isExpanded ? 'Thu gọn' : 'Xem mã'}
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer flex items-center gap-1 shadow-sm border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
            }`}
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Đã sao chép' : 'Sao chép JSON'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className={`p-1.5 rounded-lg border transition cursor-pointer ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
            }`}
            title="Tải tệp .json về máy"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {onImportJson && (
            <label
              className={`p-1.5 rounded-lg border transition cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700'
              }`}
              title="Nhập tệp .json từ máy"
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-slate-950 font-mono text-[11px] leading-relaxed overflow-x-auto max-h-72 text-cyan-300/90 border-t border-slate-800/80">
          <pre>{jsonString}</pre>
        </div>
      )}
    </div>
  );
};
