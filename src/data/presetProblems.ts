import { SolidGeometryOutput } from '../types/geometry';

export interface PresetProblem {
  id: string;
  title: string;
  category: string;
  description: string;
  data: SolidGeometryOutput;
}

export const PRESET_PROBLEMS: PresetProblem[] = [
  {
    id: 'chop-tam-giac-sa-vuong-day',
    title: 'Chóp S.ABC: SA ⊥ (ABC), đáy vuông tại B',
    category: 'Hình chóp tam giác',
    description: 'Cho hình chóp S.ABC có đáy ABC là tam giác vuông tại B, SA vuông góc với mặt phẳng đáy (ABC).',
    data: {
      problem_analysis: {
        problem_statement: 'Cho hình chóp S.ABC có đáy ABC là tam giác vuông tại B, SA vuông góc với đáy (ABC). Gọi AH là đường cao của tam giác SAB.',
        shape_type: 'Chóp tam giác (Cạnh bên vuông góc đáy)',
        hypothesis: [
          'Đáy ABC vuông tại B (AB ⊥ BC)',
          'SA ⊥ (ABC)',
          'AH ⊥ SB tại H'
        ],
        target: 'Chứng minh BC ⊥ (SAB) và tính góc giữa SC và (ABC), khoảng cách từ A đến (SBC)'
      },
      geometry_3d: {
        vertices: [
          { id: 'A', label: 'A', coord: [-2.0, -1.5, 0.0] },
          { id: 'B', label: 'B', coord: [1.8, -1.5, 0.0] },
          { id: 'C', label: 'C', coord: [0.5, 1.8, 0.0] },
          { id: 'S', label: 'S', coord: [-2.0, -1.5, 3.8] },
          { id: 'H', label: 'H', coord: [-0.3, -1.5, 2.1], isAltitudeFoot: true }
        ],
        edges: [
          { start: 'A', end: 'B', isDashed: false, color: '#0284c7', width: 2.2 },
          { start: 'B', end: 'C', isDashed: false, color: '#0284c7', width: 2.2 },
          { start: 'A', end: 'C', isDashed: true, color: '#64748b', width: 2 },
          { start: 'S', end: 'A', isDashed: false, color: '#dc2626', width: 2.8, isAltitude: true, label: 'SA ⊥ đáy' },
          { start: 'S', end: 'B', isDashed: false, color: '#3b82f6', width: 2.2 },
          { start: 'S', end: 'C', isDashed: false, color: '#3b82f6', width: 2.2 },
          { start: 'A', end: 'H', isDashed: true, color: '#10b981', width: 2, label: 'AH ⊥ SB' }
        ],
        faces: [
          {
            vertices: ['A', 'B', 'C'],
            name: 'Mặt đáy (ABC)',
            color: '#38bdf8',
            opacity: 0.22
          },
          {
            vertices: ['S', 'B', 'C'],
            name: 'Mặt bên (SBC)',
            color: '#818cf8',
            opacity: 0.18
          },
          {
            vertices: ['A', 'H', 'C'],
            name: 'Mặt phẳng phụ (AHC)',
            color: '#34d399',
            opacity: 0.28
          }
        ],
        right_angles: [
          { vertex: 'A', arm1: 'B', arm2: 'S', size: 0.35, color: '#dc2626' },
          { vertex: 'A', arm1: 'C', arm2: 'S', size: 0.35, color: '#dc2626' },
          { vertex: 'B', arm1: 'A', arm2: 'C', size: 0.32, color: '#0284c7' },
          { vertex: 'B', arm1: 'S', arm2: 'C', size: 0.32, color: '#6366f1' },
          { vertex: 'H', arm1: 'A', arm2: 'S', size: 0.28, color: '#10b981' }
        ],
        camera_preset: {
          initial_position: [6.5, -6.5, 5.5],
          look_at: [0.0, 0.0, 1.2]
        }
      },
      pedagogical_hints: [
        'Do SA ⊥ (ABC) nên SA ⊥ BC. Mà BC ⊥ AB (gt) ⇒ BC ⊥ (SAB) ⇒ BC ⊥ SB (tam giác SBC vuông tại B).',
        'Hình chiếu vuông góc của SC lên (ABC) là AC. Do đó góc giữa SC và (ABC) chính là góc SCA.',
        'Vì BC ⊥ (SAB) nên (SBC) ⊥ (SAB). Kẻ AH ⊥ SB tại H thì AH ⊥ (SBC), suy ra d(A, (SBC)) = AH.'
      ]
    }
  },
  {
    id: 'chop-tu-giac-deu-s-abcd',
    title: 'Chóp tứ giác đều S.ABCD, SO ⊥ (ABCD)',
    category: 'Hình chóp đều',
    description: 'Chóp tứ giác đều S.ABCD có đáy là hình vuông ABCD tâm O, chiều cao SO vuông góc với đáy.',
    data: {
      problem_analysis: {
        problem_statement: 'Cho hình chóp tứ giác đều S.ABCD có đáy ABCD là hình vuông tâm O cạnh a, SO = a√2. Gọi M là trung điểm của CD.',
        shape_type: 'Chóp tứ giác đều',
        hypothesis: [
          'Đáy ABCD là hình vuông cạnh a',
          'Tâm đáy O là giao điểm AC và BD',
          'SO ⊥ (ABCD)',
          'M là trung điểm CD'
        ],
        target: 'Xác định góc giữa mặt bên (SCD) và đáy (ABCD), tính khoảng cách từ O đến (SCD)'
      },
      geometry_3d: {
        vertices: [
          { id: 'A', label: 'A', coord: [-2.0, -1.8, 0.0] },
          { id: 'B', label: 'B', coord: [1.8, -1.8, 0.0] },
          { id: 'C', label: 'C', coord: [2.0, 1.8, 0.0] },
          { id: 'D', label: 'D', coord: [-1.8, 1.8, 0.0] },
          { id: 'O', label: 'O', coord: [0.0, 0.0, 0.0], isAltitudeFoot: true },
          { id: 'S', label: 'S', coord: [0.0, 0.0, 3.8] },
          { id: 'M', label: 'M', coord: [0.1, 1.8, 0.0] },
          { id: 'K', label: 'K', coord: [0.06, 1.0, 1.7] }
        ],
        edges: [
          { start: 'A', end: 'B', isDashed: false, color: '#0284c7', width: 2.2 },
          { start: 'B', end: 'C', isDashed: false, color: '#0284c7', width: 2.2 },
          { start: 'C', end: 'D', isDashed: true, color: '#64748b', width: 2 },
          { start: 'D', end: 'A', isDashed: true, color: '#64748b', width: 2 },
          { start: 'A', end: 'C', isDashed: true, color: '#94a3b8', width: 1.5 },
          { start: 'B', end: 'D', isDashed: true, color: '#94a3b8', width: 1.5 },
          { start: 'S', end: 'O', isDashed: true, color: '#dc2626', width: 2.6, isAltitude: true, label: 'SO ⊥ đáy' },
          { start: 'S', end: 'A', isDashed: false, color: '#3b82f6', width: 2.2 },
          { start: 'S', end: 'B', isDashed: false, color: '#3b82f6', width: 2.2 },
          { start: 'S', end: 'C', isDashed: false, color: '#3b82f6', width: 2.2 },
          { start: 'S', end: 'D', isDashed: true, color: '#64748b', width: 2 },
          { start: 'O', end: 'M', isDashed: true, color: '#10b981', width: 2 },
          { start: 'S', end: 'M', isDashed: true, color: '#10b981', width: 2 },
          { start: 'O', end: 'K', isDashed: true, color: '#f59e0b', width: 2, label: 'OK ⊥ SM' }
        ],
        faces: [
          {
            vertices: ['A', 'B', 'C', 'D'],
            name: 'Mặt đáy hình vuông (ABCD)',
            color: '#38bdf8',
            opacity: 0.22
          },
          {
            vertices: ['S', 'O', 'M'],
            name: 'Mặt phẳng trục phụ (SOM)',
            color: '#34d399',
            opacity: 0.32
          },
          {
            vertices: ['S', 'C', 'D'],
            name: 'Mặt bên (SCD)',
            color: '#a78bfa',
            opacity: 0.2
          }
        ],
        right_angles: [
          { vertex: 'O', arm1: 'A', arm2: 'S', size: 0.32, color: '#dc2626' },
          { vertex: 'O', arm1: 'M', arm2: 'S', size: 0.32, color: '#dc2626' },
          { vertex: 'M', arm1: 'O', arm2: 'C', size: 0.3, color: '#10b981' },
          { vertex: 'M', arm1: 'S', arm2: 'D', size: 0.3, color: '#10b981' },
          { vertex: 'K', arm1: 'O', arm2: 'S', size: 0.26, color: '#f59e0b' }
        ],
        camera_preset: {
          initial_position: [6.8, -6.8, 5.0],
          look_at: [0.0, 0.0, 1.2]
        }
      },
      pedagogical_hints: [
        'Vì S.ABCD là chóp đều nên SO ⊥ (ABCD). M là trung điểm CD thì OM ⊥ CD và SM ⊥ CD.',
        'Góc giữa (SCD) và (ABCD) chính là góc phẳng nhị diện [S, CD, O] = góc SMO trong tam giác vuông SOM.',
        'Do CD ⊥ (SOM) nên (SCD) ⊥ (SOM). Kẻ OK ⊥ SM thì OK ⊥ (SCD), suy ra d(O, (SCD)) = OK.'
      ]
    }
  },
  {
    id: 'hinh-lap-phuong-cat-mat-phang',
    title: 'Hình lập phương ABCD.A\'B\'C\'D\' và mặt phẳng (AB\'D\')',
    category: 'Khối đa diện đều',
    description: 'Hình lập phương ABCD.A\'B\'C\'D\', khảo sát mặt phẳng qua 3 đỉnh (AB\'D\') và đường chéo BD\'.',
    data: {
      problem_analysis: {
        problem_statement: 'Cho hình lập phương ABCD.A\'B\'C\'D\' có cạnh bằng a. Khảo sát vị trí tương đối giữa đường chéo BD\' và mặt phẳng (AB\'D\').',
        shape_type: 'Hình lập phương',
        hypothesis: [
          'ABCD.A\'B\'C\'D\' là hình lập phương',
          'Tất cả các cạnh bằng nhau và vuông góc từng đôi một',
          'Mặt phẳng (AB\'D\') nối 3 đỉnh A, B\', D\''
        ],
        target: 'Chứng minh BD\' ⊥ (AB\'D\') và tính khoảng cách giữa hai đường thẳng chéo nhau AB\' và B\'D\''
      },
      geometry_3d: {
        vertices: [
          { id: 'A', label: 'A', coord: [-1.8, -1.8, 0.0] },
          { id: 'B', label: 'B', coord: [1.8, -1.8, 0.0] },
          { id: 'C', label: 'C', coord: [1.8, 1.8, 0.0] },
          { id: 'D', label: 'D', coord: [-1.8, 1.8, 0.0] },
          { id: "A'", label: "A'", coord: [-1.8, -1.8, 3.6] },
          { id: "B'", label: "B'", coord: [1.8, -1.8, 3.6] },
          { id: "C'", label: "C'", coord: [1.8, 1.8, 3.6] },
          { id: "D'", label: "D'", coord: [-1.8, 1.8, 3.6] }
        ],
        edges: [
          // Đáy dưới
          { start: 'A', end: 'B', isDashed: false, color: '#334155', width: 2 },
          { start: 'B', end: 'C', isDashed: false, color: '#334155', width: 2 },
          { start: 'C', end: 'D', isDashed: true, color: '#64748b', width: 2 },
          { start: 'D', end: 'A', isDashed: true, color: '#64748b', width: 2 },
          // Cạnh đứng
          { start: 'A', end: "A'", isDashed: false, color: '#334155', width: 2 },
          { start: 'B', end: "B'", isDashed: false, color: '#334155', width: 2 },
          { start: 'C', end: "C'", isDashed: false, color: '#334155', width: 2 },
          { start: 'D', end: "D'", isDashed: true, color: '#64748b', width: 2 },
          // Đáy trên
          { start: "A'", end: "B'", isDashed: false, color: '#334155', width: 2 },
          { start: "B'", end: "C'", isDashed: false, color: '#334155', width: 2 },
          { start: "C'", end: "D'", isDashed: false, color: '#334155', width: 2 },
          { start: "D'", end: "A'", isDashed: false, color: '#334155', width: 2 },
          // Mặt phẳng (AB'D')
          { start: 'A', end: "B'", isDashed: false, color: '#ec4899', width: 2.6 },
          { start: "B'", end: "D'", isDashed: false, color: '#ec4899', width: 2.6 },
          { start: 'A', end: "D'", isDashed: true, color: '#ec4899', width: 2.6 },
          // Đường chéo BD'
          { start: 'B', end: "D'", isDashed: true, color: '#eab308', width: 2.5, label: "BD'" }
        ],
        faces: [
          {
            vertices: ['A', "B'", "D'"],
            name: "Mặt phẳng chéo (AB'D')",
            color: '#f43f5e',
            opacity: 0.35
          },
          {
            vertices: ['A', 'B', 'C', 'D'],
            name: 'Đáy dưới (ABCD)',
            color: '#60a5fa',
            opacity: 0.15
          },
          {
            vertices: ["A'", "B'", "C'", "D'"],
            name: "Đáy trên (A'B'C'D')",
            color: '#60a5fa',
            opacity: 0.15
          }
        ],
        right_angles: [
          { vertex: 'A', arm1: 'B', arm2: "A'", size: 0.32, color: '#dc2626' },
          { vertex: 'B', arm1: 'C', arm2: "B'", size: 0.32, color: '#dc2626' }
        ],
        camera_preset: {
          initial_position: [6.2, -6.5, 4.8],
          look_at: [0.0, 0.0, 1.8]
        }
      },
      pedagogical_hints: [
        "Đường chéo BD' vuông góc với cả AB', B'D' và AD', suy ra BD' ⊥ (AB'D').",
        "Tam giác AB'D' là tam giác đều có cạnh bằng a√2 (là đường chéo của 3 mặt hình vuông).",
        "Giao điểm của BD' với (AB'D') là trọng tâm của tam giác đều AB'D', đồng thời chia đoạn BD' theo tỉ lệ 1:2."
      ]
    }
  },
  {
    id: 'lang-tru-tam-giac-dung',
    title: 'Lăng trụ đứng tam giác ABC.A\'B\'C\'',
    category: 'Hình lăng trụ',
    description: 'Lăng trụ tam giác đứng có đáy ABC là tam giác vuông tại A, AC = a, BC = 2a, AA\' = a√3.',
    data: {
      problem_analysis: {
        problem_statement: 'Cho lăng trụ đứng ABC.A\'B\'C\' có đáy ABC vuông tại A, AC = a, BC = 2a, AA\' = a√3. Tính khoảng cách giữa hai đường thẳng B\'C và AA\'.',
        shape_type: 'Lăng trụ tam giác đứng',
        hypothesis: [
          'Lăng trụ đứng: các cạnh bên AA\', BB\', CC\' cùng vuông góc với hai đáy',
          'Đáy ABC vuông tại A (AB ⊥ AC)',
          'AC = a, BC = 2a, AA\' = a√3'
        ],
        target: 'Tính khoảng cách giữa hai đường thẳng chéo nhau B\'C và AA\''
      },
      geometry_3d: {
        vertices: [
          { id: 'A', label: 'A', coord: [-1.8, -1.2, 0.0] },
          { id: 'B', label: 'B', coord: [1.8, -1.2, 0.0] },
          { id: 'C', label: 'C', coord: [-1.8, 1.6, 0.0] },
          { id: "A'", label: "A'", coord: [-1.8, -1.2, 3.6] },
          { id: "B'", label: "B'", coord: [1.8, -1.2, 3.6] },
          { id: "C'", label: "C'", coord: [-1.8, 1.6, 3.6] }
        ],
        edges: [
          { start: 'A', end: 'B', isDashed: false, color: '#334155', width: 2 },
          { start: 'B', end: 'C', isDashed: false, color: '#334155', width: 2 },
          { start: 'C', end: 'A', isDashed: true, color: '#64748b', width: 2 },
          { start: 'A', end: "A'", isDashed: true, color: '#dc2626', width: 2.2, isAltitude: true },
          { start: 'B', end: "B'", isDashed: false, color: '#0284c7', width: 2 },
          { start: 'C', end: "C'", isDashed: false, color: '#0284c7', width: 2 },
          { start: "A'", end: "B'", isDashed: false, color: '#334155', width: 2 },
          { start: "B'", end: "C'", isDashed: false, color: '#334155', width: 2 },
          { start: "C'", end: "A'", isDashed: false, color: '#334155', width: 2 },
          { start: "B'", end: 'C', isDashed: false, color: '#8b5cf6', width: 2.5, label: "B'C" }
        ],
        faces: [
          {
            vertices: ['A', 'B', 'C'],
            name: 'Đáy dưới (ABC)',
            color: '#38bdf8',
            opacity: 0.22
          },
          {
            vertices: ["A'", "B'", "C'"],
            name: "Đáy trên (A'B'C')",
            color: '#38bdf8',
            opacity: 0.22
          },
          {
            vertices: ['B', 'C', "C'", "B'"],
            name: "Mặt bên (BCC'B')",
            color: '#c084fc',
            opacity: 0.18
          }
        ],
        right_angles: [
          { vertex: 'A', arm1: 'B', arm2: 'C', size: 0.32, color: '#0284c7' },
          { vertex: 'A', arm1: 'B', arm2: "A'", size: 0.32, color: '#dc2626' },
          { vertex: 'A', arm1: 'C', arm2: "A'", size: 0.32, color: '#dc2626' }
        ],
        camera_preset: {
          initial_position: [6.5, -6.0, 5.0],
          look_at: [0.0, 0.0, 1.8]
        }
      },
      pedagogical_hints: [
        "Do AA' // BB' nên AA' // (BCC'B'). Đoạn B'C nằm trong (BCC'B').",
        "Khoảng cách d(AA', B'C) = d(AA', (BCC'B')) = d(A, (BCC'B')).",
        "Vì đáy ABC vuông tại A, kẻ AH ⊥ BC tại H. Do AA' ⊥ (ABC) nên AH ⊥ (BCC'B'). Vậy d = AH."
      ]
    }
  },
  {
    id: 'chop-day-hinh-thang-vuong',
    title: 'Chóp S.ABCD: Đáy hình thang vuông tại A và B',
    category: 'Hình chóp tứ giác',
    description: 'Chóp S.ABCD đáy hình thang vuông tại A và B, AD = 2a, AB = BC = a, SA vuông góc mặt phẳng đáy.',
    data: {
      problem_analysis: {
        problem_statement: 'Cho hình chóp S.ABCD có đáy ABCD là hình thang vuông tại A và B, AB = BC = a, AD = 2a. Cạnh bên SA ⊥ (ABCD) và SA = a√2.',
        shape_type: 'Chóp có đáy hình thang vuông',
        hypothesis: [
          'Đáy ABCD vuông tại A và B',
          'AB = BC = a, AD = 2a (AD // BC)',
          'SA ⊥ (ABCD)',
          'SA = a√2'
        ],
        target: 'Chứng minh AC ⊥ CD, tính góc giữa đường thẳng SD và mặt phẳng (SAC)'
      },
      geometry_3d: {
        vertices: [
          { id: 'A', label: 'A', coord: [-2.0, -1.6, 0.0] },
          { id: 'B', label: 'B', coord: [0.5, -1.6, 0.0] },
          { id: 'C', label: 'C', coord: [0.5, 0.8, 0.0] },
          { id: 'D', label: 'D', coord: [-2.0, 3.2, 0.0] },
          { id: 'S', label: 'S', coord: [-2.0, -1.6, 3.6] }
        ],
        edges: [
          { start: 'A', end: 'B', isDashed: false, color: '#0284c7', width: 2.2 },
          { start: 'B', end: 'C', isDashed: false, color: '#0284c7', width: 2.2 },
          { start: 'C', end: 'D', isDashed: true, color: '#64748b', width: 2 },
          { start: 'D', end: 'A', isDashed: true, color: '#64748b', width: 2 },
          { start: 'A', end: 'C', isDashed: true, color: '#0d9488', width: 2, label: 'AC' },
          { start: 'S', end: 'A', isDashed: true, color: '#dc2626', width: 2.8, isAltitude: true, label: 'SA ⊥ đáy' },
          { start: 'S', end: 'B', isDashed: false, color: '#3b82f6', width: 2.2 },
          { start: 'S', end: 'C', isDashed: false, color: '#3b82f6', width: 2.2 },
          { start: 'S', end: 'D', isDashed: false, color: '#3b82f6', width: 2.2 }
        ],
        faces: [
          {
            vertices: ['A', 'B', 'C', 'D'],
            name: 'Đáy hình thang vuông (ABCD)',
            color: '#38bdf8',
            opacity: 0.22
          },
          {
            vertices: ['S', 'A', 'C'],
            name: 'Mặt phẳng chéo (SAC)',
            color: '#14b8a6',
            opacity: 0.3
          }
        ],
        right_angles: [
          { vertex: 'A', arm1: 'B', arm2: 'D', size: 0.35, color: '#0284c7' },
          { vertex: 'B', arm1: 'A', arm2: 'C', size: 0.35, color: '#0284c7' },
          { vertex: 'C', arm1: 'A', arm2: 'D', size: 0.35, color: '#0d9488' },
          { vertex: 'A', arm1: 'B', arm2: 'S', size: 0.35, color: '#dc2626' },
          { vertex: 'A', arm1: 'D', arm2: 'S', size: 0.35, color: '#dc2626' }
        ],
        camera_preset: {
          initial_position: [6.8, -6.8, 5.2],
          look_at: [-0.5, 0.4, 1.2]
        }
      },
      pedagogical_hints: [
        'Ta có AC = a√2, CD² = (AD - BC)² + AB² = a² + a² = 2a² ⇒ CD = a√2. AD² = 4a² = AC² + CD² ⇒ tam giác ACD vuông cân tại C (AC ⊥ CD).',
        'Vì CD ⊥ AC và CD ⊥ SA (do SA ⊥ đáy) ⇒ CD ⊥ (SAC).',
        'Hình chiếu vuông góc của SD lên (SAC) là SC. Vậy góc giữa SD và (SAC) chính là góc DSC.'
      ]
    }
  }
];
