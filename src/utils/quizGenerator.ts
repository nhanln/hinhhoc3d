import { SolidGeometryOutput } from '../types/geometry';
import { ModelQuizSet, QuizQuestion, QuizAttemptResult } from '../types/quiz';

/**
 * Generates context-aware, mathematically sound quiz questions based on the active 3D solid geometry
 */
export function generateSmartQuizForModel(data: SolidGeometryOutput): ModelQuizSet {
  const shapeType = data.problem_analysis?.shape_type || 'Hình học không gian';
  const vertices = data.geometry_3d.vertices || [];
  const edges = data.geometry_3d.edges || [];
  const rightAngles = data.geometry_3d.right_angles || [];

  // Identify apex (highest vertex or altitude vertex)
  const sortedByZ = [...vertices].sort((a, b) => b.coord[2] - a.coord[2]);
  const apex = sortedByZ.find((v) => v.coord[2] > 0) || vertices[0];
  const baseVertices = vertices.filter((v) => v.coord[2] === 0);
  const altitudeFoot = vertices.find((v) => v.isAltitudeFoot) ||
    baseVertices.find((v) => apex && v.coord[0] === apex.coord[0] && v.coord[1] === apex.coord[1]) ||
    baseVertices[0];

  const questions: QuizQuestion[] = [];

  // 1. Question on Height / Altitude
  if (apex && altitudeFoot && apex.id !== altitudeFoot.id) {
    const wrongFoot1 = baseVertices.find((v) => v.id !== altitudeFoot.id)?.label || 'B';
    const wrongFoot2 = baseVertices.filter((v) => v.id !== altitudeFoot.id)[1]?.label || 'C';
    questions.push({
      id: 'q-height-1',
      question: `Trong mô hình 3D hiện tại, đoạn thẳng nào sau đây đóng vai trò là đường cao (hoặc chiều cao) của hình khối?`,
      options: [
        {
          id: 'A',
          text: `Đoạn thẳng ${apex.label}${altitudeFoot.label}`,
          isCorrect: true,
        },
        {
          id: 'B',
          text: `Đoạn thẳng ${apex.label}${wrongFoot1}`,
          isCorrect: false,
        },
        {
          id: 'C',
          text: `Đoạn thẳng ${wrongFoot1}${wrongFoot2}`,
          isCorrect: false,
        },
        {
          id: 'D',
          text: `Đoạn thẳng ${apex.label}${wrongFoot2}`,
          isCorrect: false,
        },
      ],
      explanation: `Đoạn thẳng ${apex.label}${altitudeFoot.label} vuông góc với mặt phẳng đáy tại chân đường cao ${altitudeFoot.label}, do đó ${apex.label}${altitudeFoot.label} chính là đường cao của hình khối.`,
      hint: `Quan sát điểm chân đường cao có ký hiệu góc vuông và hình chiếu thẳng đứng của đỉnh ${apex.label}.`,
      targetRef: {
        type: 'edge',
        id: `${apex.id}-${altitudeFoot.id}`,
        label: `Cạnh ${apex.label}${altitudeFoot.label}`,
      },
      difficulty: 'Nhận biết',
    });
  }

  // 2. Question on Angle between Edge and Base Plane
  if (apex && altitudeFoot && baseVertices.length >= 2) {
    const otherBase = baseVertices.find((v) => v.id !== altitudeFoot.id) || baseVertices[1];
    if (otherBase) {
      const correctAngle = `Góc ∠${apex.label}${otherBase.label}${altitudeFoot.label}`;
      const wrongAngle1 = `Góc ∠${otherBase.label}${apex.label}${altitudeFoot.label}`;
      const wrongAngle2 = `Góc ∠${apex.label}${altitudeFoot.label}${otherBase.label}`;
      const wrongAngle3 = `Góc ∠${otherBase.label}${altitudeFoot.label}${apex.label}`;

      questions.push({
        id: 'q-angle-1',
        question: `Góc giữa cạnh bên ${apex.label}${otherBase.label} và mặt phẳng đáy (${baseVertices.map((v) => v.label).join('')}) là góc nào?`,
        options: [
          {
            id: 'A',
            text: correctAngle,
            isCorrect: true,
          },
          {
            id: 'B',
            text: wrongAngle1,
            isCorrect: false,
          },
          {
            id: 'C',
            text: wrongAngle2,
            isCorrect: false,
          },
          {
            id: 'D',
            text: wrongAngle3,
            isCorrect: false,
          },
        ],
        explanation: `Vì ${altitudeFoot.label} là hình chiếu vuông góc của ${apex.label} lên mặt phẳng đáy, nên hình chiếu của cạnh bên ${apex.label}${otherBase.label} lên đáy là đoạn ${altitudeFoot.label}${otherBase.label}. Do đó, góc giữa cạnh bên và đáy là góc ∠${apex.label}${otherBase.label}${altitudeFoot.label}.`,
        hint: `Tìm hình chiếu vuông góc của từng đầu mút đoạn thẳng lên mặt phẳng đáy.`,
        targetRef: {
          type: 'edge',
          id: `${apex.id}-${otherBase.id}`,
          label: `Cạnh bên ${apex.label}${otherBase.label}`,
        },
        difficulty: 'Thông hiểu',
      });
    }
  }

  // 3. Question on Right Angles or Perpendicular lines
  if (rightAngles.length > 0) {
    const ra = rightAngles[0];
    questions.push({
      id: 'q-perp-1',
      question: `Dựa vào mô hình 3D, tại đỉnh ${ra.vertex} có quan hệ vuông góc nào sau đây được xác lập?`,
      options: [
        {
          id: 'A',
          text: `Đoạn thẳng ${ra.arm1} vuông góc với đoạn thẳng ${ra.arm2} (${ra.arm1} ⊥ ${ra.arm2})`,
          isCorrect: true,
        },
        {
          id: 'B',
          text: `Đoạn thẳng ${ra.arm1} song song với đoạn thẳng ${ra.arm2}`,
          isCorrect: false,
        },
        {
          id: 'C',
          text: `Góc tạo bởi ${ra.arm1} và ${ra.arm2} bằng 60°`,
          isCorrect: false,
        },
        {
          id: 'D',
          text: `Đoạn thẳng ${ra.arm1} chéo nhau với đoạn thẳng ${ra.arm2}`,
          isCorrect: false,
        },
      ],
      explanation: `Mô hình 3D có ký hiệu góc vuông tại đỉnh ${ra.vertex} giữa hai cạnh ${ra.arm1} và ${ra.arm2}, thể hiện giả thiết ${ra.arm1} ⊥ ${ra.arm2}.`,
      hint: `Quan sát biểu tượng góc vuông màu hổ phách/xanh tại đỉnh ${ra.vertex}.`,
      targetRef: {
        type: 'vertex',
        id: ra.vertex,
        label: `Đỉnh ${ra.vertex}`,
      },
      difficulty: 'Nhận biết',
    });
  }

  // 4. Question on Shape Type and Volume Formula
  const isPyramid = shapeType.toLowerCase().includes('chóp');
  const isPrism = shapeType.toLowerCase().includes('lăng trụ') || shapeType.toLowerCase().includes('hộp');

  questions.push({
    id: 'q-volume-1',
    question: `Công thức tính thể tích $V$ của hình khối "${shapeType}" với diện tích đáy $B$ và chiều cao $h$ là gì?`,
    options: isPyramid
      ? [
          {
            id: 'A',
            text: 'V = (1/3) × B × h',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'V = B × h',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'V = (1/2) × B × h',
            isCorrect: false,
          },
          {
            id: 'D',
            text: 'V = (4/3) × B × h',
            isCorrect: false,
          },
        ]
      : [
          {
            id: 'A',
            text: 'V = B × h',
            isCorrect: true,
          },
          {
            id: 'B',
            text: 'V = (1/3) × B × h',
            isCorrect: false,
          },
          {
            id: 'C',
            text: 'V = (1/2) × B × h',
            isCorrect: false,
          },
          {
            id: 'D',
            text: 'V = 2 × B × h',
            isCorrect: false,
          },
        ],
    explanation: isPyramid
      ? `Thể tích của hình chóp bất kỳ luôn được tính theo công thức V = (1/3) × B × h (bằng một phần ba tích diện tích đáy nhân với chiều cao).`
      : `Thể tích của hình lăng trụ / hình hộp luôn được tính theo công thức V = B × h (tích diện tích đáy nhân với chiều cao).`,
    hint: `Chú ý hình khối có đỉnh chóp nhọn hay hai đáy song song bằng nhau.`,
    difficulty: 'Thông hiểu',
  });

  // 5. Question on Base polygon properties
  if (baseVertices.length >= 3) {
    const baseLabels = baseVertices.map((v) => v.label).join('');
    questions.push({
      id: 'q-base-1',
      question: `Mặt phẳng đáy của hình khối hiện tại gồm tập hợp các đỉnh nào nằm trên mặt phẳng $Oxy$?`,
      options: [
        {
          id: 'A',
          text: `Đa giác đáy (${baseLabels})`,
          isCorrect: true,
        },
        {
          id: 'B',
          text: `Mặt bên (${apex ? apex.label : 'S'}${baseVertices[0]?.label || 'A'}${baseVertices[1]?.label || 'B'})`,
          isCorrect: false,
        },
        {
          id: 'C',
          text: `Đoạn thẳng nối đỉnh với chân đường cao`,
          isCorrect: false,
        },
        {
          id: 'D',
          text: `Mặt phẳng đi qua các trung điểm của cạnh bên`,
          isCorrect: false,
        },
      ],
      explanation: `Các đỉnh ${baseVertices.map((v) => v.label).join(', ')} đều có cao độ z = 0, cùng thuộc mặt phẳng chuẩn Oxy tạo thành đa giác đáy (${baseLabels}).`,
      hint: `Quan sát các đỉnh nằm trên mặt phẳng lưới tọa độ Oxy.`,
      targetRef: {
        type: 'face',
        id: 'base',
        label: `Mặt đáy (${baseLabels})`,
      },
      difficulty: 'Nhận biết',
    });
  }

  return {
    shapeType,
    title: `Quiz Kiểm Tra Nhanh: ${shapeType}`,
    description: `Bộ câu hỏi trắc nghiệm kiểm tra kiến thức về đường cao, góc và quan hệ vuông góc của mô hình ${shapeType}.`,
    questions,
    updatedAt: new Date().toISOString(),
    isCustom: false,
  };
}

