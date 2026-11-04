export type ShapeCategory =
  | 'chop'
  | 'lang-tru'
  | 'tru'
  | 'non'
  | 'cau'
  | 'lap-phuong'
  | 'hop-chu-nhat'
  | 'tu-dien';

export interface FormulaVariable {
  symbol: string;
  label: string;
  meaning: string;
}

export interface GeometryFormulaItem {
  id: string;
  name: string;
  symbol: string;
  formulaDisplay: string;
  description: string;
  categories: ('volume' | 'surface' | 'pythagoras' | 'distance-angle')[];
  shapeTags: ShapeCategory[];
  variables: FormulaVariable[];
  highlightForShapes: ShapeCategory[];
  calculation?: {
    inputs: { key: string; label: string; defaultValue: number; unit?: string }[];
    compute: (vals: Record<string, number>) => { resultText: string; stepsText: string };
  };
}

export const SHAPE_CATEGORY_META: Record<
  ShapeCategory,
  { label: string; icon: string; description: string }
> = {
  chop: {
    label: 'Hình Chóp',
    icon: '🔺',
    description: 'Chóp tam giác, tứ giác, chóp đều và chóp có cạnh bên vuông góc đáy',
  },
  'lang-tru': {
    label: 'Hình Lăng Trụ',
    icon: '🏛️',
    description: 'Lăng trụ đứng, lăng trụ tam giác, lăng trụ tứ giác, hình hộp',
  },
  tru: {
    label: 'Hình Trụ',
    icon: '🥫',
    description: 'Mặt trụ tròn xoay, khối trụ, trục và thiết diện qua trục',
  },
  non: {
    label: 'Hình Nón',
    icon: '🍦',
    description: 'Mặt nón tròn xoay, khối nón, đường sinh, bán kính đáy và góc ở đỉnh',
  },
  cau: {
    label: 'Hình Cầu',
    icon: '⚽',
    description: 'Mặt cầu, khối cầu, bán kính R, tâm O và thiết diện mặt phẳng',
  },
  'lap-phuong': {
    label: 'Hình Lập Phương',
    icon: '🎲',
    description: 'Khối 6 mặt vuông bằng nhau, đường chéo d = a√3',
  },
  'hop-chu-nhat': {
    label: 'Hình Hộp Chữ Nhật',
    icon: '📦',
    description: 'Khối 3 kích thước dài, rộng, cao (a, b, c)',
  },
  'tu-dien': {
    label: 'Tứ Diện',
    icon: '📐',
    description: 'Khối 4 mặt tam giác, tứ diện đều, tứ diện vuông có 3 cạnh đôi một vuông góc',
  },
};

