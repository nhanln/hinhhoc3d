import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import 'dotenv/config';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '25mb' }));

const geometryResponseSchema = {
  type: Type.OBJECT,
  properties: {
    problem_analysis: {
      type: Type.OBJECT,
      properties: {
        problem_statement: { type: Type.STRING, description: 'Tóm tắt đề bài ngắn gọn' },
        shape_type: { type: Type.STRING, description: 'Chóp tam giác / Chóp tứ giác / Lăng trụ / Lập phương /...' },
        hypothesis: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: 'Danh sách các giả thiết quan trọng của đề bài'
        },
        target: { type: Type.STRING, description: 'Yêu cầu cần tính hoặc chứng minh' }
      },
      required: ['problem_statement', 'shape_type', 'hypothesis', 'target']
    },
    geometry_3d: {
      type: Type.OBJECT,
      properties: {
        vertices: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Mã định danh đỉnh (e.g. A, B, S)' },
              label: { type: Type.STRING, description: 'Nhãn hiển thị (e.g. A, B, S)' },
              coord: {
                type: Type.ARRAY,
                items: { type: Type.NUMBER },
                description: 'Tọa độ [x, y, z], đáy nằm trên Oxy (z=0), Oz là chiều cao đứng, phạm vi -5 đến 5'
              },
              isAltitudeFoot: { type: Type.BOOLEAN, description: 'Có phải chân đường cao không' }
            },
            required: ['id', 'label', 'coord']
          }
        },
        edges: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              start: { type: Type.STRING, description: 'id đỉnh đầu' },
              end: { type: Type.STRING, description: 'id đỉnh cuối' },
              isDashed: { type: Type.BOOLEAN, description: 'true nếu là cạnh khuất nét đứt SGK' },
              color: { type: Type.STRING, description: 'Mã màu hex (e.g. #0284c7)' },
              width: { type: Type.NUMBER, description: 'Độ dày cạnh (e.g. 2)' },
              label: { type: Type.STRING, description: 'Nhãn cạnh nếu cần' },
              isAltitude: { type: Type.BOOLEAN, description: 'true nếu là đường cao của hình' }
            },
            required: ['start', 'end', 'isDashed']
          }
        },
        faces: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vertices: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Danh sách id các đỉnh tạo mặt phẳng theo thứ tự'
              },
              name: { type: Type.STRING, description: 'Tên mặt phẳng (e.g. Mặt đáy (ABC))' },
              color: { type: Type.STRING, description: 'Mã màu hex' },
              opacity: { type: Type.NUMBER, description: 'Độ mờ (0.15 - 0.4)' }
            },
            required: ['vertices', 'name', 'color', 'opacity']
          }
        },
        right_angles: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              vertex: { type: Type.STRING, description: 'Đỉnh góc vuông' },
              arm1: { type: Type.STRING, description: 'Đỉnh trên cạnh thứ nhất' },
              arm2: { type: Type.STRING, description: 'Đỉnh trên cạnh thứ hai' },
              size: { type: Type.NUMBER, description: 'Kích thước ký hiệu góc vuông (e.g. 0.3)' },
              color: { type: Type.STRING, description: 'Mã màu' }
            },
            required: ['vertex', 'arm1', 'arm2']
          }
        },
        camera_preset: {
          type: Type.OBJECT,
          properties: {
            initial_position: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: 'Vị trí camera [x, y, z]'
            },
            look_at: {
              type: Type.ARRAY,
              items: { type: Type.NUMBER },
              description: 'Điểm nhìn [x, y, z]'
            }
          },
          required: ['initial_position', 'look_at']
        }
      },
      required: ['vertices', 'edges', 'faces', 'right_angles', 'camera_preset']
    },
    pedagogical_hints: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Gợi ý sư phạm cách nhìn nhận hình học và phương pháp giải'
    }
  },
  required: ['problem_analysis', 'geometry_3d', 'pedagogical_hints']
};

