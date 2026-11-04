import { DailyChallenge, Badge } from '../types/challenge';
import { PRESET_PROBLEMS } from './presetProblems';

// Map existing presets into challenges with authentic Vietnamese high-school geometry questions (GDPT 2018)
export const CHALLENGES: DailyChallenge[] = [
  {
    id: 'challenge-chop-tam-giac',
    presetId: 'chop-tam-giac-sa-vuong-day',
    title: 'Quan hệ Vuông góc & Khoảng cách trong Chóp S.ABC',
    difficulty: 'Khó',
    stars: 4,
    description: 'Chóp S.ABC có SA ⊥ (ABC), đáy vuông tại B, AH ⊥ SB. Khảo sát các quan hệ vuông góc và góc tạo bởi đường thẳng với mặt phẳng.',
    tags: ['Đường thẳng ⊥ Mặt phẳng', 'Góc đường và mặt', 'Khoảng cách'],
    points: 150,
    geometryData: PRESET_PROBLEMS[0].data,
    questions: [
      {
        id: 'q1-1',
        question: 'Khẳng định nào sau đây về quan hệ vuông góc là ĐÚNG?',
        options: [
          {
            id: 'opt-a',
            text: 'BC ⊥ (SAB) và tam giác SBC vuông tại B',
            isCorrect: true,
            explanation: 'Chính xác! Vì BC ⊥ AB (gt đáy) và BC ⊥ SA (do SA ⊥ (ABC)) nên BC ⊥ (SAB). Do đó BC ⊥ SB, tam giác SBC vuông tại B.'
          },
          {
            id: 'opt-b',
            text: 'BC ⊥ (SAC) và tam giác SBC vuông tại S',
            isCorrect: false,
            explanation: 'Chưa đúng. BC không vuông góc với AC nên không thể vuông góc với (SAC).'
          },
          {
            id: 'opt-c',
            text: 'SB ⊥ (ABC) vì SA ⊥ đáy',
            isCorrect: false,
            explanation: 'Sai. Chỉ có cạnh SA vuông góc với (ABC), SB là đường xiên.'
          },
          {
            id: 'opt-d',
            text: 'AH song song với mặt phẳng (SBC)',
            isCorrect: false,
            explanation: 'Sai. AH cắt SB tại H thuộc (SBC), hơn nữa AH ⊥ (SBC).'
          }
        ],
        hint: 'Quan sát các ký hiệu vuông góc màu đỏ và xanh tại chân SA và đỉnh B trên mô hình 3D.'
      },
      {
        id: 'q1-2',
        question: 'Góc giữa đường thẳng SC và mặt phẳng đáy (ABC) là góc nào?',
        options: [
          {
            id: 'opt-a',
            text: 'Góc SCA',
            isCorrect: true,
            explanation: 'Chính xác! Do SA ⊥ (ABC) nên hình chiếu vuông góc của SC lên (ABC) là AC. Do đó góc giữa SC và đáy chính là góc SCA.'
          },
          {
            id: 'opt-b',
            text: 'Góc SBC',
            isCorrect: false,
            explanation: 'Góc SBC là một góc trong mặt bên (SBC), không phải góc với mặt đáy.'
          },
          {
            id: 'opt-c',
            text: 'Góc SCB',
            isCorrect: false,
            explanation: 'Chưa đúng, hình chiếu của SC là AC, không phải BC.'
          },
          {
            id: 'opt-d',
            text: 'Góc CSA',
            isCorrect: false,
            explanation: 'Góc CSA là góc giữa đường thẳng SC và đường thẳng đứng SA.'
          }
        ],
        hint: 'Hình chiếu của S lên (ABC) là điểm A, còn C thuộc (ABC) nên hình chiếu của SC là AC.'
      },
      {
        id: 'q1-3',
        question: 'Khoảng cách từ điểm A đến mặt phẳng (SBC) bằng độ dài đoạn thẳng nào?',
        options: [
          {
            id: 'opt-a',
            text: 'Đoạn thẳng AH (đường cao tam giác SAB kẻ từ A)',
            isCorrect: true,
            explanation: 'Rất tốt! Vì BC ⊥ (SAB) nên (SBC) ⊥ (SAB) theo giao tuyến SB. Trong (SAB), AH ⊥ SB tại H nên AH ⊥ (SBC). Vậy d(A, (SBC)) = AH.'
          },
          {
            id: 'opt-b',
            text: 'Đoạn thẳng AB',
            isCorrect: false,
            explanation: 'Sai. AB chỉ vuông góc với BC, không vuông góc với SB nên không vuông góc với (SBC).'
          },
          {
            id: 'opt-c',
            text: 'Đoạn thẳng SA',
            isCorrect: false,
            explanation: 'Sai. SA ⊥ (ABC), không vuông góc với (SBC).'
          },
          {
            id: 'opt-d',
            text: 'Đoạn thẳng AC',
            isCorrect: false,
            explanation: 'Sai. AC là cạnh đáy nằm trong (ABC).'
          }
        ],
        hint: 'Để tìm khoảng cách từ A đến mặt phẳng (SBC) chứa đường cao SA, tìm mặt phẳng qua A vuông góc (SBC).'
      }
    ]
  },
  {
    id: 'challenge-chop-tu-giac-deu',
    presetId: 'chop-tu-giac-deu-s-abcd',
    title: 'Góc Nhị Diện & Khoảng cách trong Chóp Tứ Giác Đều',
    difficulty: 'Vận dụng cao',
    stars: 5,
    description: 'Chóp đều S.ABCD có SO ⊥ đáy hình vuông ABCD. Xác định góc giữa mặt bên và đáy, khoảng cách từ tâm O đến mặt bên (SCD).',
    tags: ['Chóp đều', 'Góc giữa hai mặt phẳng', 'Khoảng cách từ điểm đến mặt'],
    points: 200,
    geometryData: PRESET_PROBLEMS[1].data,
    questions: [
      {
        id: 'q2-1',
        question: 'Gọi M là trung điểm CD. Góc giữa mặt bên (SCD) và mặt đáy (ABCD) được xác định bởi góc nào?',
        options: [
          {
            id: 'opt-a',
            text: 'Góc SMO (với OM ⊥ CD và SM ⊥ CD)',
            isCorrect: true,
            explanation: 'Chính xác! Giao tuyến là CD. Trong đáy ABCD, OM ⊥ CD; trong mặt bên SCD cân tại S, SM ⊥ CD. Do đó góc phẳng nhị diện là góc SMO.'
          },
          {
            id: 'opt-b',
            text: 'Góc SDO',
            isCorrect: false,
            explanation: 'Góc SDO là góc giữa cạnh bên SD và mặt đáy (ABCD), không phải góc giữa mặt bên và đáy.'
          },
          {
            id: 'opt-c',
            text: 'Góc SCO',
            isCorrect: false,
            explanation: 'Góc SCO là góc giữa cạnh bên SC và mặt đáy.'
          },
          {
            id: 'opt-d',
            text: 'Góc OSM',
            isCorrect: false,
            explanation: 'Góc OSM là góc tại đỉnh S trong tam giác vuông SOM.'
          }
        ],
        hint: 'Góc giữa hai mặt phẳng bằng góc giữa hai đường thẳng cùng vuông góc với giao tuyến tại 1 điểm.'
      },
      {
        id: 'q2-2',
        question: 'Kẻ OK ⊥ SM tại K. Đoạn thẳng OK có vuông góc với mặt phẳng (SCD) hay không?',
        options: [
          {
            id: 'opt-a',
            text: 'Có, vì CD ⊥ (SOM) nên (SCD) ⊥ (SOM), dẫn tới OK ⊥ (SCD)',
            isCorrect: true,
            explanation: 'Tuyệt vời! Ta có CD ⊥ OM và CD ⊥ SO nên CD ⊥ (SOM). Mặt phẳng (SCD) chứa CD nên (SCD) ⊥ (SOM). Giao tuyến là SM, mà OK ⊥ SM nên OK ⊥ (SCD).'
          },
          {
            id: 'opt-b',
            text: 'Không, OK chỉ vuông góc với SM chứ không vuông góc với (SCD)',
            isCorrect: false,
            explanation: 'Chưa chính xác, hãy nhớ lại định lý hai mặt phẳng vuông góc.'
          },
          {
            id: 'opt-c',
            text: 'Chỉ vuông góc khi chóp là tứ diện đều',
            isCorrect: false,
            explanation: 'Điều này đúng với mọi hình chóp tứ giác đều S.ABCD, không cần tứ diện đều.'
          },
          {
            id: 'opt-d',
            text: 'Không xác định được nếu chưa biết độ dài cạnh',
            isCorrect: false,
            explanation: 'Tính chất vuông góc độc lập với độ dài số đo cụ thể.'
          }
        ],
        hint: 'Bật hiển thị mặt phẳng phụ (SOM) màu ngọc bích trên mô hình 3D để quan sát.'
      }
    ]
  },
  {
    id: 'challenge-hinh-lap-phuong',
    presetId: 'hinh-lap-phuong-cat-mat-phang',
    title: 'Đường Chéo Khối & Mặt Phẳng Chéo trong Hình Lập Phương',
    difficulty: 'Khó',
    stars: 4,
    description: 'Khảo sát hình lập phương ABCD.A\'B\'C\'D\', vị trí tương đối giữa đường chéo BD\' và mặt phẳng (AB\'D\').',
    tags: ['Hình lập phương', 'Đường chéo khối', 'Quan hệ vuông góc không gian'],
    points: 180,
    geometryData: PRESET_PROBLEMS[2].data,
    questions: [
      {
        id: 'q3-1',
        question: 'Tam giác AB\'D\' là tam giác gì?',
        options: [
          {
            id: 'opt-a',
            text: 'Tam giác đều có cạnh bằng a√2 (độ dài đường chéo mặt vuông)',
            isCorrect: true,
            explanation: 'Chính xác! AB\', B\'D\', và AD\' đều là đường chéo của các mặt hình vuông bằng nhau cạnh a, do đó AB\' = B\'D\' = AD\' = a√2.'
          },
          {
            id: 'opt-b',
            text: 'Tam giác vuông cân tại A',
            isCorrect: false,
            explanation: 'Không đúng, cả 3 cạnh đều bằng nhau nên là tam giác đều.'
          },
          {
            id: 'opt-c',
            text: 'Tam giác tù có góc D\' > 90°',
            isCorrect: false,
            explanation: 'Tam giác AB\'D\' có 3 góc bằng 60°.'
          },
          {
            id: 'opt-d',
            text: 'Tam giác vuông tại B\'',
            isCorrect: false,
            explanation: 'Sai, 3 cạnh của tam giác đều bằng a√2.'
          }
        ],
        hint: 'Quan sát mặt phẳng màu đỏ hồng (AB\'D\') trên khung nhìn 3D.'
      },
      {
        id: 'q3-2',
        question: 'Đường chéo BD\' có mối quan hệ gì với mặt phẳng (AB\'D\')?',
        options: [
          {
            id: 'opt-a',
            text: 'BD\' vuông góc với mặt phẳng (AB\'D\') tại trọng tâm tam giác AB\'D\'',
            isCorrect: true,
            explanation: 'Xuất sắc! BD\' ⊥ AB\' và BD\' ⊥ AD\', do đó BD\' ⊥ (AB\'D\'). Hơn nữa, giao điểm chính là trọng tâm tam giác đều AB\'D\'.'
          },
          {
            id: 'opt-b',
            text: 'BD\' song song với mặt phẳng (AB\'D\')',
            isCorrect: false,
            explanation: 'Sai. BD\' xuyên thẳng qua mặt phẳng (AB\'D\').'
          },
          {
            id: 'opt-c',
            text: 'BD\' nằm trọn trong mặt phẳng (AB\'D\')',
            isCorrect: false,
            explanation: 'Sai, điểm B và D\' không thuộc mặt phẳng (AB\'D\').'
          },
          {
            id: 'opt-d',
            text: 'BD\' cắt (AB\'D\') nhưng không vuông góc',
            isCorrect: false,
            explanation: 'Đây là bài toán kinh điển trong SGK: Đường chéo chính của hình lập phương vuông góc với mặt phẳng nối 3 đỉnh kề.'
          }
        ],
        hint: 'Dùng công cụ đo góc hoặc quan sát trục đối xứng của hình lập phương.'
      }
    ]
  },
  {
    id: 'challenge-lang-tru-tam-giac',
    presetId: 'lang-tru-tam-giac-dung',
    title: 'Khoảng Cách Giữa Hai Đường Thẳng Chéo Nhau trong Lăng Trụ Đứng',
    difficulty: 'Khó',
    stars: 4,
    description: 'Lăng trụ đứng ABC.A\'B\'C\' có đáy ABC vuông tại A. Tính khoảng cách giữa hai đường chéo nhau AA\' và B\'C.',
    tags: ['Lăng trụ đứng', 'Hai đường thẳng chéo nhau', 'Khoảng cách'],
    points: 160,
    geometryData: PRESET_PROBLEMS[3].data,
    questions: [
      {
        id: 'q4-1',
        question: 'Phương pháp nào sau đây là TỐI ƯU NHẤT để tìm khoảng cách giữa AA\' và B\'C?',
        options: [
          {
            id: 'opt-a',
            text: 'Do AA\' // (BCC\'B\') nên d(AA\', B\'C) = d(AA\', (BCC\'B\')) = d(A, (BCC\'B\'))',
            isCorrect: true,
            explanation: 'Chính xác! Vì AA\' // BB\' nên AA\' song song với mặt phẳng (BCC\'B\') chứa đường thẳng B\'C. Khi đó khoảng cách bằng khoảng cách từ điểm A đến mặt phẳng này.'
          },
          {
            id: 'opt-b',
            text: 'Tìm đoạn vuông góc chung nối trực tiếp 2 điểm ngẫu nhiên',
            isCorrect: false,
            explanation: 'Dựng đoạn vuông góc chung trực tiếp khó hơn nhiều so with phương pháp mặt phẳng song song.'
          },
          {
            id: 'opt-c',
            text: 'Tính độ dài đoạn thẳng AB',
            isCorrect: false,
            explanation: 'AB không vuông góc với B\'C nên AB không phải khoảng cách.'
          },
          {
            id: 'opt-d',
            text: 'Tính độ dài đoạn thẳng AC',
            isCorrect: false,
            explanation: 'AC không vuông góc với (BCC\'B\').'
          }
        ],
        hint: 'Quan sát mặt bên (BCC\'B\') màu tím và cạnh thẳng đứng AA\' màu đỏ.'
      },
      {
        id: 'q4-2',
        question: 'Kẻ AH ⊥ BC tại H. Đoạn thẳng AH có chính là khoảng cách từ A đến (BCC\'B\') không?',
        options: [
          {
            id: 'opt-a',
            text: 'Đúng, vì AH ⊥ BC và AH ⊥ BB\' (do lăng trụ đứng) ⇒ AH ⊥ (BCC\'B\')',
            isCorrect: true,
            explanation: 'Rất chuẩn! BB\' vuông góc đáy nên BB\' ⊥ AH. Mà AH ⊥ BC nên AH ⊥ (BCC\'B\'). Vậy d(A, (BCC\'B\')) = AH.'
          },
          {
            id: 'opt-b',
            text: 'Sai, phải kẻ từ A\' mới đúng',
            isCorrect: false,
            explanation: 'Mọi điểm trên AA\' đều cách đều mặt phẳng (BCC\'B\') một khoảng như nhau.'
          },
          {
            id: 'opt-c',
            text: 'Sai, khoảng cách là AC',
            isCorrect: false,
            explanation: 'AC không vuông góc với BC.'
          },
          {
            id: 'opt-d',
            text: 'Chưa đủ dữ kiện để khẳng định',
            isCorrect: false,
            explanation: 'Tính chất lăng trụ đứng và đường cao tam giác đáy là hoàn toàn xác định.'
          }
        ],
        hint: 'Lăng trụ đứng có các cạnh bên vuông góc với mặt phẳng đáy.'
      }
    ]
  },
  {
    id: 'challenge-hinh-thang-vuong',
    presetId: 'chop-day-hinh-thang-vuong',
    title: 'Góc Giữa Đường Thẳng & Mặt Phẳng trong Chóp Đáy Hình Thang',
    difficulty: 'Vận dụng cao',
    stars: 5,
    description: 'Chóp S.ABCD có SA ⊥ (ABCD), đáy ABCD là hình thang vuông tại A và B với AD = 2a, AB = BC = a. Xác định góc giữa SD và (SAC).',
    tags: ['Hình thang vuông', 'Đường thẳng vuông góc mặt phẳng', 'Góc đường và mặt'],
    points: 220,
    geometryData: PRESET_PROBLEMS[4].data,
    questions: [
      {
        id: 'q5-1',
        question: 'Với AB = BC = a và AD = 2a, mối quan hệ giữa đường chéo AC và cạnh bên CD là gì?',
        options: [
          {
            id: 'opt-a',
            text: 'AC vuông góc với CD (tam giác ACD vuông cân tại C)',
            isCorrect: true,
            explanation: 'Chính xác! AC = a√2. Kẻ CE ⊥ AD thì CE = a, ED = a ⇒ CD² = a² + a² = 2a². Ta có AC² + CD² = 2a² + 2a² = 4a² = AD² ⇒ ΔACD vuông tại C.'
          },
          {
            id: 'opt-b',
            text: 'AC song song với CD',
            isCorrect: false,
            explanation: 'AC và CD cắt nhau tại C nên không thể song song.'
          },
          {
            id: 'opt-c',
            text: 'AC bằng 2 lần CD',
            isCorrect: false,
            explanation: 'AC = CD = a√2 (bằng nhau chứ không gấp đôi).'
          },
          {
            id: 'opt-d',
            text: 'Góc giữa AC và CD bằng 60°',
            isCorrect: false,
            explanation: 'Tam giác ACD vuông cân tại C nên góc ACD = 90°.'
          }
        ],
        hint: 'Hãy dùng định lý Pythagore đảo cho tam giác ACD với các cạnh AC = a√2, CD = a√2, AD = 2a.'
      },
      {
        id: 'q5-2',
        question: 'Hình chiếu vuông góc của đoạn thẳng SD lên mặt phẳng (SAC) là đoạn thẳng nào?',
        options: [
          {
            id: 'opt-a',
            text: 'Đoạn thẳng SC (do CD ⊥ (SAC))',
            isCorrect: true,
            explanation: 'Rất chính xác! Vì CD ⊥ AC và CD ⊥ SA (do SA ⊥ đáy) nên CD ⊥ (SAC). Do đó hình chiếu vuông góc của D lên (SAC) là điểm C. S thuộc (SAC) nên hình chiếu của SD là SC. Góc giữa SD và (SAC) là góc DSC.'
          },
          {
            id: 'opt-b',
            text: 'Đoạn thẳng SA',
            isCorrect: false,
            explanation: 'A là hình chiếu của S lên đáy, không phải hình chiếu của D lên (SAC).'
          },
          {
            id: 'opt-c',
            text: 'Đoạn thẳng AC',
            isCorrect: false,
            explanation: 'AC nằm dưới đáy, không phải hình chiếu của SD.'
          },
          {
            id: 'opt-d',
            text: 'Đoạn thẳng SO',
            isCorrect: false,
            explanation: 'Hình chóp này không có đường cao SO ở giữa đáy.'
          }
        ],
        hint: 'Tìm hình chiếu của điểm D lên mặt phẳng (SAC). Đoạn thẳng nào từ D vuông góc với (SAC)?'
      }
    ]
  }
];