export const GEOMETRY_FORMULAS: GeometryFormulaItem[] = [
  // ================= 1. HÌNH CHÓP & TỨ DIỆN =================
  {
    id: 'chop-volume',
    name: 'Thể tích khối chóp',
    symbol: 'V',
    formulaDisplay: 'V = (1/3) · B · h',
    description:
      'Thể tích khối chóp bằng một phần ba tích của diện tích mặt đáy với chiều cao thẳng đứng của hình chóp.',
    categories: ['volume'],
    shapeTags: ['chop', 'tu-dien'],
    highlightForShapes: ['chop', 'tu-dien'],
    variables: [
      { symbol: 'V', label: 'Thể tích', meaning: 'Thể tích khối chóp' },
      { symbol: 'B', label: 'Diện tích đáy (S_đáy)', meaning: 'Diện tích đa giác đáy' },
      { symbol: 'h', label: 'Chiều cao', meaning: 'Khoảng cách từ đỉnh chóp đến mặt đáy' },
    ],
    calculation: {
      inputs: [
        { key: 'B', label: 'Diện tích đáy (B)', defaultValue: 12, unit: 'đvdt' },
        { key: 'h', label: 'Chiều cao (h)', defaultValue: 6, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const res = (1 / 3) * vals.B * vals.h;
        return {
          resultText: `V = ${res.toFixed(2)}`,
          stepsText: `V = 1/3 × ${vals.B} × ${vals.h} = ${res.toFixed(2)} (đvtt)`,
        };
      },
    },
  },
  {
    id: 'chop-deu-surface',
    name: 'Diện tích xung quanh hình chóp đều',
    symbol: 'S_xq',
    formulaDisplay: 'S_xq = p · d',
    description:
      'Diện tích xung quanh của hình chóp đều bằng tích của nửa chu vi đáy với trung đoạn (đường cao của mặt bên xuất phát từ đỉnh).',
    categories: ['surface'],
    shapeTags: ['chop'],
    highlightForShapes: ['chop'],
    variables: [
      { symbol: 'p', label: 'Nửa chu vi đáy', meaning: 'p = Chu vi đáy / 2' },
      { symbol: 'd', label: 'Trung đoạn', meaning: 'Đường cao của tam giác mặt bên kẻ từ đỉnh' },
      { symbol: 'S_tp', label: 'Diện tích toàn phần', meaning: 'S_tp = S_xq + S_đáy' },
    ],
    calculation: {
      inputs: [
        { key: 'p', label: 'Nửa chu vi đáy (p)', defaultValue: 8, unit: 'đvđd' },
        { key: 'd', label: 'Trung đoạn (d)', defaultValue: 5, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const res = vals.p * vals.d;
        return {
          resultText: `S_xq = ${res.toFixed(2)}`,
          stepsText: `S_xq = p × d = ${vals.p} × ${vals.d} = ${res.toFixed(2)} (đvdt)`,
        };
      },
    },
  },
  {
    id: 'tu-dien-vuong-height',
    name: 'Hệ thức đường cao tứ diện vuông (O.ABC)',
    symbol: '1/h²',
    formulaDisplay: '1/OH² = 1/OA² + 1/OB² + 1/OC²',
    description:
      'Tứ diện O.ABC có 3 cạnh OA, OB, OC đôi một vuông góc tại O. Khi đó khoảng cách h = OH từ O đến mặt phẳng (ABC) thỏa mãn hệ thức nghịch đảo bình phương.',
    categories: ['pythagoras', 'distance-angle'],
    shapeTags: ['tu-dien', 'chop'],
    highlightForShapes: ['tu-dien', 'chop'],
    variables: [
      { symbol: 'OH', label: 'Đường cao h', meaning: 'Khoảng cách từ gốc vuông O đến mặt bên (ABC)' },
      { symbol: 'OA, OB, OC', label: '3 cạnh vuông góc', meaning: 'Độ dài 3 cạnh bên vuông góc tại O' },
    ],
    calculation: {
      inputs: [
        { key: 'a', label: 'Cạnh OA', defaultValue: 3, unit: 'đvđd' },
        { key: 'b', label: 'Cạnh OB', defaultValue: 4, unit: 'đvđd' },
        { key: 'c', label: 'Cạnh OC', defaultValue: 5, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const invSum = 1 / (vals.a * vals.a) + 1 / (vals.b * vals.b) + 1 / (vals.c * vals.c);
        const h = Math.sqrt(1 / invSum);
        return {
          resultText: `OH = ${h.toFixed(2)}`,
          stepsText: `1/h² = 1/${vals.a}² + 1/${vals.b}² + 1/${vals.c}² = ${invSum.toFixed(4)} ⇒ h ≈ ${h.toFixed(2)}`,
        };
      },
    },
  },

  // ================= 2. ĐỊNH LÝ PYTAGO KHÔNG GIAN =================
  {
    id: 'pythagoras-theorem',
    name: 'Định lý Pytago trong tam giác vuông',
    symbol: 'c²',
    formulaDisplay: 'c² = a² + b²  ⟺  c = √(a² + b²)',
    description:
      'Trong mọi tam giác vuông (như tam giác đáy, tam giác mặt bên chứa đường cao SA, SO), bình phương cạnh huyền bằng tổng bình phương hai cạnh góc vuông.',
    categories: ['pythagoras'],
    shapeTags: ['chop', 'lang-tru', 'tru', 'non', 'lap-phuong', 'hop-chu-nhat', 'tu-dien'],
    highlightForShapes: ['chop', 'lang-tru', 'non'],
    variables: [
      { symbol: 'a, b', label: 'Hai cạnh góc vuông', meaning: 'Độ dài 2 cạnh kề góc 90°' },
      { symbol: 'c', label: 'Cạnh huyền', meaning: 'Cạnh đối diện góc 90°' },
    ],
    calculation: {
      inputs: [
        { key: 'a', label: 'Cạnh góc vuông a', defaultValue: 3, unit: 'đvđd' },
        { key: 'b', label: 'Cạnh góc vuông b', defaultValue: 4, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const c = Math.sqrt(vals.a * vals.a + vals.b * vals.b);
        return {
          resultText: `c = ${c.toFixed(2)}`,
          stepsText: `c = √(${vals.a}² + ${vals.b}²) = √(${vals.a * vals.a + vals.b * vals.b}) = ${c.toFixed(2)}`,
        };
      },
    },
  },
  {
    id: 'pythagoras-altitude-right-triangle',
    name: 'Hệ thức đường cao tam giác vuông',
    symbol: '1/h²',
    formulaDisplay: '1/h² = 1/b² + 1/c²  &  h = (b · c) / a',
    description:
      'Đường cao h kẻ từ đỉnh góc vuông xuống cạnh huyền a. Đây là công thức trọng tâm để tính khoảng cách từ chân đường cao chóp đến các cạnh mặt bên.',
    categories: ['pythagoras', 'distance-angle'],
    shapeTags: ['chop', 'tu-dien', 'lang-tru'],
    highlightForShapes: ['chop', 'tu-dien'],
    variables: [
      { symbol: 'h', label: 'Đường cao kẻ từ góc vuông', meaning: 'Chiều cao hạ từ đỉnh góc vuông' },
      { symbol: 'b, c', label: '2 cạnh góc vuông', meaning: 'Độ dài hai cạnh góc vuông' },
      { symbol: 'a', label: 'Cạnh huyền', meaning: 'a = √(b² + c²)' },
    ],
    calculation: {
      inputs: [
        { key: 'b', label: 'Cạnh góc vuông b', defaultValue: 3, unit: 'đvđd' },
        { key: 'c', label: 'Cạnh góc vuông c', defaultValue: 4, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const a = Math.sqrt(vals.b * vals.b + vals.c * vals.c);
        const h = (vals.b * vals.c) / a;
        return {
          resultText: `h = ${h.toFixed(2)}`,
          stepsText: `a = √(${vals.b}² + ${vals.c}²) = ${a.toFixed(2)} ⇒ h = (${vals.b} × ${vals.c}) / ${a.toFixed(2)} = ${h.toFixed(2)}`,
        };
      },
    },
  },

  // ================= 3. HÌNH TRỤ =================
  {
    id: 'tru-volume',
    name: 'Thể tích khối trụ tròn xoay',
    symbol: 'V',
    formulaDisplay: 'V = B · h = π · r² · h',
    description:
      'Thể tích khối trụ bằng tích diện tích đáy (hình tròn bán kính r) với chiều cao h (hoặc đường sinh l) của hình trụ.',
    categories: ['volume'],
    shapeTags: ['tru'],
    highlightForShapes: ['tru'],
    variables: [
      { symbol: 'r', label: 'Bán kính đáy', meaning: 'Bán kính hình tròn đáy' },
      { symbol: 'h', label: 'Chiều cao', meaning: 'Khoảng cách giữa hai mặt đáy trụ (h = l)' },
      { symbol: 'B', label: 'Diện tích đáy', meaning: 'B = πr²' },
    ],
    calculation: {
      inputs: [
        { key: 'r', label: 'Bán kính đáy r', defaultValue: 3, unit: 'đvđd' },
        { key: 'h', label: 'Chiều cao h', defaultValue: 5, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const res = Math.PI * vals.r * vals.r * vals.h;
        return {
          resultText: `V ≈ ${res.toFixed(2)}`,
          stepsText: `V = π × ${vals.r}² × ${vals.h} = ${vals.r * vals.r * vals.h}π ≈ ${res.toFixed(2)} (đvtt)`,
        };
      },
    },
  },
  {
    id: 'tru-surface',
    name: 'Diện tích xung quanh & toàn phần hình trụ',
    symbol: 'S_xq, S_tp',
    formulaDisplay: 'S_xq = 2π·r·h  |  S_tp = 2π·r·h + 2π·r²',
    description:
      'Diện tích xung quanh của hình trụ bằng chu vi đáy nhân với chiều cao. Diện tích toàn phần bằng tổng diện tích xung quanh và diện tích 2 đáy.',
    categories: ['surface'],
    shapeTags: ['tru'],
    highlightForShapes: ['tru'],
    variables: [
      { symbol: 'S_xq', label: 'Diện tích xung quanh', meaning: 'S_xq = 2πrh' },
      { symbol: 'S_tp', label: 'Diện tích toàn phần', meaning: 'S_tp = 2πrh + 2πr² = 2πr(h + r)' },
      { symbol: 'r, h', label: 'Bán kính & Chiều cao', meaning: 'Kích thước cơ bản của trụ' },
    ],
    calculation: {
      inputs: [
        { key: 'r', label: 'Bán kính đáy r', defaultValue: 3, unit: 'đvđd' },
        { key: 'h', label: 'Chiều cao h', defaultValue: 5, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const sxq = 2 * Math.PI * vals.r * vals.h;
        const stp = sxq + 2 * Math.PI * vals.r * vals.r;
        return {
          resultText: `S_xq ≈ ${sxq.toFixed(2)} | S_tp ≈ ${stp.toFixed(2)}`,
          stepsText: `S_xq = 2π×${vals.r}×${vals.h} ≈ ${sxq.toFixed(2)} | S_tp = ${sxq.toFixed(2)} + 2π×${vals.r}² ≈ ${stp.toFixed(2)}`,
        };
      },
    },
  },

  // ================= 4. HÌNH NÓN =================
  {
    id: 'non-volume',
    name: 'Thể tích khối nón tròn xoay',
    symbol: 'V',
    formulaDisplay: 'V = (1/3) · π · r² · h',
    description:
      'Thể tích khối nón bằng một phần ba tích của diện tích hình tròn đáy với chiều cao của nón.',
    categories: ['volume'],
    shapeTags: ['non'],
    highlightForShapes: ['non'],
    variables: [
      { symbol: 'r', label: 'Bán kính đáy', meaning: 'Bán kính mặt tròn đáy' },
      { symbol: 'h', label: 'Chiều cao', meaning: 'Khoảng cách từ đỉnh nón đến tâm đáy' },
      { symbol: 'l', label: 'Đường sinh', meaning: 'l = √(r² + h²)' },
    ],
    calculation: {
      inputs: [
        { key: 'r', label: 'Bán kính r', defaultValue: 3, unit: 'đvđd' },
        { key: 'h', label: 'Chiều cao h', defaultValue: 4, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const res = (1 / 3) * Math.PI * vals.r * vals.r * vals.h;
        return {
          resultText: `V ≈ ${res.toFixed(2)}`,
          stepsText: `V = 1/3 × π × ${vals.r}² × ${vals.h} ≈ ${res.toFixed(2)} (đvtt)`,
        };
      },
    },
  },
  {
    id: 'non-surface-slant',
    name: 'Diện tích xung quanh & Đường sinh hình nón',
    symbol: 'S_xq, l',
    formulaDisplay: 'l² = r² + h²  |  S_xq = π · r · l  |  S_tp = π·r·l + π·r²',
    description:
      'Đường sinh l, bán kính r và chiều cao h tạo thành tam giác vuông: l = √(r² + h²). Diện tích xung quanh bằng tích π · r · l.',
    categories: ['surface', 'pythagoras'],
    shapeTags: ['non'],
    highlightForShapes: ['non'],
    variables: [
      { symbol: 'l', label: 'Đường sinh', meaning: 'Độ dài đoạn nối đỉnh nón đến đường tròn đáy' },
      { symbol: 'S_xq', label: 'Diện tích xung quanh', meaning: 'S_xq = π·r·l' },
      { symbol: 'S_tp', label: 'Diện tích toàn phần', meaning: 'S_tp = π·r·l + π·r² = π·r(l + r)' },
    ],
    calculation: {
      inputs: [
        { key: 'r', label: 'Bán kính đáy r', defaultValue: 3, unit: 'đvđd' },
        { key: 'h', label: 'Chiều cao h', defaultValue: 4, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const l = Math.sqrt(vals.r * vals.r + vals.h * vals.h);
        const sxq = Math.PI * vals.r * l;
        const stp = sxq + Math.PI * vals.r * vals.r;
        return {
          resultText: `l = ${l.toFixed(2)} | S_xq ≈ ${sxq.toFixed(2)}`,
          stepsText: `l = √(${vals.r}² + ${vals.h}²) = ${l.toFixed(2)} ⇒ S_xq = π×${vals.r}×${l.toFixed(2)} ≈ ${sxq.toFixed(2)}, S_tp ≈ ${stp.toFixed(2)}`,
        };
      },
    },
  },

  // ================= 5. HÌNH CẦU =================
  {
    id: 'cau-volume',
    name: 'Thể tích khối cầu',
    symbol: 'V',
    formulaDisplay: 'V = (4/3) · π · R³',
    description:
      'Thể tích khối cầu bán kính R bằng bốn phần ba tích số pi với lập phương bán kính.',
    categories: ['volume'],
    shapeTags: ['cau'],
    highlightForShapes: ['cau'],
    variables: [
      { symbol: 'R', label: 'Bán kính mặt cầu', meaning: 'Khoảng cách từ tâm O đến điểm trên mặt cầu' },
      { symbol: 'd', label: 'Đường kính', meaning: 'd = 2R' },
    ],
    calculation: {
      inputs: [{ key: 'R', label: 'Bán kính R', defaultValue: 3, unit: 'đvđd' }],
      compute: (vals) => {
        const res = (4 / 3) * Math.PI * Math.pow(vals.R, 3);
        return {
          resultText: `V ≈ ${res.toFixed(2)}`,
          stepsText: `V = 4/3 × π × ${vals.R}³ = ${(4 / 3) * Math.pow(vals.R, 3)}π ≈ ${res.toFixed(2)} (đvtt)`,
        };
      },
    },
  },
  {
    id: 'cau-surface',
    name: 'Diện tích mặt cầu',
    symbol: 'S',
    formulaDisplay: 'S = 4 · π · R² = π · d²',
    description:
      'Diện tích mặt cầu bán kính R bằng 4 lần diện tích hình tròn lớn đi qua tâm.',
    categories: ['surface'],
    shapeTags: ['cau'],
    highlightForShapes: ['cau'],
    variables: [
      { symbol: 'S', label: 'Diện tích mặt cầu', meaning: 'Diện tích bề mặt khối cầu' },
      { symbol: 'R', label: 'Bán kính', meaning: 'Bán kính mặt cầu' },
    ],
    calculation: {
      inputs: [{ key: 'R', label: 'Bán kính R', defaultValue: 3, unit: 'đvđd' }],
      compute: (vals) => {
        const res = 4 * Math.PI * vals.R * vals.R;
        return {
          resultText: `S ≈ ${res.toFixed(2)}`,
          stepsText: `S = 4 × π × ${vals.R}² = ${4 * vals.R * vals.R}π ≈ ${res.toFixed(2)} (đvdt)`,
        };
      },
    },
  },

  // ================= 6. HÌNH LĂNG TRỤ, HỘP CHỮ NHẬT, LẬP PHƯƠNG =================
  {
    id: 'lang-tru-volume',
    name: 'Thể tích khối lăng trụ',
    symbol: 'V',
    formulaDisplay: 'V = B · h',
    description:
      'Thể tích khối lăng trụ bằng diện tích mặt đáy nhân với chiều cao (khoảng cách giữa hai mặt đáy song song).',
    categories: ['volume'],
    shapeTags: ['lang-tru'],
    highlightForShapes: ['lang-tru'],
    variables: [
      { symbol: 'B', label: 'Diện tích đáy', meaning: 'Diện tích của đa giác đáy' },
      { symbol: 'h', label: 'Chiều cao', meaning: 'Khoảng cách giữa hai mặt phẳng đáy' },
    ],
    calculation: {
      inputs: [
        { key: 'B', label: 'Diện tích đáy (B)', defaultValue: 10, unit: 'đvdt' },
        { key: 'h', label: 'Chiều cao (h)', defaultValue: 6, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const res = vals.B * vals.h;
        return {
          resultText: `V = ${res.toFixed(2)}`,
          stepsText: `V = B × h = ${vals.B} × ${vals.h} = ${res.toFixed(2)} (đvtt)`,
        };
      },
    },
  },
  {
    id: 'hop-chu-nhat-volume-diagonal',
    name: 'Thể tích & Đường chéo hình hộp chữ nhật',
    symbol: 'V, d',
    formulaDisplay: 'V = a · b · c  |  d = √(a² + b² + c²)',
    description:
      'Hình hộp chữ nhật kích thước a, b, c có thể tích bằng tích 3 kích thước. Bình phương đường chéo không gian d bằng tổng bình phương ba kích thước (Pytago không gian).',
    categories: ['volume', 'pythagoras'],
    shapeTags: ['hop-chu-nhat'],
    highlightForShapes: ['hop-chu-nhat'],
    variables: [
      { symbol: 'a, b, c', label: '3 kích thước', meaning: 'Chiều dài, chiều rộng, chiều cao' },
      { symbol: 'd', label: 'Đường chéo', meaning: 'd = √(a² + b² + c²)' },
      { symbol: 'S_tp', label: 'Diện tích toàn phần', meaning: 'S_tp = 2(ab + bc + ca)' },
    ],
    calculation: {
      inputs: [
        { key: 'a', label: 'Chiều dài a', defaultValue: 4, unit: 'đvđd' },
        { key: 'b', label: 'Chiều rộng b', defaultValue: 3, unit: 'đvđd' },
        { key: 'c', label: 'Chiều cao c', defaultValue: 5, unit: 'đvđd' },
      ],
      compute: (vals) => {
        const v = vals.a * vals.b * vals.c;
        const d = Math.sqrt(vals.a * vals.a + vals.b * vals.b + vals.c * vals.c);
        return {
          resultText: `V = ${v.toFixed(2)} | d = ${d.toFixed(2)}`,
          stepsText: `V = ${vals.a}×${vals.b}×${vals.c} = ${v.toFixed(2)} | d = √(${vals.a}²+${vals.b}²+${vals.c}²) = ${d.toFixed(2)}`,
        };
      },
    },
  },
  {
    id: 'lap-phuong-volume-diagonal',
    name: 'Thể tích & Đường chéo hình lập phương',
    symbol: 'V, d',
    formulaDisplay: 'V = a³  |  d = a√3  |  S_tp = 6a²',
    description:
      'Khối lập phương cạnh a có 6 mặt là hình vuông bằng nhau. Đường chéo chính của khối lập phương bằng cạnh nhân căn 3.',
    categories: ['volume', 'pythagoras', 'surface'],
    shapeTags: ['lap-phuong'],
    highlightForShapes: ['lap-phuong'],
    variables: [
      { symbol: 'a', label: 'Độ dài cạnh', meaning: 'Độ dài cạnh hình lập phương' },
      { symbol: 'd', label: 'Đường chéo', meaning: 'd = a√3 ≈ 1.732a' },
      { symbol: 'S_xq', label: 'Diện tích xung quanh', meaning: 'S_xq = 4a²' },
      { symbol: 'S_tp', label: 'Diện tích toàn phần', meaning: 'S_tp = 6a²' },
    ],
    calculation: {
      inputs: [{ key: 'a', label: 'Độ dài cạnh a', defaultValue: 4, unit: 'đvđd' }],
      compute: (vals) => {
        const v = Math.pow(vals.a, 3);
        const d = vals.a * Math.sqrt(3);
        const stp = 6 * vals.a * vals.a;
        return {
          resultText: `V = ${v.toFixed(2)} | d ≈ ${d.toFixed(2)}`,
          stepsText: `V = ${vals.a}³ = ${v.toFixed(2)} | d = ${vals.a}√3 ≈ ${d.toFixed(2)} | S_tp = 6×${vals.a}² = ${stp.toFixed(2)}`,
        };
      },
    },
  },

  // ================= 7. KHOẢNG CÁCH & GÓC KHÔNG GIAN =================
  {
    id: 'distance-point-to-plane-volume-method',
    name: 'Khoảng cách từ điểm đến mặt phẳng (Đổi đỉnh thể tích)',
    symbol: 'd(M, (P))',
    formulaDisplay: 'd(M, (ABC)) = (3 · V_M.ABC) / S_ABC',
    description:
      'Phương pháp thể tích: Thể tích khối chóp M.ABC không đổi dù chọn đỉnh nào. Do đó khoảng cách từ đỉnh M xuống đáy (ABC) bằng ba lần thể tích chia cho diện tích đáy (ABC).',
    categories: ['distance-angle'],
    shapeTags: ['chop', 'tu-dien'],
    highlightForShapes: ['chop', 'tu-dien'],
    variables: [
      { symbol: 'd(M, (P))', label: 'Khoảng cách', meaning: 'Độ dài đoạn vuông góc kẻ từ M đến (P)' },
      { symbol: 'V', label: 'Thể tích khối chóp', meaning: 'Thể tích khối chóp M.ABC' },
      { symbol: 'S_đáy', label: 'Diện tích mặt phẳng đích', meaning: 'Diện tích tam giác ABC' },
    ],
    calculation: {
      inputs: [
        { key: 'V', label: 'Thể tích khối chóp V', defaultValue: 18, unit: 'đvtt' },
        { key: 'S', label: 'Diện tích mặt đáy S', defaultValue: 12, unit: 'đvdt' },
      ],
      compute: (vals) => {
        const d = (3 * vals.V) / vals.S;
        return {
          resultText: `d = ${d.toFixed(2)}`,
          stepsText: `d = (3 × ${vals.V}) / ${vals.S} = ${d.toFixed(2)} (đvđd)`,
        };
      },
    },
  },
  {
    id: 'angle-dihedral-projection',
    name: 'Góc giữa hai mặt phẳng (Công thức hình chiếu diện tích)',
    symbol: 'cos φ',
    formulaDisplay: 'S\' = S · cos φ  ⟺  cos φ = S\' / S',
    description:
      'Định lý hình chiếu diện tích: Gọi S là diện tích của đa giác H trong mặt phẳng (P), S\' là diện tích hình chiếu của H lên mặt phẳng (Q). Khi đó cos φ = S\' / S, với φ là góc nhị diện giữa (P) và (Q).',
    categories: ['distance-angle'],
    shapeTags: ['chop', 'lang-tru', 'lap-phuong', 'hop-chu-nhat'],
    highlightForShapes: ['chop', 'lang-tru'],
    variables: [
      { symbol: 'S', label: 'Diện tích đa giác gốc', meaning: 'Diện tích mặt nghiêng' },
      { symbol: 'S\'', label: 'Diện tích hình chiếu', meaning: 'Diện tích hình chiếu lên mặt đáy' },
      { symbol: 'φ', label: 'Góc giữa hai mặt phẳng', meaning: '0° ≤ φ ≤ 90°' },
    ],
    calculation: {
      inputs: [
        { key: 'S_prime', label: 'Diện tích hình chiếu S\'', defaultValue: 6, unit: 'đvdt' },
        { key: 'S', label: 'Diện tích đa giác gốc S', defaultValue: 12, unit: 'đvdt' },
      ],
      compute: (vals) => {
        const cosPhi = Math.min(1, vals.S_prime / vals.S);
        const rad = Math.acos(cosPhi);
        const deg = (rad * 180) / Math.PI;
        return {
          resultText: `cos φ = ${cosPhi.toFixed(3)} ⇒ φ ≈ ${deg.toFixed(1)}°`,
          stepsText: `cos φ = ${vals.S_prime} / ${vals.S} = ${cosPhi.toFixed(3)} ⇒ Góc nhị diện φ = arccos(${cosPhi.toFixed(3)}) ≈ ${deg.toFixed(1)}°`,
        };
      },
    },
  },
];

/**
 * Detect shape category from shape_type string
 */
export function detectShapeCategory(shapeType: string): ShapeCategory {
  const lower = shapeType.toLowerCase().trim();

  if (lower.includes('trụ') || lower.includes('tru') || lower.includes('cylinder')) {
    return 'tru';
  }
  if (lower.includes('cầu') || lower.includes('cau') || lower.includes('sphere')) {
    return 'cau';
  }
  if (lower.includes('nón') || lower.includes('non') || lower.includes('cone')) {
    return 'non';
  }
  if (lower.includes('lập phương') || lower.includes('lap phuong') || lower.includes('cube')) {
    return 'lap-phuong';
  }
  if (
    lower.includes('hộp') ||
    lower.includes('hop') ||
    lower.includes('chữ nhật') ||
    lower.includes('chu nhat')
  ) {
    return 'hop-chu-nhat';
  }
  if (lower.includes('lăng trụ') || lower.includes('lang tru') || lower.includes('prism')) {
    return 'lang-tru';
  }
  if (lower.includes('tứ diện') || lower.includes('tu dien') || lower.includes('tetrahedron')) {
    return 'tu-dien';
  }
  if (lower.includes('chóp') || lower.includes('chop') || lower.includes('pyramid')) {
    return 'chop';
  }

  return 'chop';
}

/**
 * Filter formulas for a specific category or return all with highlighted current shape first
 */
export function getFormulasForShape(
  shape: ShapeCategory,
  categoryFilter?: 'all' | 'volume' | 'surface' | 'pythagoras' | 'distance-angle'
): GeometryFormulaItem[] {
  let list = GEOMETRY_FORMULAS.filter((f) => {
    if (categoryFilter && categoryFilter !== 'all') {
      return f.categories.includes(categoryFilter);
    }
    return true;
  });

  // Sort so formulas specifically matching the current shape appear first
  return list.sort((a, b) => {
    const aMatch = a.highlightForShapes.includes(shape) ? 1 : 0;
    const bMatch = b.highlightForShapes.includes(shape) ? 1 : 0;
    return bMatch - aMatch;
  });
}
