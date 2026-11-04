export interface GeometryVertex {
  id: string;
  label: string;
  coord: [number, number, number]; // [x, y, z] in standard math coordinates (z is height)
  isAltitudeFoot?: boolean;
}

export interface GeometryEdge {
  start: string;
  end: string;
  isDashed: boolean;
  color?: string;
  width?: number;
  label?: string;
  isAltitude?: boolean;
}

export interface GeometryFace {
  vertices: string[];
  name: string;
  color: string;
  opacity: number;
}

export interface GeometryRightAngle {
  vertex: string;
  arm1: string;
  arm2: string;
  size?: number;
  color?: string;
}

export interface CameraPreset {
  initial_position: [number, number, number];
  look_at: [number, number, number];
}

export interface Geometry3D {
  vertices: GeometryVertex[];
  edges: GeometryEdge[];
  faces: GeometryFace[];
  right_angles: GeometryRightAngle[];
  camera_preset: CameraPreset;
}

export interface ProblemAnalysis {
  problem_statement: string;
  shape_type: string;
  hypothesis: string[];
  target: string;
}

export interface SolidGeometryOutput {
  problem_analysis: ProblemAnalysis;
  geometry_3d: Geometry3D;
  pedagogical_hints: string[];
}

export interface GeometryNote {
  id: string;
  targetType: 'vertex' | 'edge';
  targetId: string; // e.g. "A" for vertex A, or "A-B" for edge AB
  targetLabel: string; // e.g. "Đỉnh A" or "Cạnh AB"
  content: string;
  color: 'yellow' | 'cyan' | 'pink' | 'emerald' | 'purple';
  createdAt: string;
  coord?: [number, number, number]; // Math coordinates for anchoring sticky pin in 3D
}
