import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  FileText,
  Download,
  Printer,
  X,
  Check,
  Sparkles,
  BookOpen,
  Pin,
  Calendar,
  User,
  GraduationCap,
  Layers,
  Settings,
  Eye,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { SolidGeometryOutput, GeometryNote } from '../types/geometry';
import { useTheme } from '../context/ThemeContext';
import { detectShapeCategory, getFormulasForShape } from '../data/geometryFormulas';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: SolidGeometryOutput;
  notes: GeometryNote[];
  snapshotDataUrl: string | null;
}

export function ExportPdfModal({
  isOpen,
  onClose,
  data,
  notes,
  snapshotDataUrl,
}: ExportPdfModalProps) {
  const { isLight } = useTheme();
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Lesson plan customizable fields
  const [teacherName, setTeacherName] = useState('Giáo viên Toán THPT');
  const [schoolName, setSchoolName] = useState('Trường THPT Chuyên / THPT');
  const [className, setClassName] = useState('Toán 11 - 12 (Hình học Không gian)');
  const [lectureTitle, setLectureTitle] = useState(data.problem_analysis.shape_type || 'Chuyên đề Hình học Không gian');
  const [lessonDate, setLessonDate] = useState(
    new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
  );

  // Display toggles
  const [includeSnapshot, setIncludeSnapshot] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeHints, setIncludeHints] = useState(true);
  const [includeCoordinates, setIncludeCoordinates] = useState(true);
  const [includeFormulas, setIncludeFormulas] = useState(true);

  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Handle PDF Generation using html2canvas & jsPDF
  const handleDownloadPdf = async () => {
    if (!printAreaRef.current) return;
    setIsExporting(true);
    setExportSuccess(false);

    try {
      const element = printAreaRef.current;
      // Capture the element at high resolution
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // Add first page
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      // Add extra pages if content spans beyond 1 A4 page
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      const fileName = `BaiGiang_${data.problem_analysis.shape_type.replace(/[\s/\\()]+/g, '_')}_${Date.now()}.pdf`;
      pdf.save(fileName);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setExportError('Không thể tạo file PDF tự động. Vui lòng thử nút In ấn (Print) để lưu dưới dạng PDF của trình duyệt.');
      setTimeout(() => setExportError(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle native browser print
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-5xl max-h-[94vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
          isLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-slate-900 border-slate-700/80 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`flex items-center justify-between px-6 py-4 border-b ${
            isLight
              ? 'bg-gradient-to-r from-indigo-50 via-sky-50 to-indigo-50 border-slate-200'
              : 'bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">Xuất File PDF Bài Giảng Chuyên Nghiệp</h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/30">
                  GDPT 2018
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Đóng gói toàn bộ đề bài, giả thiết, mô hình 3D, ghi chú ghim sư phạm và gợi ý giải toán
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                isLight ? 'bg-white hover:bg-slate-100 border-slate-300 text-slate-700' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
              }`}
              title="In trực tiếp ra máy in hoặc lưu PDF qua hộp thoại Print"
            >
              <Printer className="w-4 h-4 text-slate-500" />
              <span>In bài giảng</span>
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={isExporting}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-500 hover:to-sky-500 text-white shadow-md shadow-indigo-500/25 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Đang tạo PDF...</span>
                </>
              ) : exportSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>Đã tải PDF!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Tải File PDF (.pdf)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isLight ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {exportError && (
          <div className="bg-rose-500/15 border-b border-rose-500/30 text-rose-600 dark:text-rose-400 px-6 py-2 text-xs flex items-center justify-between">
            <span>⚠️ {exportError}</span>
            <button onClick={() => setExportError(null)} className="text-xs font-bold hover:underline cursor-pointer">Đóng</button>
          </div>
        )}

        {/* Modal Main Content: Split Settings & Live A4 Document Preview */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left Column: Lesson Metadata & Customization Controls */}
          <div className="w-full md:w-80 p-5 space-y-5 shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Settings className="w-3.5 h-3.5 text-indigo-500" />
              <span>Thông Tin Bài Dạy & Tuỳ Chỉnh</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Tên chuyên đề / Bài giảng:
                </label>
                <input
                  type="text"
                  value={lectureTitle}
                  onChange={(e) => setLectureTitle(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Giáo viên giảng dạy:
                </label>
                <input
                  type="text"
                  value={teacherName}
                  onChange={(e) => setTeacherName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Trường / Tổ bộ môn:
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Lớp / Khối học:
                </label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>

              <div>
                <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-300">
                  Ngày soạn / giảng:
                </label>
                <input
                  type="text"
                  value={lessonDate}
                  onChange={(e) => setLessonDate(e.target.value)}
                  className={`w-full px-3 py-1.5 rounded-lg border text-xs ${
                    isLight ? 'bg-white border-slate-300' : 'bg-slate-800 border-slate-700'
                  }`}
                />
              </div>
            </div>

            {/* Checkbox toggles */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2.5">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Nội dung bao gồm trong PDF:
              </span>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSnapshot}
                  onChange={(e) => setIncludeSnapshot(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Ảnh chụp mô hình 3D trực quan</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Các ghi chú ghim sư phạm ({notes.length})</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHints}
                  onChange={(e) => setIncludeHints(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Gợi ý phương pháp giải & định lý</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCoordinates}
                  onChange={(e) => setIncludeCoordinates(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Bảng tọa độ Oxyz & yếu tố phụ trợ</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeFormulas}
                  onChange={(e) => setIncludeFormulas(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span>Công thức hình học không gian trọng tâm</span>
              </label>
            </div>
          </div>

          {/* Right Column: Live A4 Document Preview */}
          <div className="flex-1 p-6 overflow-y-auto flex justify-center bg-slate-200/50 dark:bg-slate-950/60">
            {/* Printable A4 Paper Container (Standard A4 ratio 210mm x 297mm) */}
            <div
              ref={printAreaRef}
              id="pdf-lecture-document"
              className="w-full max-w-[760px] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-sm border border-slate-300 font-sans text-xs leading-relaxed print:shadow-none print:border-none print:p-6"
              style={{ minHeight: '1050px' }}
            >
              {/* Official Academic Header */}
              <div className="border-b-2 border-slate-900 pb-4 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-[11px] uppercase tracking-wider text-slate-700">
                      {schoolName}
                    </div>
                    <div className="font-semibold text-[10px] text-slate-500">
                      TỔ BỘ MÔN TOÁN - TIN HỌC
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-[11px] text-indigo-700">
                      CHƯƠNG TRÌNH GDPT 2018
                    </div>
                    <div className="text-[10px] text-slate-500">
                      MÔN TOÁN THPT • HÌNH HỌC 3D
                    </div>
                  </div>
                </div>

                <div className="text-center mt-5 mb-2">
                  <h1 className="text-lg sm:text-xl font-black uppercase text-slate-900 tracking-tight">
                    KẾ HOẠCH BÀI DẠY & PHÂN TÍCH HÌNH HỌC KHÔNG GIAN
                  </h1>
                  <h2 className="text-sm font-bold text-indigo-700 mt-1">
                    CHUYÊN ĐỀ: {lectureTitle.toUpperCase()}
                  </h2>
                </div>

                {/* Teacher & Class Metadata Bar */}
                <div className="flex flex-wrap justify-between items-center text-[10px] text-slate-600 pt-2 border-t border-slate-200 mt-3">
                  <span>
                    <strong>Giáo viên:</strong> {teacherName}
                  </span>
                  <span>
                    <strong>Lớp áp dụng:</strong> {className}
                  </span>
                  <span>
                    <strong>Ngày giảng:</strong> {lessonDate}
                  </span>
                </div>
              </div>

              {/* Section I: Tóm Tắt Đề Bài & Giả Thiết */}
              <div className="mb-6 space-y-3">
                <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 flex items-center gap-1.5 pb-1 border-b border-indigo-200">
                  <span>I. TÓM TẮT ĐỀ BÀI VÀ HỆ THỐNG GIẢ THIẾT</span>
                </h3>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="font-bold text-slate-800 mb-1">Đề bài:</div>
                  <p className="text-slate-700 leading-normal">
                    {data.problem_analysis.problem_statement}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-md">
                    <div className="font-bold text-indigo-900 mb-1">Giả thiết bài toán:</div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700">
                      {data.problem_analysis.hypothesis.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-rose-50/50 border border-rose-100 rounded-md">
                    <div className="font-bold text-rose-900 mb-1">Mục tiêu cần tính / chứng minh:</div>
                    <p className="text-slate-700 leading-normal font-medium">
                      {data.problem_analysis.target}
                    </p>
                  </div>
                </div>
              </div>

              {/* Section II: Mô Hình Hình Học 3D Trực Quan */}
              {includeSnapshot && (
                <div className="mb-6 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 flex items-center gap-1.5 pb-1 border-b border-indigo-200">
                    <span>II. MÔ HÌNH HÌNH HỌC 3D VÀ HÌNH MINH HỌA SƯ PHẠM</span>
                  </h3>

                  <div className="border border-slate-300 rounded-lg p-2 bg-slate-50 text-center">
                    {snapshotDataUrl ? (
                      <img
                        src={snapshotDataUrl}
                        alt="3D Solid Geometry Model Snapshot"
                        className="w-full max-h-[340px] object-contain mx-auto rounded"
                      />
                    ) : (
                      <div className="py-12 text-slate-400 italic">
                        Chưa có ảnh chụp khung nhìn 3D. Nhấn nút nạp ảnh từ viewport.
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 italic mt-1.5">
                      Hình 1: Mô hình không gian 3 chiều {data.problem_analysis.shape_type} (Quy ước nét đứt cạnh khuất SGK)
                    </div>
                  </div>
                </div>
              )}

              {/* Section III: Ghi Chú Ghim Bài Giảng (Sticky Notes) */}
              {includeNotes && notes.length > 0 && (
                <div className="mb-6 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 flex items-center gap-1.5 pb-1 border-b border-indigo-200">
                    <span>III. CÁC GHI CHÚ SƯ PHẠM ĐÃ GHIM TRÊN MÔ HÌNH ({notes.length})</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {notes.map((note) => (
                      <div
                        key={note.id}
                        className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-md space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-amber-900">
                          <span className="flex items-center gap-1">
                            <Pin className="w-3 h-3 text-amber-600" />
                            {note.targetLabel}
                          </span>
                          <span className="text-[9px] text-slate-500 font-normal">
                            {note.createdAt}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-snug">{note.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section IV: Gợi Ý Phương Pháp Giải & Định Lý (Pedagogical Hints) */}
              {includeHints && data.pedagogical_hints && data.pedagogical_hints.length > 0 && (
                <div className="mb-6 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 flex items-center gap-1.5 pb-1 border-b border-indigo-200">
                    <span>IV. HỆ THỐNG GỢI Ý SƯ PHẠM VÀ PHƯƠNG PHÁP GIẢI TOÁN</span>
                  </h3>

                  <div className="space-y-2">
                    {data.pedagogical_hints.map((hint, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-sky-50/50 border border-sky-100 rounded-md flex items-start gap-2.5"
                      >
                        <span className="flex-shrink-0 w-5 h-5 rounded-full bg-sky-200 text-sky-800 font-bold text-[10px] flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <p className="text-slate-700 leading-relaxed font-medium">{hint}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Section V: Bảng Tọa Độ Oxyz & Yếu Tố Phụ Trợ */}
              {includeCoordinates && (
                <div className="mb-8 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 flex items-center gap-1.5 pb-1 border-b border-indigo-200">
                    <span>V. THÔNG SỐ TỌA ĐỘ DESCARTE (OXYZ) VÀ YẾU TỐ PHỤ TRỢ</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Vertices coordinates table */}
                    <div className="border border-slate-200 rounded overflow-hidden">
                      <table className="w-full text-left text-[10px]">
                        <thead className="bg-slate-100 font-bold text-slate-700">
                          <tr>
                            <th className="p-1.5 border-b">Điểm</th>
                            <th className="p-1.5 border-b">X</th>
                            <th className="p-1.5 border-b">Y</th>
                            <th className="p-1.5 border-b">Z</th>
                            <th className="p-1.5 border-b">Vai trò</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {data.geometry_3d.vertices.map((v) => (
                            <tr key={v.id}>
                              <td className="p-1.5 font-bold text-indigo-700">{v.label}</td>
                              <td className="p-1.5">{v.coord[0]}</td>
                              <td className="p-1.5">{v.coord[1]}</td>
                              <td className="p-1.5">{v.coord[2]}</td>
                              <td className="p-1.5 text-slate-500">
                                {v.isAltitudeFoot ? 'Chân đ.cao' : v.coord[2] > 0 ? 'Đỉnh' : 'Đáy'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Right angles & Faces summary */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-2 text-[10px]">
                      <div>
                        <strong>Ký hiệu góc vuông:</strong>{' '}
                        {data.geometry_3d.right_angles.length > 0
                          ? data.geometry_3d.right_angles
                              .map((ra) => `∠(${ra.arm1}${ra.vertex}${ra.arm2}) = 90°`)
                              .join(', ')
                          : 'Theo đề bài'}
                      </div>
                      <div>
                        <strong>Mặt phẳng thiết diện / Phụ trợ:</strong>{' '}
                        {data.geometry_3d.faces.map((f) => f.name).join('; ')}
                      </div>
                      <div>
                        <strong>Quy ước nét vẽ SGK:</strong> Đường thẳng vuông góc mặt đáy (cạnh đứng/đường cao), cạnh nhìn thấy nét liền, cạnh khuất nét đứt.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section: Hệ thống công thức hình học không gian liên quan */}
              {includeFormulas && (
                <div className="mb-6 space-y-3">
                  <h3 className="font-bold text-xs uppercase tracking-wide text-indigo-900 flex items-center gap-1.5 pb-1 border-b border-indigo-200">
                    <span>V. CÔNG THỨC HÌNH HỌC KHÔNG GIAN TRỌNG TÂM ({data.problem_analysis.shape_type})</span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {getFormulasForShape(detectShapeCategory(data.problem_analysis.shape_type))
                      .slice(0, 4)
                      .map((f) => (
                        <div
                          key={f.id}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-1"
                        >
                          <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950">
                            <span>{f.name}</span>
                            <span className="font-mono text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded border border-indigo-200 text-[10px]">
                              {f.formulaDisplay}
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-600 leading-snug">{f.description}</p>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Sign-off signatures */}
              <div className="pt-6 border-t border-slate-300 grid grid-cols-2 text-center text-[11px]">
                <div>
                  <div className="font-bold text-slate-800 uppercase">TỔ TRƯỞNG CHUYÊN MÔN</div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">(Ký và ghi rõ họ tên)</div>
                  <div className="h-16" />
                </div>
                <div>
                  <div className="font-bold text-slate-800 uppercase">GIÁO VIÊN BỘ MÔN</div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">{teacherName}</div>
                  <div className="h-16" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div
          className={`px-6 py-3 border-t flex items-center justify-between text-xs ${
            isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-slate-950 border-slate-800 text-slate-400'
          }`}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
            <span>Tài liệu bài giảng thiết kế chuẩn tỉ lệ A4, tương thích in màu và in đen trắng.</span>
          </div>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
              isLight ? 'hover:bg-slate-200 text-slate-600' : 'hover:bg-slate-800 text-slate-300'
            }`}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