const SYSTEM_INSTRUCTION = `Bạn là một trợ lý AI chuyên gia về Hình học Không gian Toán THPT (Chương trình GDPT 2018) kết hợp chuyên môn lập trình đồ họa không gian 3 chiều (Three.js / WebGL).

NHIỆM VỤ:
Tiếp nhận dữ liệu đầu vào dưới dạng:
1. Hình ảnh: Ảnh chụp đề bài SGK, ảnh vẽ phác tay hoặc hình vẽ hình học không gian.
2. Văn bản / Lời nói: Đề bài toán hình học không gian bằng tiếng Việt (nhập trực tiếp hoặc phiên âm từ giọng nói).

Xử lý và trả về cấu trúc dữ liệu mô hình 3D chuẩn xác, phục vụ trực tiếp việc render hình học tương tác cho học sinh THPT.

QUY TẮC DỰNG HÌNH & QUY ƯỚC TOÁN HỌC THPT:
1. Hệ tọa độ chuẩn:
   - Mặt phẳng đáy chính luôn nằm trên mặt phẳng Oxy (z = 0) với z là chiều cao thẳng đứng.
   - Tọa độ đỉnh (x, y, z) phải tỉ lệ cân đối, rõ ràng, dễ nhìn khi xoay 360 độ (khoảng giá trị tọa độ từ -5 đến 5).
   - Đỉnh chóp S thường có z > 0 (ví dụ z = 3.5 đến 4.0).
   - Với hình chóp có cạnh bên vuông góc với đáy (ví dụ SA ⊥ đáy), đỉnh S có tọa độ (x_A, y_A, z_S) với z_S > 0.
   - Với hình chóp đều (ví dụ chóp đều S.ABCD), đỉnh S nằm trên trục vuông góc với đáy tại tâm O (0, 0, z_S).
   - Với hình lăng trụ, các đỉnh đáy trên A', B', C'... có cùng x, y với đáy dưới nhưng có z = h (ví dụ z = 3.5).
2. Quy ước nét vẽ chuẩn SGK Việt Nam:
   - Cạnh khuất (bị che khuất khi nhìn từ góc quan sát chính diện/phía trước): Đánh dấu isDashed = true (vẽ nét đứt).
   - Cạnh nhìn thấy: Đánh dấu isDashed = false (vẽ nét liền).
   - Đường cao hình chóp/lăng trụ: Đánh dấu isAltitude: true, tô màu nổi bật (ví dụ #dc2626).
3. Yếu tố phụ trợ hình học:
   - Đường cao hình chóp/lăng trụ: Cần đánh dấu rõ chân đường cao và đỉnh.
   - Ký hiệu góc vuông (right_angles): Tự động tính toán 3 điểm tạo góc vuông tại chân đường cao hoặc các góc vuông giả thiết (như tam giác đáy vuông tại B, đáy hình vuông, thiết diện vuông góc). Mỗi góc vuông xác định bởi vertex (đỉnh vuông), arm1 (hướng cạnh 1), arm2 (hướng cạnh 2), size: 0.3.
   - Mặt phẳng phụ / Mặt cắt (faces): Liệt kê mặt đáy, các mặt bên chính và mặt phẳng phụ/thiết diện (P), (SAB),... tạo danh sách các đỉnh tạo nên đa giác phẳng đó với độ trong suốt (opacity ~ 0.2 đến 0.35).
4. Gợi ý sư phạm (pedagogical_hints):
   - Cung cấp 2 - 4 gợi ý tư duy phương pháp giải bài toán hình học không gian chuẩn GDPT 2018 (tìm hình chiếu vuông góc, định lý 3 đường vuông góc, cách xác định góc giữa đường thẳng và mặt phẳng, góc giữa hai mặt phẳng, khoảng cách từ điểm đến mặt phẳng).

BẮT BUỘC TRẢ VỀ ĐÚNG JSON THEO SCHEMA ĐÃ ĐỊNH NGHĨA.`;

// API endpoint for analyzing geometry problems
app.post('/api/analyze-geometry', async (req, res) => {
  try {
    const { prompt, imageBase64, mimeType } = req.body;

    if (!prompt && !imageBase64) {
      return res.status(400).json({ error: 'Vui lòng cung cấp đề bài toán dạng văn bản hoặc hình ảnh.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'Chưa cấu hình GEMINI_API_KEY. Vui lòng kiểm tra Settings > Secrets.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    const parts: any[] = [];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    const userPromptText = prompt
      ? `Đề bài toán hình học không gian:\n"${prompt}"\n\nHãy phân tích đề bài, trích xuất hình học, tính toán tọa độ 3D chuẩn xác, xác định nét đứt/liền theo quy ước SGK GDPT 2018 và trả về đúng JSON Schema.`
      : `Hãy đọc kĩ ảnh đề bài / hình vẽ hình học không gian này, trích xuất các giả thiết, tính toán tọa độ 3D chuẩn xác, xác định nét đứt/liền theo quy ước SGK GDPT 2018 và trả về đúng JSON Schema.`;

    parts.push({ text: userPromptText });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: geometryResponseSchema,
      },
    });

    const textOutput = response.text;
    if (!textOutput) {
      throw new Error('Mô hình không trả về nội dung.');
    }

    const parsedData = JSON.parse(textOutput);
    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error analyzing geometry:', error);
    return res.status(500).json({
      error: error?.message || 'Có lỗi xảy ra khi phân tích hình học không gian bằng AI.'
    });
  }
});

// Setup Vite or static serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`Solid Geometry AI Studio Server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
