import { SolidGeometryOutput, GeometryNote } from '../types/geometry';
import { VoiceTourScript, VoiceTourStep } from '../types/voiceTour';

/**
 * Generate a smart, pedagogically-structured voice-guided tour script
 * from the loaded 3D solid geometry output and teacher's sticky notes.
 */
export function generateVoiceTourScript(
  data: SolidGeometryOutput,
  notes: GeometryNote[] = []
): VoiceTourScript {
  const { problem_analysis, geometry_3d, pedagogical_hints } = data;
  const { shape_type, problem_statement } = problem_analysis;
  const { vertices, edges, right_angles } = geometry_3d;

  const steps: VoiceTourStep[] = [];
  let stepOrder = 1;

  // 1. Step 1: Overview of the 3D model & Problem statement
  const cleanStatement = problem_statement
    ? problem_statement.replace(/\s+/g, ' ').slice(0, 180)
    : `Khảo sát tính chất và thể tích của mô hình ${shape_type}.`;

  steps.push({
    id: `step-${stepOrder}`,
    order: stepOrder++,
    title: `1. Tổng quan mô hình: ${shape_type}`,
    speechText: `Chào các em. Hôm nay chúng ta cùng tìm hiểu bài toán hình học không gian: ${shape_type}. Giả thiết đề bài như sau: ${cleanStatement}. Hãy quan sát tổng thể mô hình ba chiều trên màn hình.`,
    captionText: `Tổng quan: ${shape_type} • ${cleanStatement}`,
    targetType: 'overview',
    cameraPreset: 'sgk',
    durationSeconds: 7,
  });

  // 2. Step 2: Base plane & key base vertices
  const baseVertices = vertices.filter((v) => v.coord[2] === 0);
  const baseLabels = baseVertices.map((v) => v.label).join('');
  const keyBaseVertex =
    baseVertices.find((v) => right_angles.some((ra) => ra.vertex === v.id)) ||
    baseVertices[0] ||
    vertices[0];

  const rightAngleOnBase = right_angles.find((ra) =>
    baseVertices.some((bv) => bv.id === ra.vertex)
  );

  let baseSpeech = `Trước tiên, các em quan sát mặt phẳng đáy ${baseLabels || 'của hình'}. `;
  if (rightAngleOnBase) {
    const raVertex = vertices.find((v) => v.id === rightAngleOnBase.vertex)?.label || rightAngleOnBase.vertex;
    baseSpeech += `Đặc biệt lưu ý đỉnh ${raVertex}, tại đây có góc vuông ${rightAngleOnBase.arm1}${raVertex}${rightAngleOnBase.arm2} bằng 90 độ, là nền tảng để áp dụng định lý Pytago và tính diện tích đáy.`;
  } else {
    baseSpeech += `Các đỉnh của mặt đáy đều nằm trên mặt phẳng tọa độ z bằng 0. Ta cần nắm vững hình dạng đáy để thuận tiện tính toán diện tích.`;
  }

  steps.push({
    id: `step-${stepOrder}`,
    order: stepOrder++,
    title: `2. Khảo sát mặt đáy & Đỉnh ${keyBaseVertex ? keyBaseVertex.label : 'đáy'}`,
    speechText: baseSpeech,
    captionText: `Mặt đáy ${baseLabels}: Đỉnh then chốt ${keyBaseVertex?.label || ''}`,
    targetType: 'vertex',
    targetId: keyBaseVertex?.id,
    targetLabel: `Đỉnh ${keyBaseVertex?.label}`,
    cameraPreset: 'top',
    durationSeconds: 8,
  });

  // 3. Step 3: Altitude & Apex / Key Vertical Edge
  const altitudeEdge =
    edges.find((e) => e.isAltitude) ||
    edges.find((e) => {
      const v1 = vertices.find((v) => v.id === e.start);
      const v2 = vertices.find((v) => v.id === e.end);
      return (v1 && v1.coord[2] > 0 && v2 && v2.coord[2] === 0) || (v2 && v2.coord[2] > 0 && v1 && v1.coord[2] === 0);
    });

  const altitudeFoot = vertices.find((v) => v.isAltitudeFoot);
  const topVertex = vertices.find((v) => v.coord[2] > 0) || vertices[0];

  if (altitudeEdge) {
    const startLbl = vertices.find((v) => v.id === altitudeEdge.start)?.label || altitudeEdge.start;
    const endLbl = vertices.find((v) => v.id === altitudeEdge.end)?.label || altitudeEdge.end;
    const edgeLabel = `${startLbl}${endLbl}`;

    steps.push({
      id: `step-${stepOrder}`,
      order: stepOrder++,
      title: `3. Đường cao then chốt: Cạnh ${edgeLabel}`,
      speechText: `Tiếp theo, hãy quan sát đường cao ${edgeLabel}. Đường thẳng này vuông góc với mặt phẳng đáy, do đó nó vuông góc với mọi đường thẳng nằm trong mặt đáy. Đây chính là chìa khóa để dựng góc và khoảng cách trong không gian.`,
      captionText: `Đường cao ${edgeLabel} ⊥ Mặt đáy (Chiều cao h của khối hình)`,
      targetType: 'edge',
      targetId: `${altitudeEdge.start}-${altitudeEdge.end}`,
      targetLabel: `Cạnh ${edgeLabel}`,
      cameraPreset: 'front',
      durationSeconds: 8,
    });
  } else if (topVertex) {
    steps.push({
      id: `step-${stepOrder}`,
      order: stepOrder++,
      title: `3. Đỉnh chóp ${topVertex.label}`,
      speechText: `Tiếp theo, chúng ta quan sát đỉnh chóp ${topVertex.label}. Từ đỉnh này, các cạnh bên kết nối xuống đáy tạo thành các mặt bên của khối đa diện.`,
      captionText: `Đỉnh chóp ${topVertex.label} trong không gian 3D`,
      targetType: 'vertex',
      targetId: topVertex.id,
      targetLabel: `Đỉnh ${topVertex.label}`,
      cameraPreset: 'front',
      durationSeconds: 6,
    });
  }

  // 4. Step 4: Teacher's Sticky Notes (Ghi chú sư phạm đã ghim)
  if (notes && notes.length > 0) {
    notes.slice(0, 3).forEach((note) => {
      const isVertex = note.targetType === 'vertex';
      const cleanNoteContent = note.content.replace(/\s+/g, ' ');

      steps.push({
        id: `step-${stepOrder}`,
        order: stepOrder++,
        title: `4. Ghi chú sư phạm: ${note.targetLabel}`,
        speechText: `Thầy cô có một ghi chú quan trọng tại ${note.targetLabel}: ${cleanNoteContent}. Các em hãy ghi nhớ lưu ý này khi làm bài kiểm tra.`,
        captionText: `📌 [Ghi chú] ${note.targetLabel}: ${cleanNoteContent}`,
        targetType: isVertex ? 'vertex' : 'edge',
        targetId: note.targetId,
        targetLabel: note.targetLabel,
        noteId: note.id,
        cameraPreset: 'custom',
        durationSeconds: 7,
      });
    });
  }

  // 5. Step 5: Pedagogical hints & step-by-step reasoning
  if (pedagogical_hints && pedagogical_hints.length > 0) {
    const hint1 = pedagogical_hints[0].replace(/\s+/g, ' ');
    steps.push({
      id: `step-${stepOrder}`,
      order: stepOrder++,
      title: `5. Định hướng giải toán & Phương pháp tư duy`,
      speechText: `Về phương pháp chứng minh và tư duy giải bài: ${hint1}. Các em có thể xoay mô hình 3D hoặc dùng công cụ đo góc, khoảng cách để kiểm chứng lại kết quả.`,
      captionText: `💡 Định hướng: ${hint1}`,
      targetType: 'overview',
      cameraPreset: 'sgk',
      durationSeconds: 8,
    });
  } else {
    steps.push({
      id: `step-${stepOrder}`,
      order: stepOrder++,
      title: `5. Kết luận & Ôn tập phương pháp`,
      speechText: `Như vậy chúng ta đã khảo sát xong cấu trúc của khối hình. Các em hãy tự tương tác xoay mô hình, đo góc và khoảng cách để nắm vững kiến thức.`,
      captionText: `Thực hành tương tác: Xoay mô hình, đo đạc góc & khoảng cách 3D`,
      targetType: 'overview',
      cameraPreset: 'sgk',
      durationSeconds: 6,
    });
  }

  return {
    id: `script-${data.problem_analysis.shape_type.replace(/\s+/g, '_')}`,
    title: `Kịch bản bài giảng: ${shape_type}`,
    shapeType: shape_type,
    createdAt: new Date().toISOString(),
    autoGenerated: true,
    steps,
  };
}

const LOCAL_STORAGE_KEY_PREFIX = 'geo3d_voice_tour_';

export function saveVoiceTourScript(script: VoiceTourScript): void {
  try {
    localStorage.setItem(`${LOCAL_STORAGE_KEY_PREFIX}${script.shapeType}`, JSON.stringify(script));
  } catch (e) {
    console.error('Failed to save voice tour script to localStorage:', e);
  }
}

export function loadVoiceTourScript(shapeType: string): VoiceTourScript | null {
  try {
    const raw = localStorage.getItem(`${LOCAL_STORAGE_KEY_PREFIX}${shapeType}`);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load voice tour script from localStorage:', e);
  }
  return null;
}