// Badges list definition
export const BADGES: Badge[] = [
  {
    id: 'first_solve',
    title: 'Bước Đầu Vào Không Gian',
    description: 'Giải đúng câu hỏi thử thách hình học không gian đầu tiên.',
    category: 'milestone',
    icon: '🎯',
    requirement: 'Hoàn thành 1 thử thách bất kỳ',
    progress: 0,
    unlocked: false
  },
  {
    id: 'streak_3',
    title: 'Chiến Binh Bền Bỉ',
    description: 'Duy trì chuỗi học tập 3 ngày liên tiếp cùng mô hình 3D.',
    category: 'streak',
    icon: '🔥',
    requirement: 'Đạt chuỗi streak 3 ngày',
    progress: 0,
    unlocked: false
  },
  {
    id: 'streak_7',
    title: 'Bậc Thầy Kỷ Luật',
    description: 'Chinh phục chuỗi học tập 7 ngày liên tiếp không ngắt quãng.',
    category: 'streak',
    icon: '⚡',
    requirement: 'Đạt chuỗi streak 7 ngày',
    progress: 0,
    unlocked: false
  },
  {
    id: 'perpendicular_master',
    title: 'Chuyên Gia Vuông Góc',
    description: 'Nắm vững định lý đường thẳng vuông góc mặt phẳng và tính chất chân đường cao.',
    category: 'mastery',
    icon: '📐',
    requirement: 'Giải quyết thử thách Chóp tam giác có cạnh bên vuông góc đáy',
    progress: 0,
    unlocked: false
  },
  {
    id: 'dihedral_master',
    title: 'Thiên Tài Góc Nhị Diện',
    description: 'Xác định chính xác góc phẳng nhị diện và khoảng cách trong chóp tứ giác đều.',
    category: 'mastery',
    icon: '💎',
    requirement: 'Giải quyết thử thách Chóp tứ giác đều S.ABCD',
    progress: 0,
    unlocked: false
  },
  {
    id: 'cube_explorer',
    title: 'Thám Hiểm Đa Diện Đều',
    description: 'Chinh phục góc nhìn hình lập phương và đường chéo khối vuông góc mặt phẳng.',
    category: 'mastery',
    icon: '🧊',
    requirement: 'Giải quyết thử thách Hình lập phương ABCD.A\'B\'C\'D\'',
    progress: 0,
    unlocked: false
  },
  {
    id: 'skew_lines_master',
    title: 'Bậc Thầy Khoảng Cách',
    description: 'Làm chủ phương pháp dựng mặt phẳng song song tính khoảng cách hai đường chéo nhau.',
    category: 'mastery',
    icon: '📏',
    requirement: 'Giải quyết thử thách Lăng trụ đứng tam giác',
    progress: 0,
    unlocked: false
  },
  {
    id: 'all_rounder',
    title: 'Nhà Toán Học 3D Xuất Sắc',
    description: 'Vượt qua tất cả các thử thách bài tập khó trong kho dữ liệu chuẩn.',
    category: 'special',
    icon: '🏆',
    requirement: 'Giải quyết toàn bộ 5 thử thách hình học',
    progress: 0,
    unlocked: false
  }
];