const STORAGE_KEY_PREFIX = 'geo3d_quiz_';
const ATTEMPT_STORAGE_KEY = 'geo3d_quiz_attempts';

/**
 * Load saved quiz for a specific shape type, or generate a fresh one
 */
export function getQuizForModel(data: SolidGeometryOutput): ModelQuizSet {
  const shapeType = data.problem_analysis?.shape_type || 'default';
  try {
    const saved = localStorage.getItem(`${STORAGE_KEY_PREFIX}${shapeType}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.questions) && parsed.questions.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading quiz from localStorage', e);
  }
  return generateSmartQuizForModel(data);
}

/**
 * Save custom quiz for a specific shape type
 */
export function saveQuizForModel(quizSet: ModelQuizSet): void {
  try {
    localStorage.setItem(
      `${STORAGE_KEY_PREFIX}${quizSet.shapeType}`,
      JSON.stringify({ ...quizSet, updatedAt: new Date().toISOString(), isCustom: true })
    );
  } catch (e) {
    console.error('Error saving quiz to localStorage', e);
  }
}

/**
 * Reset quiz to smart auto-generated default
 */
export function resetQuizForModel(data: SolidGeometryOutput): ModelQuizSet {
  const fresh = generateSmartQuizForModel(data);
  const shapeType = data.problem_analysis?.shape_type || 'default';
  try {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${shapeType}`);
  } catch (e) {
    console.warn('Error removing custom quiz', e);
  }
  return fresh;
}

/**
 * Record a quiz attempt in history
 */
export function recordQuizAttempt(result: QuizAttemptResult): void {
  try {
    const existing = localStorage.getItem(ATTEMPT_STORAGE_KEY);
    const history: QuizAttemptResult[] = existing ? JSON.parse(existing) : [];
    history.unshift(result);
    // Keep last 30 attempts
    localStorage.setItem(ATTEMPT_STORAGE_KEY, JSON.stringify(history.slice(0, 30)));
  } catch (e) {
    console.warn('Error saving quiz attempt', e);
  }
}
