import React, { useState } from 'react';
import {
  StickyNote,
  Plus,
  Trash2,
  X,
  Edit3,
  Check,
  Tag,
  Sparkles,
  ChevronRight,
  Pin
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { GeometryNote, GeometryVertex, GeometryEdge } from '../types/geometry';

interface StickyNotesManagerProps {
  notes: GeometryNote[];
  selectedTarget: {
    type: 'vertex' | 'edge';
    id: string;
    label: string;
    coord?: [number, number, number];
  } | null;
  onSaveNote: (note: Omit<GeometryNote, 'id' | 'createdAt'>) => void;
  onDeleteNote: (id: string) => void;
  onCloseEditor: () => void;
  onFocusTarget: (targetType: 'vertex' | 'edge', targetId: string) => void;
}

const NOTE_COLORS: {
  key: GeometryNote['color'];
  name: string;
  bg: string;
  border: string;
  text: string;
  badge: string;
}[] = [
  {
    key: 'yellow',
    name: 'Vàng SGK',
    bg: 'bg-amber-100 dark:bg-amber-950/70',
    border: 'border-amber-400',
    text: 'text-amber-950 dark:text-amber-200',
    badge: 'bg-amber-400 text-slate-950',
  },
  {
    key: 'cyan',
    name: 'Xanh Cyan',
    bg: 'bg-cyan-100 dark:bg-cyan-950/70',
    border: 'border-cyan-400',
    text: 'text-cyan-950 dark:text-cyan-200',
    badge: 'bg-cyan-400 text-slate-950',
  },
  {
    key: 'pink',
    name: 'Hồng Phấn',
    bg: 'bg-pink-100 dark:bg-pink-950/70',
    border: 'border-pink-400',
    text: 'text-pink-950 dark:text-pink-200',
    badge: 'bg-pink-400 text-slate-950',
  },
  {
    key: 'emerald',
    name: 'Xanh Lá',
    bg: 'bg-emerald-100 dark:bg-emerald-950/70',
    border: 'border-emerald-400',
    text: 'text-emerald-950 dark:text-emerald-200',
    badge: 'bg-emerald-400 text-slate-950',
  },
  {
    key: 'purple',
    name: 'Tím Hoa Cà',
    bg: 'bg-purple-100 dark:bg-purple-950/70',
    border: 'border-purple-400',
    text: 'text-purple-950 dark:text-purple-200',
    badge: 'bg-purple-400 text-slate-950',
  },
];

const QUICK_SUGGESTIONS = [
  'Đường cao vuông góc mặt phẳng đáy',
  'Góc nhị diện cần xác định',
  'Đoạn vuông góc chung giữa 2 đường thẳng',
  'Hình chiếu vuông góc của đỉnh S',
  'Trung điểm cạnh - áp dụng định lý Talet/đường trung bình',
  'Cần kẻ thêm đường phụ vuông góc',
  'Độ dài bằng a√3 theo giả thiết',
];

export const StickyNotesManager: React.FC<StickyNotesManagerProps> = ({
  notes,
  selectedTarget,
  onSaveNote,
  onDeleteNote,
  onCloseEditor,
  onFocusTarget,
}) => {
  const { isLight } = useTheme();
  const [content, setContent] = useState('');
  const [selectedColor, setSelectedColor] = useState<GeometryNote['color']>('yellow');

  // Check if existing note for selected target exists
  const existingNote = selectedTarget
    ? notes.find((n) => n.targetType === selectedTarget.type && n.targetId === selectedTarget.id)
    : null;

  // Initialize content when selected target changes
  React.useEffect(() => {
    if (existingNote) {
      setContent(existingNote.content);
      setSelectedColor(existingNote.color);
    } else {
      setContent('');
      setSelectedColor('yellow');
    }
  }, [selectedTarget, existingNote]);

  const handleSave = () => {
    if (!selectedTarget || !content.trim()) return;
    onSaveNote({
      targetType: selectedTarget.type,
      targetId: selectedTarget.id,
      targetLabel: selectedTarget.label,
      content: content.trim(),
      color: selectedColor,
      coord: selectedTarget.coord,
    });
    onCloseEditor();
  };

  return (
    <div className={`border rounded-2xl shadow-xl overflow-hidden flex flex-col space-y-3 transition-colors ${
      isLight ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${
        isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/80'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h3 className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
              Ghi Chú Cá Nhân Trên Mô Hình (Sticky Notes)
            </h3>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
              Gắn ghi chú trực tiếp vào đỉnh hoặc cạnh để ghi nhớ giả thiết và phương pháp giải
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          {notes.length} ghi chú
        </span>
      </div>

      {/* Editor when a target is actively selected */}
      {selectedTarget ? (
        <div className={`p-4 border-b space-y-3 ${
          isLight ? 'bg-slate-50/80 border-slate-200' : 'bg-slate-950/60 border-slate-800/80'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className={`text-xs font-semibold ${isLight ? 'text-cyan-800' : 'text-cyan-400'}`}>
                Thêm ghi chú cho {selectedTarget.label}:
              </span>
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                ({selectedTarget.type === 'vertex' ? 'Đỉnh' : 'Cạnh'})
              </span>
            </div>
            <button
              type="button"
              onClick={onCloseEditor}
              className={`p-1 transition ${isLight ? 'text-slate-500 hover:text-slate-800' : 'text-slate-500 hover:text-slate-300'}`}
              title="Đóng trình soạn ghi chú"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Color Palette Selector */}
          <div className="flex items-center gap-2">
            <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Màu giấy note:</span>
            <div className="flex items-center gap-1.5">
              {NOTE_COLORS.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  onClick={() => setSelectedColor(c.key)}
                  className={`w-5 h-5 rounded-full transition-transform cursor-pointer border ${
                    c.border
                  } ${c.badge} ${
                    selectedColor === c.key ? 'scale-125 ring-2 ring-cyan-500 shadow-md' : 'opacity-70 hover:opacity-100'
                  }`}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Text Area */}
          <div className="space-y-1.5">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập ghi chú cho đỉnh/cạnh này (ví dụ: SA vuông góc mặt phẳng (ABC), tam giác SAB vuông cân tại A...)"
              className={`w-full h-20 px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none font-sans ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-800 placeholder-slate-400'
                  : 'bg-slate-900 border-slate-700 text-slate-100 placeholder-slate-500'
              }`}
            />

            {/* Quick Suggestions */}
            <div className="flex items-center flex-wrap gap-1">
              <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Gợi ý nhanh:</span>
              {QUICK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setContent((prev) => (prev ? `${prev}. ${sug}` : sug))}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                    isLight
                      ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-cyan-800'
                      : 'bg-slate-800 text-slate-400 hover:text-cyan-300 hover:bg-slate-700'
                  }`}
                >
                  +{sug}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            {existingNote ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteNote(existingNote.id);
                  onCloseEditor();
                }}
                className={`px-3 py-1 rounded-lg text-xs flex items-center gap-1 transition cursor-pointer ${
                  isLight ? 'bg-rose-50 text-rose-700 hover:bg-rose-100' : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Xóa ghi chú này</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onCloseEditor}
                className={`px-3 py-1 rounded-lg text-xs transition cursor-pointer ${
                  isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={!content.trim()}
                className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50 transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{existingNote ? 'Cập nhật ghi chú' : 'Ghim ghi chú 3D'}</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`px-4 py-2.5 text-xs flex items-center justify-between ${
          isLight ? 'text-slate-600 bg-slate-50' : 'text-slate-400 bg-slate-950/40'
        }`}>
          <span>💡 Mẹo: Bấm trực tiếp vào đỉnh hoặc cạnh trên không gian 3D để thêm ghi chú nhanh.</span>
        </div>
      )}

      {/* List of Existing Sticky Notes */}
      <div className="p-4 pt-0 space-y-2.5">
        {notes.length === 0 ? (
          <div className="p-4 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
            Chưa có ghi chú nào. Hãy nhấp vào một đỉnh hoặc cạnh trên mô hình 3D để ghim ghi chú học tập đầu tiên!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {notes.map((note) => {
              const colorConfig =
                NOTE_COLORS.find((c) => c.key === note.color) || NOTE_COLORS[0];
              return (
                <div
                  key={note.id}
                  className={`p-3 rounded-xl border ${colorConfig.border} ${colorConfig.bg} shadow-md transition-all hover:scale-[1.02] flex flex-col justify-between space-y-2`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <button
                        type="button"
                        onClick={() => onFocusTarget(note.targetType, note.targetId)}
                        className="flex items-center gap-1 font-bold text-xs hover:underline cursor-pointer text-slate-900 dark:text-white"
                      >
                        <Pin className="w-3 h-3 text-amber-500" />
                        <span>{note.targetLabel}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        className="text-slate-400 hover:text-rose-500 p-0.5 rounded transition cursor-pointer"
                        title="Xóa ghi chú"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className={`text-xs leading-relaxed font-sans ${colorConfig.text} whitespace-pre-wrap`}>
                      {note.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-500/20">
                    <span>{note.createdAt}</span>
                    <button
                      type="button"
                      onClick={() => onFocusTarget(note.targetType, note.targetId)}
                      className="text-cyan-600 dark:text-cyan-400 font-medium hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>Xem trên 3D</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
