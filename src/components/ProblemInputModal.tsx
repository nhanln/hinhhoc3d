import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Camera,
  Mic,
  MicOff,
  Sparkles,
  FileText,
  Image as ImageIcon,
  BookOpen,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { PRESET_PROBLEMS, PresetProblem } from '../data/presetProblems';
import { useTheme } from '../context/ThemeContext';

interface ProblemInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (params: { prompt?: string; imageBase64?: string; mimeType?: string }) => Promise<void>;
  onSelectPreset: (preset: PresetProblem) => void;
  isLoading: boolean;
}

export const ProblemInputModal: React.FC<ProblemInputModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onSelectPreset,
  isLoading,
}) => {
  const { isLight } = useTheme();
  const [activeTab, setActiveTab] = useState<'text' | 'image' | 'preset'>('text');
  const [promptText, setPromptText] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ base64: string; mimeType: string; previewUrl: string } | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            setPromptText((prev) => (prev ? `${prev} ${currentTranscript}` : currentTranscript));
          }
        };

        recognition.onerror = () => {
          setIsRecording(false);
        };

        recognition.onend = () => {
          setIsRecording(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      stopCamera();
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setErrorMessage('Trình duyệt chưa hỗ trợ Web Speech API. Bạn có thể nhập đề bài bằng văn bản.');
      return;
    }

    if (isRecording) {
      recognitionRef.current.stop();
      setIsRecording(false);
    } else {
      setErrorMessage(null);
      try {
        recognitionRef.current.start();
        setIsRecording(true);
      } catch (err) {
        setIsRecording(false);
      }
    }
  };

  const insertSymbol = (sym: string) => {
    setPromptText((prev) => prev + sym);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WebP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setSelectedImage({
        base64,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file),
      });
      setErrorMessage(null);
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      setErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      setErrorMessage('Không thể mở máy ảnh. Vui lòng cấp quyền truy cập camera hoặc tải ảnh lên.');
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const captureCameraFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    setSelectedImage({
      base64,
      mimeType: 'image/jpeg',
      previewUrl: base64,
    });
    stopCamera();
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen || activeTab !== 'image') return;
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) handleImageFile(file);
          break;
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, activeTab]);

  const handleSubmit = async () => {
    if (!promptText.trim() && !selectedImage) {
      setErrorMessage('Vui lòng nhập đề bài hoặc tải ảnh hình học không gian lên.');
      return;
    }

    setErrorMessage(null);
    try {
      await onSubmit({
        prompt: promptText.trim() || undefined,
        imageBase64: selectedImage?.base64,
        mimeType: selectedImage?.mimeType,
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Có lỗi xảy ra khi xử lý.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`relative w-full max-w-2xl border rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-colors ${
        isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-800 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isLight ? 'border-slate-200 bg-slate-50/70' : 'border-slate-800 bg-slate-900'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isLight ? 'bg-cyan-50 text-cyan-600 border-cyan-200' : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
            }`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                Nhập Đề Bài Hình Học Không Gian
              </h2>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                Chương trình GDPT 2018 Toán 11 & 12 • Tự động dựng mô hình 3D
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

        {/* Tabs */}
        <div className={`flex border-b px-6 ${
          isLight ? 'border-slate-200 bg-slate-100/70' : 'border-slate-800 bg-slate-950/50'
        }`}>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'text'
                ? isLight ? 'border-cyan-600 text-cyan-700' : 'border-cyan-500 text-cyan-400'
                : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Văn bản & Giọng nói
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'image'
                ? isLight ? 'border-cyan-600 text-cyan-700' : 'border-cyan-500 text-cyan-400'
                : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            Ảnh SGK / Vẽ phác
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'preset'
                ? isLight ? 'border-cyan-600 text-cyan-700' : 'border-cyan-500 text-cyan-400'
                : isLight ? 'border-transparent text-slate-500 hover:text-slate-800' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Bài mẫu chuẩn SGK
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4">
          {errorMessage && (
            <div className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs ${
              isLight ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-3">
              <div className="relative">
                <textarea
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Nhập hoặc dán đề bài hình học không gian (ví dụ: Cho hình chóp S.ABCD có đáy ABCD là hình vuông cạnh a, SA vuông góc với mặt phẳng đáy (ABCD), SA = a√3. Tính khoảng cách từ điểm A đến mặt phẳng (SCD)...)"
                  className={`w-full h-36 px-4 py-3 border rounded-xl text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-sans ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-800 text-slate-100 placeholder-slate-500'
                  }`}
                />
                <div className="absolute right-3 bottom-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleRecording}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer shadow-md ${
                      isRecording
                        ? 'bg-rose-600 text-white animate-pulse'
                        : isLight
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300 hover:text-slate-900'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
                    <span>{isRecording ? 'Đang nghe...' : 'Đọc bằng mic'}</span>
                  </button>
                </div>
              </div>

              <div className={`flex items-center flex-wrap gap-1.5 text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>Chèn nhanh:</span>
                {[
                  '⊥ (vuông góc)',
                  '// (song song)',
                  'SA ⊥ (ABC)',
                  'SO ⊥ (ABCD)',
                  'a√2',
                  'a√3',
                  'α',
                  'Δ',
                  '(SAB)',
                  '(SBC)',
                ].map((sym) => {
                  const cleanSym = sym.split(' ')[0];
                  return (
                    <button
                      key={sym}
                      type="button"
                      onClick={() => insertSymbol(` ${cleanSym} `)}
                      className={`px-2 py-0.5 rounded text-[11px] border transition cursor-pointer ${
                        isLight
                          ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                          : 'bg-slate-800/80 hover:bg-slate-700 hover:text-cyan-300 text-slate-300 border-slate-700/50'
                      }`}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className="space-y-4">
              {isCameraActive ? (
                <div className="relative rounded-2xl overflow-hidden bg-black border border-slate-800 aspect-video flex items-center justify-center">
                  <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  <div className="absolute bottom-4 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={captureCameraFrame}
                      className="px-5 py-2 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs flex items-center gap-2 shadow-lg cursor-pointer"
                    >
                      <Camera className="w-4 h-4" />
                      Chụp ảnh đề bài
                    </button>
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs cursor-pointer"
                    >
                      Hủy
                    </button>
                  </div>
                </div>
              ) : selectedImage ? (
                <div className={`relative rounded-2xl overflow-hidden border p-2 flex flex-col items-center ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <img
                    src={selectedImage.previewUrl}
                    alt="Đề bài hình học"
                    className="max-h-64 object-contain rounded-xl"
                  />
                  <div className={`w-full flex items-center justify-between mt-2 pt-2 border-t px-2 ${
                    isLight ? 'border-slate-200' : 'border-slate-800/80'
                  }`}>
                    <span className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>Ảnh đã tải lên sẵn sàng phân tích</span>
                    <button
                      type="button"
                      onClick={() => setSelectedImage(null)}
                      className="text-xs text-rose-500 hover:text-rose-600 font-medium cursor-pointer"
                    >
                      Xóa ảnh này
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleImageFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition ${
                    isLight
                      ? 'border-slate-300 hover:border-cyan-500 bg-slate-50/60'
                      : 'border-slate-800 hover:border-cyan-500/50 bg-slate-950/40'
                  }`}
                >
                  <div className={`p-4 rounded-2xl mb-3 ${
                    isLight ? 'bg-cyan-50 text-cyan-600' : 'bg-cyan-500/10 text-cyan-400'
                  }`}>
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className={`text-sm font-medium mb-1 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}>
                    Kéo & thả ảnh đề SGK, ảnh vẽ tay hoặc dán từ clipboard (Ctrl+V)
                  </p>
                  <p className={`text-xs mb-4 max-w-sm ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
                    Hỗ trợ ảnh chụp điện thoại đề bài thi THPT, hình vẽ hình học không gian, hoặc bản vẽ phác thảo.
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`px-4 py-2 rounded-xl text-xs font-medium cursor-pointer transition flex items-center gap-2 ${
                        isLight
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      <ImageIcon className="w-4 h-4 text-cyan-500" />
                      Tải ảnh từ máy
                    </button>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium cursor-pointer transition flex items-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Mở máy ảnh
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleImageFile(e.target.files[0]);
                      }
                    }}
                  />
                </div>
              )}

              <div>
                <label className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                  Ghi chú hoặc câu hỏi phụ kèm theo ảnh (tùy chọn):
                </label>
                <input
                  type="text"
                  value={promptText}
                  onChange={(e) => setPromptText(e.target.value)}
                  placeholder="Ví dụ: Tính góc giữa SC và đáy, kẻ thêm đường cao AH vuông góc SB"
                  className={`w-full px-3 py-2 border rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-cyan-500 ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400'
                      : 'bg-slate-950 border-slate-800 text-slate-100'
                  }`}
                />
              </div>
            </div>
          )}

          {activeTab === 'preset' && (
            <div className="space-y-3">
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Chọn nhanh một trong các mô hình bài toán kinh điển trong đề thi Tốt nghiệp THPT:
              </p>
              <div className="grid grid-cols-1 gap-2.5">
                {PRESET_PROBLEMS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => {
                      onSelectPreset(preset);
                      onClose();
                    }}
                    className={`p-3.5 rounded-2xl border text-left transition group cursor-pointer flex items-start justify-between ${
                      isLight
                        ? 'bg-slate-50 hover:bg-cyan-50/60 border-slate-200 hover:border-cyan-300 text-slate-800'
                        : 'bg-slate-950/70 hover:bg-cyan-950/30 border-slate-800 hover:border-cyan-500/40 text-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-medium ${
                          isLight ? 'bg-cyan-100 text-cyan-800' : 'bg-cyan-500/20 text-cyan-400'
                        }`}>
                          {preset.category}
                        </span>
                        <h4 className={`text-xs font-semibold ${
                          isLight ? 'text-slate-800 group-hover:text-cyan-700' : 'text-slate-200 group-hover:text-cyan-300'
                        }`}>
                          {preset.title}
                        </h4>
                      </div>
                      <p className={`text-[11px] line-clamp-2 ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                        {preset.description}
                      </p>
                    </div>
                    <span className="text-xs text-cyan-600 opacity-0 group-hover:opacity-100 transition shrink-0 ml-2 font-medium">
                      Xem 3D →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {activeTab !== 'preset' && (
          <div className={`flex items-center justify-between px-6 py-4 border-t ${
            isLight ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-slate-950/60'
          }`}>
            <span className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>
              Mô hình 3D được tính toán tọa độ và xác định nét khuất tự động bằng Gemini AI.
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
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
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs transition flex items-center gap-2 shadow-lg shadow-cyan-500/20 disabled:opacity-50 cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                    <span>Đang dựng hình 3D...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                    <span>Dựng mô hình 3D</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
