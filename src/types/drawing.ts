export type DrawingTool = 'pen' | 'dashed' | 'line' | 'arrow' | 'highlighter' | 'eraser';

export interface DrawPoint {
  x: number;
  y: number;
  pressure?: number;
}

export interface DrawStroke {
  id: string;
  tool: DrawingTool;
  color: string;
  width: number;
  points: DrawPoint[];
}
