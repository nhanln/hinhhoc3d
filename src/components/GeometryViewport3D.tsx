import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { SolidGeometryOutput, GeometryVertex, GeometryEdge, GeometryFace, GeometryNote } from '../types/geometry';
import { mathToThreeCoord, computeRightAngleLines, checkIsSoftwareGl } from '../utils/math3d';
import { DistanceMeasurement, DihedralAngleMeasurement } from './MeasurementTool';
import {
  Maximize2,
  Minimize2,
  Camera,
  RotateCcw,
  RotateCw,
  Eye,
  Layers,
  Sparkles,
  Download,
  Square,
  Play,
  Pause,
  Ruler,
  Compass,
  StickyNote,
  Pin,
  Presentation,
  Printer,
  Sun,
  Moon,
  Scan,
  SwitchCamera,
  ZoomIn,
  ZoomOut,
  Video,
  VideoOff,
  AlertCircle,
  MoveVertical,
  Pencil,
  FileText,
  Radio,
  Columns2,
  GraduationCap
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { DrawingCanvasOverlay } from './DrawingCanvasOverlay';
import { DrawStroke } from '../types/drawing';
import { VoiceTourFloatingWidget } from './VoiceTourFloatingWidget';
import { VoiceTourScript, VoiceTourSettings, VoiceTourStep } from '../types/voiceTour';
import { ParallelProjection2DView, ProjectionType } from './ParallelProjection2DView';

interface GeometryViewport3DProps {
  data: SolidGeometryOutput;
  selectedVertexId?: string | null;
  selectedEdge?: { start: string; end: string } | null;
  selectedFaceName?: string | null;
  activeDistance?: DistanceMeasurement | null;
  activeAngle?: DihedralAngleMeasurement | null;
  notes?: GeometryNote[];
  isPresentationMode?: boolean;
  isArMode?: boolean;
  isDrawingMode?: boolean;
  onSelectVertex?: (vertex: GeometryVertex | null) => void;
  onSelectEdge?: (edge: GeometryEdge | null) => void;
  onSelectFace?: (face: GeometryFace | null) => void;
  onOpenMeasurement?: () => void;
  onOpenNoteForTarget?: (targetType: 'vertex' | 'edge', targetId: string) => void;
  onOpenNotesManager?: () => void;
  onTogglePresentationMode?: () => void;
  onOpenExport3D?: () => void;
  onOpenExportPdf?: (snapshotDataUrl: string | null) => void;
  onToggleArMode?: () => void;
  onToggleDrawingMode?: () => void;
  registerGetSnapshot?: (fn: () => string | null) => void;
  // Voice Tour Props
  isVoiceTourActive?: boolean;
  onToggleVoiceTour?: () => void;
  voiceTourScript?: VoiceTourScript | null;
  currentVoiceTourIndex?: number;
  isVoiceTourSpeaking?: boolean;
  isVoiceTourPaused?: boolean;
  voiceTourSettings?: VoiceTourSettings;
  activeFocusTarget?: { type: 'overview' | 'vertex' | 'edge' | 'face'; id?: string; preset?: string } | null;
  onVoiceTourPlay?: () => void;
  onVoiceTourPause?: () => void;
  onVoiceTourResume?: () => void;
  onVoiceTourNext?: () => void;
  onVoiceTourPrev?: () => void;
  onVoiceTourSelectStep?: (index: number) => void;
  onVoiceTourUpdateSettings?: (settings: Partial<VoiceTourSettings>) => void;
  onOpenVoiceTourEditor?: () => void;
  // Parallel Dual View (Chế độ xem song song 3D phối cảnh & 2D hình chiếu)
  isDualView?: boolean;
  onToggleDualView?: () => void;
  // Quick Quiz (Quiz Kiểm Tra Nhanh)
  onOpenQuiz?: () => void;
}

export const GeometryViewport3D: React.FC<GeometryViewport3DProps> = ({
  data,
  selectedVertexId,
  selectedEdge,
  selectedFaceName,
  activeDistance,
  activeAngle,
  notes = [],
  isPresentationMode = false,
  isArMode,
  isDrawingMode,
  onSelectVertex,
  onSelectEdge,
  onSelectFace,
  onOpenMeasurement,
  onOpenNoteForTarget,
  onOpenNotesManager,
  onTogglePresentationMode,
  onOpenExport3D,
  onOpenExportPdf,
  onToggleArMode,
  onToggleDrawingMode,
  registerGetSnapshot,
  isVoiceTourActive = false,
  onToggleVoiceTour,
  voiceTourScript,
  currentVoiceTourIndex = 0,
  isVoiceTourSpeaking = false,
  isVoiceTourPaused = false,
  voiceTourSettings,
  activeFocusTarget,
  onVoiceTourPlay,
  onVoiceTourPause,
  onVoiceTourResume,
  onVoiceTourNext,
  onVoiceTourPrev,
  onVoiceTourSelectStep,
  onVoiceTourUpdateSettings,
  onOpenVoiceTourEditor,
  isDualView,
  onToggleDualView,
  onOpenQuiz,
}) => {
  const { isLight } = useTheme();
  const mountRef = useRef<HTMLDivElement>(null);
  const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [showRightAngles, setShowRightAngles] = useState(true);
  const [showFaces, setShowFaces] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showDashedSGK, setShowDashedSGK] = useState(true);
  const [isDockCollapsed, setIsDockCollapsed] = useState(false);
  const [activeViewName, setActiveViewName] = useState<string>('sgk');
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [autoRotateSpeed, setAutoRotateSpeed] = useState(1.2);

  // Parallel Dual View (Chế độ xem song song 3D phối cảnh & 2D hình chiếu)
  const [internalDualView, setInternalDualView] = useState(false);
  const isDualViewActive = isDualView !== undefined ? isDualView : internalDualView;
  const [projectionType, setProjectionType] = useState<ProjectionType>('front');
  const [splitRatio, setSplitRatio] = useState<'50-50' | '60-40' | '40-60'>('50-50');

  const handleToggleDualView = () => {
    if (onToggleDualView) {
      onToggleDualView();
    } else {
      setInternalDualView((prev) => !prev);
    }
  };

  // Augmented Reality (AR) States
  const [internalArActive, setInternalArActive] = useState(false);
  const isArActive = isArMode !== undefined ? isArMode : internalArActive;
  const videoRef = useRef<HTMLVideoElement>(null);
  const arStreamRef = useRef<MediaStream | null>(null);
  const [arFacing, setArFacing] = useState<'environment' | 'user'>('environment');
  const [isArLoading, setIsArLoading] = useState(false);
  const [arError, setArError] = useState<string | null>(null);
  const [arScale, setArScale] = useState(1.0);
  const [arElevation, setArElevation] = useState(0.0);
  const [arRotationY, setArRotationY] = useState(0);

  const handleToggleAr = () => {
    if (onToggleArMode) {
      onToggleArMode();
    } else {
      setInternalArActive((prev) => !prev);
    }
  };

  // Freehand Drawing Mode States (Vẽ tay hình học không gian)
  const [internalDrawingActive, setInternalDrawingActive] = useState(false);
  const isDrawingActive = isDrawingMode !== undefined ? isDrawingMode : internalDrawingActive;
  const [isDrawingCapturing, setIsDrawingCapturing] = useState(false);
  const drawnStrokesRef = useRef<DrawStroke[]>([]);

  const handleToggleDrawing = () => {
    if (onToggleDrawingMode) {
      onToggleDrawingMode();
    } else {
      setInternalDrawingActive((prev) => !prev);
    }
  };

  // Step-by-step construction animation
  const [constructionStep, setConstructionStep] = useState<number>(4);
  const [isPlayingSteps, setIsPlayingSteps] = useState<boolean>(false);

  // Projected 2D screen positions for labels
  const [vertexLabels2D, setVertexLabels2D] = useState<{ id: string; label: string; x: number; y: number; visible: boolean }[]>([]);
  // Projected 2D screen position for measurement badge
  const [measureBadge2D, setMeasureBadge2D] = useState<{ text: string; x: number; y: number; visible: boolean } | null>(null);
  // Projected 2D screen positions for sticky note pins
  const [notePins2D, setNotePins2D] = useState<{
    id: string;
    targetType: 'vertex' | 'edge';
    targetId: string;
    targetLabel: string;
    content: string;
    color: string;
    x: number;
    y: number;
    visible: boolean;
  }[]>([]);

  // Callbacks in refs for stable WebGL raycaster event listeners
  const onSelectVertexRef = useRef(onSelectVertex);
  const onSelectEdgeRef = useRef(onSelectEdge);
  const onOpenNoteForTargetRef = useRef(onOpenNoteForTarget);
  useEffect(() => {
    onSelectVertexRef.current = onSelectVertex;
    onSelectEdgeRef.current = onSelectEdge;
    onOpenNoteForTargetRef.current = onOpenNoteForTarget;
  });

  // Internal Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const modelGroupRef = useRef<THREE.Group | null>(null);
  const gridGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number>(0);
  const vertexCoordsMapRef = useRef<Map<string, THREE.Vector3>>(new Map());

  // Update vertex screen coordinates for HTML labels & Measurement Badge
  const updateLabels = useCallback(() => {
    if (!cameraRef.current || !mountRef.current || !data) return;
    const camera = cameraRef.current;
    const width = mountRef.current.clientWidth;
    const height = mountRef.current.clientHeight;

    const labels = data.geometry_3d.vertices.map((v) => {
      const v3 = mathToThreeCoord(v.coord);
      const clone = v3.clone();
      clone.project(camera);

      const isVisible = clone.z < 1;
      const screenX = ((clone.x + 1) * width) / 2;
      const screenY = ((-clone.y + 1) * height) / 2;

      return {
        id: v.id,
        label: v.label,
        x: screenX,
        y: screenY,
        visible: isVisible,
      };
    });

    setVertexLabels2D(labels);

    // Update measurement badge position
    if (activeDistance) {
      const p1 = mathToThreeCoord(activeDistance.vertex1.coord);
      const p2 = mathToThreeCoord(activeDistance.vertex2.coord);
      const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      const midProj = mid.clone().project(camera);
      if (midProj.z < 1) {
        setMeasureBadge2D({
          text: `d(${activeDistance.vertex1.label}, ${activeDistance.vertex2.label}) = ${activeDistance.distance} (≈ ${activeDistance.approxText})`,
          x: ((midProj.x + 1) * width) / 2,
          y: ((-midProj.y + 1) * height) / 2,
          visible: true,
        });
      } else {
        setMeasureBadge2D(null);
      }
    } else if (activeAngle) {
      // Find average center of plane 1 and plane 2
      const centerP1 = activeAngle.plane1Vertices
        .map((v) => mathToThreeCoord(v.coord))
        .reduce((acc, v) => acc.add(v), new THREE.Vector3())
        .multiplyScalar(1 / activeAngle.plane1Vertices.length);

      const midProj = centerP1.clone().project(camera);
      if (midProj.z < 1) {
        setMeasureBadge2D({
          text: `Góc nhị diện = ${activeAngle.angleDeg}°`,
          x: ((midProj.x + 1) * width) / 2,
          y: ((-midProj.y + 1) * height) / 2,
          visible: true,
        });
      } else {
        setMeasureBadge2D(null);
      }
    } else {
      setMeasureBadge2D(null);
    }

    // Update sticky note pins positions
    if (notes && notes.length > 0) {
      const pins: any[] = [];
      notes.forEach((n) => {
        let anchor3D: THREE.Vector3 | null = null;
        if (n.targetType === 'vertex') {
          const v = data.geometry_3d.vertices.find((vert) => vert.id === n.targetId);
          if (v) anchor3D = mathToThreeCoord(v.coord);
        } else {
          const parts = n.targetId.split('-');
          const s = parts[0];
          const e = parts[1];
          const v1 = data.geometry_3d.vertices.find((vert) => vert.id === s);
          const v2 = data.geometry_3d.vertices.find((vert) => vert.id === e);
          if (v1 && v2) {
            const p1 = mathToThreeCoord(v1.coord);
            const p2 = mathToThreeCoord(v2.coord);
            anchor3D = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
          }
        }
        if (anchor3D) {
          const clone = anchor3D.clone();
          clone.y += 0.28;
          clone.project(camera);
          pins.push({
            id: n.id,
            targetType: n.targetType,
            targetId: n.targetId,
            targetLabel: n.targetLabel,
            content: n.content,
            color: n.color,
            x: ((clone.x + 1) * width) / 2,
            y: ((-clone.y + 1) * height) / 2,
            visible: clone.z < 1,
          });
        }
      });
      setNotePins2D(pins);
    } else {
      setNotePins2D([]);
    }
  }, [data, activeDistance, activeAngle, notes]);

  // Build the 3D scene geometry according to data and active settings
  const buildGeometryScene = useCallback(() => {
    if (!sceneRef.current || !modelGroupRef.current) return;
    const group = modelGroupRef.current;

    // Dispose old children
    while (group.children.length > 0) {
      const child = group.children[0] as any;
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((m: any) => m.dispose());
        else child.material.dispose();
      }
      group.remove(child);
    }

    const { vertices, edges, faces, right_angles } = data.geometry_3d;
    const coordsMap = new Map<string, THREE.Vector3>();

    // 1. Build Vertices & Vertex Points
    vertices.forEach((v) => {
      const v3 = mathToThreeCoord(v.coord);
      coordsMap.set(v.id, v3);

      const isBaseVertex = v.coord[2] === 0;
      const isHeightVertex = v.coord[2] > 0 || v.isAltitudeFoot;
      let shouldShow = true;
      if (constructionStep === 1 && !isBaseVertex) shouldShow = false;
      if (constructionStep === 2 && !isBaseVertex && !isHeightVertex) shouldShow = false;

      if (!shouldShow) return;

      const isSelected = selectedVertexId === v.id;
      const isDistanceEndpoint =
        activeDistance &&
        (activeDistance.vertex1.id === v.id || activeDistance.vertex2.id === v.id);

      const sphereRadius = isDistanceEndpoint ? 0.16 : isSelected ? 0.15 : v.isAltitudeFoot ? 0.12 : 0.09;
      const sphereColor = isDistanceEndpoint
        ? '#f59e0b'
        : isSelected
        ? '#fbbf24'
        : v.isAltitudeFoot
        ? '#ea580c'
        : v.coord[2] > 0
        ? '#ef4444'
        : '#2563eb';

      const sphereGeo = new THREE.SphereGeometry(sphereRadius, 24, 24);
      const sphereMat = new THREE.MeshStandardMaterial({
        color: sphereColor,
        roughness: 0.25,
        metalness: 0.2,
      });
      const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
      sphereMesh.position.copy(v3);
      sphereMesh.userData = { type: 'vertex', data: v };
      group.add(sphereMesh);

      // Halo ring for altitude foot or distance endpoint
      if (v.isAltitudeFoot || isSelected || isDistanceEndpoint) {
        const ringGeo = new THREE.RingGeometry(0.16, 0.24, 32);
        const ringMat = new THREE.MeshBasicMaterial({
          color: isDistanceEndpoint ? 0xf59e0b : isSelected ? 0xfbbf24 : 0xea580c,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.85,
        });
        const ringMesh = new THREE.Mesh(ringGeo, ringMat);
        ringMesh.position.copy(v3);
        ringMesh.rotation.x = Math.PI / 2;
        group.add(ringMesh);
      }
    });

    vertexCoordsMapRef.current = coordsMap;

    // 2. Build Edges (Lines & Tubes)
    edges.forEach((edge) => {
      const p1 = coordsMap.get(edge.start);
      const p2 = coordsMap.get(edge.end);
      if (!p1 || !p2) return;

      const p1MathZ = vertices.find((v) => v.id === edge.start)?.coord[2] ?? 0;
      const p2MathZ = vertices.find((v) => v.id === edge.end)?.coord[2] ?? 0;
      const isBaseEdge = p1MathZ === 0 && p2MathZ === 0;

      if (constructionStep === 1 && !isBaseEdge) return;
      if (constructionStep === 2 && !isBaseEdge && !edge.isAltitude) return;

      const isSelected =
        selectedEdge &&
        ((selectedEdge.start === edge.start && selectedEdge.end === edge.end) ||
          (selectedEdge.start === edge.end && selectedEdge.end === edge.start));

      const isDashed = showDashedSGK ? edge.isDashed : false;
      const defaultColor = isLight ? '#0284c7' : '#38bdf8';
      let edgeColor = isSelected
        ? '#f59e0b'
        : edge.isAltitude
        ? '#dc2626'
        : edge.color || defaultColor;

      if (isLight && (edgeColor === '#38bdf8' || edgeColor === '#38BDF8')) {
        edgeColor = isDashed ? '#475569' : '#0284c7';
      }

      const dir = new THREE.Vector3().subVectors(p2, p1);
      const length = dir.length();
      if (length < 0.001) return;

      if (isDashed) {
        const dashLen = 0.22;
        const gapLen = 0.16;
        const totalUnit = dashLen + gapLen;
        const numDashes = Math.floor(length / totalUnit);
        const dirNorm = dir.clone().normalize();

        for (let i = 0; i <= numDashes; i++) {
          const segStartDist = i * totalUnit;
          if (segStartDist >= length) break;
          const segEndDist = Math.min(segStartDist + dashLen, length);
          const segLen = segEndDist - segStartDist;
          if (segLen <= 0.01) break;

          const segStart = new THREE.Vector3().copy(p1).addScaledVector(dirNorm, segStartDist);
          const segEnd = new THREE.Vector3().copy(p1).addScaledVector(dirNorm, segEndDist);
          const segMid = new THREE.Vector3().addVectors(segStart, segEnd).multiplyScalar(0.5);

          const cylGeo = new THREE.CylinderGeometry(0.024, 0.024, segLen, 8);
          const cylMat = new THREE.MeshBasicMaterial({ color: edgeColor });
          const cylMesh = new THREE.Mesh(cylGeo, cylMat);
          cylMesh.position.copy(segMid);
          cylMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirNorm);
          group.add(cylMesh);
        }
      } else {
        const tubeRadius = edge.isAltitude ? 0.045 : isSelected ? 0.05 : 0.032;
        const cylGeo = new THREE.CylinderGeometry(tubeRadius, tubeRadius, length, 12);
        const cylMat = new THREE.MeshStandardMaterial({
          color: edgeColor,
          roughness: 0.3,
          metalness: 0.15,
        });
        const cylMesh = new THREE.Mesh(cylGeo, cylMat);
        const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        cylMesh.position.copy(midPoint);
        cylMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        cylMesh.userData = { type: 'edge', data: edge };
        group.add(cylMesh);
      }
    });

    // 3. Build Right Angles Markers
    if (showRightAngles && constructionStep >= 3) {
      right_angles.forEach((ra) => {
        const v = coordsMap.get(ra.vertex);
        const arm1 = coordsMap.get(ra.arm1);
        const arm2 = coordsMap.get(ra.arm2);
        if (!v || !arm1 || !arm2) return;

        const size = ra.size || 0.35;
        const { lines, faceVertices } = computeRightAngleLines(v, arm1, arm2, size);

        const markerPoints = [lines[0], lines[1], lines[2]];
        const markerGeo = new THREE.BufferGeometry().setFromPoints(markerPoints);
        const markerMat = new THREE.LineBasicMaterial({
          color: ra.color || '#ea580c',
          linewidth: 2.5,
        });
        const markerLine = new THREE.Line(markerGeo, markerMat);
        group.add(markerLine);

        if (faceVertices && faceVertices.length === 4) {
          const quadGeo = new THREE.BufferGeometry();
          const verticesArr = new Float32Array([
            faceVertices[0].x, faceVertices[0].y, faceVertices[0].z,
            faceVertices[1].x, faceVertices[1].y, faceVertices[1].z,
            faceVertices[2].x, faceVertices[2].y, faceVertices[2].z,

            faceVertices[0].x, faceVertices[0].y, faceVertices[0].z,
            faceVertices[2].x, faceVertices[2].y, faceVertices[2].z,
            faceVertices[3].x, faceVertices[3].y, faceVertices[3].z,
          ]);
          quadGeo.setAttribute('position', new THREE.BufferAttribute(verticesArr, 3));
          quadGeo.computeVertexNormals();

          const quadMat = new THREE.MeshBasicMaterial({
            color: ra.color || '#ea580c',
            transparent: true,
            opacity: 0.28,
            side: THREE.DoubleSide,
          });
          const quadMesh = new THREE.Mesh(quadGeo, quadMat);
          group.add(quadMesh);
        }
      });
    }

    // 4. Build Faces (Translucent Auxiliary / Section Planes)
    if (showFaces && constructionStep >= 2) {
      faces.forEach((face) => {
        const faceVertices3D = face.vertices
          .map((id) => coordsMap.get(id))
          .filter((v): v is THREE.Vector3 => !!v);

        if (faceVertices3D.length < 3) return;

        const triPositions: number[] = [];
        const v0 = faceVertices3D[0];
        for (let i = 1; i < faceVertices3D.length - 1; i++) {
          const v1 = faceVertices3D[i];
          const v2 = faceVertices3D[i + 1];
          triPositions.push(v0.x, v0.y, v0.z);
          triPositions.push(v1.x, v1.y, v1.z);
          triPositions.push(v2.x, v2.y, v2.z);
        }

        const faceGeo = new THREE.BufferGeometry();
        faceGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(triPositions), 3));
        faceGeo.computeVertexNormals();

        const isFaceSelected = selectedFaceName === face.name;
        const isDihedralPlane1 = activeAngle && activeAngle.plane1Name === face.name;
        const isDihedralPlane2 = activeAngle && activeAngle.plane2Name === face.name;

        const faceColor = isDihedralPlane1
          ? '#10b981' // Green for Plane 1
          : isDihedralPlane2
          ? '#d946ef' // Purple/Pink for Plane 2
          : isFaceSelected
          ? '#f59e0b'
          : face.color || '#0284c7';

        const faceOpacity = isDihedralPlane1 || isDihedralPlane2 ? 0.45 : isFaceSelected ? 0.5 : face.opacity || 0.25;

        const faceMat = new THREE.MeshStandardMaterial({
          color: faceColor,
          transparent: true,
          opacity: faceOpacity,
          side: THREE.DoubleSide,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -1,
          polygonOffsetUnits: -1,
        });

        const faceMesh = new THREE.Mesh(faceGeo, faceMat);
        faceMesh.userData = { type: 'face', data: face };
        group.add(faceMesh);
      });
    }

    // 5. Active Distance Measurement 3D Graphic (Glowing tape & endpoints)
    if (activeDistance) {
      const p1 = mathToThreeCoord(activeDistance.vertex1.coord);
      const p2 = mathToThreeCoord(activeDistance.vertex2.coord);
      const dir = new THREE.Vector3().subVectors(p2, p1);
      const len = dir.length();

      if (len > 0.01) {
        // Glowing measurement cylinder
        const measureCylGeo = new THREE.CylinderGeometry(0.05, 0.05, len, 16);
        const measureCylMat = new THREE.MeshStandardMaterial({
          color: 0xf59e0b,
          emissive: 0xd97706,
          emissiveIntensity: 0.6,
          roughness: 0.2,
        });
        const measureCyl = new THREE.Mesh(measureCylGeo, measureCylMat);
        const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        measureCyl.position.copy(mid);
        measureCyl.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
        group.add(measureCyl);
      }
    }

    // 6. Active Dihedral Angle Normal Vectors
    if (activeAngle) {
      // Calculate centers of plane 1 and plane 2
      const center1 = activeAngle.plane1Vertices
        .map((v) => mathToThreeCoord(v.coord))
        .reduce((acc, v) => acc.add(v), new THREE.Vector3())
        .multiplyScalar(1 / activeAngle.plane1Vertices.length);

      const center2 = activeAngle.plane2Vertices
        .map((v) => mathToThreeCoord(v.coord))
        .reduce((acc, v) => acc.add(v), new THREE.Vector3())
        .multiplyScalar(1 / activeAngle.plane2Vertices.length);

      // Normal 1 arrow
      const n1Dir = mathToThreeCoord(activeAngle.normal1).normalize();
      const arrow1 = new THREE.ArrowHelper(n1Dir, center1, 1.8, 0x10b981, 0.35, 0.2);
      group.add(arrow1);

      // Normal 2 arrow
      const n2Dir = mathToThreeCoord(activeAngle.normal2).normalize();
      const arrow2 = new THREE.ArrowHelper(n2Dir, center2, 1.8, 0xd946ef, 0.35, 0.2);
      group.add(arrow2);
    }

    updateLabels();
  }, [
    data,
    constructionStep,
    selectedVertexId,
    selectedEdge,
    selectedFaceName,
    activeDistance,
    activeAngle,
    showDashedSGK,
    showRightAngles,
    showFaces,
    updateLabels,
    isLight,
  ]);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 550;

    const isSoftwareGl = checkIsSoftwareGl();

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);
    sceneRef.current = scene;

    const presetCam = data.geometry_3d.camera_preset.initial_position;
    const presetLookAt = data.geometry_3d.camera_preset.look_at;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    const camPos3D = mathToThreeCoord(presetCam);
    camera.position.set(camPos3D.x, camPos3D.y, camPos3D.z);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: true,
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    const lookAt3D = mathToThreeCoord(presetLookAt);
    controls.target.set(lookAt3D.x, lookAt3D.y, lookAt3D.z);
    controls.maxDistance = 30;
    controls.minDistance = 2;
    controlsRef.current = controls;

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    const keyLight = new THREE.DirectionalLight(0xfff3e0, 2.0);
    keyLight.position.set(8, 14, 10);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x93c5fd, 1.2);
    fillLight.position.set(-10, 6, -8);
    scene.add(fillLight);

    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xffffff : 0x38bdf8,
      isLight ? 0x94a3b8 : 0x1e293b,
      isLight ? 1.4 : 1.2
    );
    scene.add(hemiLight);
    hemiLightRef.current = hemiLight;

    const gridGroup = new THREE.Group();
    const gridHelper = new THREE.GridHelper(
      10,
      10,
      isLight ? 0x0284c7 : 0x3b82f6,
      isLight ? 0xcbd5e1 : 0x1e293b
    );
    gridHelper.position.y = 0;
    gridGroup.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(3.5);
    axesHelper.position.set(0, 0.01, 0);
    gridGroup.add(axesHelper);
    scene.add(gridGroup);
    gridGroupRef.current = gridGroup;

    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    let isMounted = true;
    const animate = () => {
      if (!isMounted) return;
      controls.update();
      renderer.render(scene, camera);
      updateLabels();
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const newW = container.clientWidth;
      const newH = container.clientHeight;
      camera.aspect = newW / newH;
      camera.updateProjectionMatrix();
      renderer.setSize(newW, newH);
      updateLabels();
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(container);

    // Raycasting for interactive click on vertex or edge
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let pointerDownPos = { x: 0, y: 0 };

    const handlePointerDown = (e: MouseEvent) => {
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: MouseEvent) => {
      const dx = Math.abs(e.clientX - pointerDownPos.x);
      const dy = Math.abs(e.clientY - pointerDownPos.y);
      if (dx > 5 || dy > 5) return; // User dragged/orbited the scene

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(modelGroup.children, false);

      if (intersects.length > 0) {
        for (const hit of intersects) {
          const ud = hit.object.userData;
          if (ud && ud.type === 'vertex') {
            onSelectVertexRef.current?.(ud.data);
            onOpenNoteForTargetRef.current?.('vertex', ud.data.id);
            break;
          } else if (ud && ud.type === 'edge') {
            onSelectEdgeRef.current?.(ud.data);
            const edgeId = `${ud.data.start}-${ud.data.end}`;
            onOpenNoteForTargetRef.current?.('edge', edgeId);
            break;
          }
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

    return () => {
      isMounted = false;
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      cancelAnimationFrame(animationFrameIdRef.current);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement);
      }
    };
  }, [data.geometry_3d.camera_preset, updateLabels]);

  useEffect(() => {
    buildGeometryScene();
  }, [buildGeometryScene]);

  useEffect(() => {
    if (gridGroupRef.current) {
      gridGroupRef.current.visible = showGrid;
    }
  }, [showGrid]);

  // Dynamically update Three.js scene colors when light/dark theme switches
  useEffect(() => {
    if (sceneRef.current) {
      if (!isArActive) {
        sceneRef.current.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);
      } else {
        sceneRef.current.background = null;
      }
    }
    if (rendererRef.current) {
      if (!isArActive) {
        rendererRef.current.setClearColor(0x000000, 1);
      } else {
        rendererRef.current.setClearColor(0x000000, 0);
      }
    }
    if (hemiLightRef.current) {
      hemiLightRef.current.color.setHex(isLight ? 0xffffff : 0x38bdf8);
      hemiLightRef.current.groundColor.setHex(isLight ? 0x94a3b8 : 0x1e293b);
      hemiLightRef.current.intensity = isLight ? 1.4 : 1.2;
    }
    if (gridGroupRef.current) {
      gridGroupRef.current.clear();
      const newGrid = new THREE.GridHelper(
        10,
        10,
        isLight ? 0x0284c7 : 0x3b82f6,
        isLight ? 0xcbd5e1 : 0x1e293b
      );
      newGrid.position.y = 0;
      gridGroupRef.current.add(newGrid);
      const axesHelper = new THREE.AxesHelper(3.5);
      axesHelper.position.set(0, 0.01, 0);
      gridGroupRef.current.add(axesHelper);
      gridGroupRef.current.visible = showGrid && !isArActive;
    }
  }, [isLight, showGrid, isArActive]);

  // AR Camera Stream Lifecycle Effect
  useEffect(() => {
    if (!isArActive) {
      // Stop and clean up existing video tracks
      if (arStreamRef.current) {
        arStreamRef.current.getTracks().forEach((track) => track.stop());
        arStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      setArError(null);
      setIsArLoading(false);

      if (sceneRef.current) {
        sceneRef.current.background = new THREE.Color(isLight ? 0xf8fafc : 0x090d16);
      }
      if (rendererRef.current) {
        rendererRef.current.setClearColor(0x000000, 1);
      }
      if (modelGroupRef.current) {
        modelGroupRef.current.scale.set(1, 1, 1);
        modelGroupRef.current.position.set(0, 0, 0);
        modelGroupRef.current.rotation.set(0, 0, 0);
      }
      return;
    }

    // AR Mode turned ON: Make Three.js canvas transparent and request camera
    let isCancelled = false;
    setIsArLoading(true);
    setArError(null);

    if (sceneRef.current) {
      sceneRef.current.background = null;
    }
    if (rendererRef.current) {
      rendererRef.current.setClearColor(0x000000, 0);
    }

    const startCamera = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Trình duyệt không hỗ trợ API Camera thực tế ảo (getUserMedia).');
        }

        if (arStreamRef.current) {
          arStreamRef.current.getTracks().forEach((track) => track.stop());
          arStreamRef.current = null;
        }

        let stream: MediaStream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: arFacing },
              width: { ideal: 1920 },
              height: { ideal: 1080 },
            },
            audio: false,
          });
        } catch {
          // Fallback to basic video constraint if ideal facingMode fails
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        arStreamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch((e) => console.warn('Camera video play error:', e));
          };
        }
        setIsArLoading(false);
      } catch (err: any) {
        if (isCancelled) return;
        console.error('AR Camera error:', err);
        let msg = 'Không thể mở Camera thực tế ảo.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          msg = 'Quyền truy cập Camera bị từ chối. Vui lòng cho phép quyền Camera trên thanh địa chỉ trình duyệt để kích hoạt chế độ AR.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          msg = 'Không tìm thấy thiết bị Camera trên máy tính hoặc điện thoại của bạn.';
        } else if (err.message) {
          msg = err.message;
        }
        setArError(msg);
        setIsArLoading(false);
      }
    };

    startCamera();

    return () => {
      isCancelled = true;
      if (arStreamRef.current) {
        arStreamRef.current.getTracks().forEach((track) => track.stop());
        arStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isArActive, arFacing, isLight]);

  // Adjust model group position, scale, and rotation in AR mode
  useEffect(() => {
    if (!modelGroupRef.current) return;
    if (isArActive) {
      modelGroupRef.current.scale.setScalar(arScale);
      modelGroupRef.current.position.set(0, arElevation, 0);
      modelGroupRef.current.rotation.y = (arRotationY * Math.PI) / 180;
    } else {
      modelGroupRef.current.scale.set(1, 1, 1);
      modelGroupRef.current.position.set(0, 0, 0);
      modelGroupRef.current.rotation.set(0, 0, 0);
    }
    updateLabels();
  }, [isArActive, arScale, arElevation, arRotationY, updateLabels]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotating;
      controlsRef.current.autoRotateSpeed = autoRotateSpeed;
    }
  }, [isAutoRotating, autoRotateSpeed]);

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
    }, 60);
    return () => clearTimeout(timer);
  }, [isDualViewActive, splitRatio]);

  useEffect(() => {
    if (!isPlayingSteps) return;
    const interval = setInterval(() => {
      setConstructionStep((prev) => {
        if (prev >= 4) {
          setIsPlayingSteps(false);
          return 4;
        }
        return prev + 1;
      });
    }, 2400);

    return () => clearInterval(interval);
  }, [isPlayingSteps]);

  const setCameraView = (view: 'sgk' | 'top' | 'front' | 'side') => {
    if (!cameraRef.current || !controlsRef.current) return;
    const camera = cameraRef.current;
    const controls = controlsRef.current;
    setActiveViewName(view);

    const lookAt3D = mathToThreeCoord(data.geometry_3d.camera_preset.look_at);
    controls.target.set(lookAt3D.x, lookAt3D.y, lookAt3D.z);

    if (view === 'sgk') {
      const pos = mathToThreeCoord(data.geometry_3d.camera_preset.initial_position);
      camera.position.set(pos.x, pos.y, pos.z);
    } else if (view === 'top') {
      camera.position.set(lookAt3D.x + 0.01, 12, lookAt3D.z);
    } else if (view === 'front') {
      camera.position.set(lookAt3D.x, lookAt3D.y, 11);
    } else if (view === 'side') {
      camera.position.set(11, lookAt3D.y, lookAt3D.z);
    }

    camera.lookAt(lookAt3D);
    controls.update();
  };

  const camAnimationIdRef = useRef<number | null>(null);

  const flyCameraTo = useCallback(
    (targetLookAt: THREE.Vector3, targetCamPos: THREE.Vector3, durationMs = 1000) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const camera = cameraRef.current;
      const controls = controlsRef.current;

      if (camAnimationIdRef.current) {
        cancelAnimationFrame(camAnimationIdRef.current);
        camAnimationIdRef.current = null;
      }

      const startLookAt = controls.target.clone();
      const startCamPos = camera.position.clone();
      const startTime = performance.now();

      const animateFrame = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / durationMs);
        const ease =
          progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;

        controls.target.lerpVectors(startLookAt, targetLookAt, ease);
        camera.position.lerpVectors(startCamPos, targetCamPos, ease);
        camera.lookAt(controls.target);
        controls.update();
        updateLabels();

        if (progress < 1) {
          camAnimationIdRef.current = requestAnimationFrame(animateFrame);
        } else {
          camAnimationIdRef.current = null;
        }
      };

      camAnimationIdRef.current = requestAnimationFrame(animateFrame);
    },
    [updateLabels]
  );

  useEffect(() => {
    return () => {
      if (camAnimationIdRef.current) {
        cancelAnimationFrame(camAnimationIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!activeFocusTarget) return;
    const { type, id, preset } = activeFocusTarget;

    if (preset && preset !== 'custom') {
      setCameraView(preset as any);
      return;
    }

    if (type === 'overview') {
      const lookAt = mathToThreeCoord(data.geometry_3d.camera_preset.look_at);
      const camPos = mathToThreeCoord(data.geometry_3d.camera_preset.initial_position);
      flyCameraTo(lookAt, camPos, 1100);
      return;
    }

    if (type === 'vertex' && id) {
      const v = data.geometry_3d.vertices.find((item) => item.id === id);
      if (v) {
        const v3 = mathToThreeCoord(v.coord);
        const camPos = v3.clone().add(new THREE.Vector3(4.2, 3.2, 4.2));
        flyCameraTo(v3, camPos, 1000);
      }
      return;
    }

    if (type === 'edge' && id) {
      const parts = id.split('-');
      const v1 = data.geometry_3d.vertices.find((item) => item.id === parts[0]);
      const v2 = data.geometry_3d.vertices.find((item) => item.id === parts[1]);
      if (v1 && v2) {
        const p1 = mathToThreeCoord(v1.coord);
        const p2 = mathToThreeCoord(v2.coord);
        const mid = p1.clone().add(p2).multiplyScalar(0.5);
        const camPos = mid.clone().add(new THREE.Vector3(4.5, 3.5, 4.5));
        flyCameraTo(mid, camPos, 1000);
      }
      return;
    }

    if (type === 'face' && id) {
      const face = data.geometry_3d.faces.find((f) => f.name === id);
      if (face && face.vertices.length > 0) {
        const center = face.vertices
          .map((vid) => data.geometry_3d.vertices.find((v) => v.id === vid))
          .filter(Boolean)
          .map((v) => mathToThreeCoord(v!.coord))
          .reduce((acc, v) => acc.add(v), new THREE.Vector3())
          .multiplyScalar(1 / face.vertices.length);
        const camPos = center.clone().add(new THREE.Vector3(4.5, 3.5, 4.5));
        flyCameraTo(center, camPos, 1000);
      }
      return;
    }
  }, [activeFocusTarget, data, flyCameraTo]);

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.enabled = !isDrawingCapturing;
    }
  }, [isDrawingCapturing]);

  const renderStrokesToCanvas = (
    ctx: CanvasRenderingContext2D,
    strokes: DrawStroke[],
    scaleX = 1,
    scaleY = 1
  ) => {
    strokes.forEach((stroke) => {
      if (stroke.points.length === 0) return;
      ctx.save();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width * scaleX;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      if (stroke.tool === 'dashed') {
        ctx.setLineDash([9 * scaleX, 6 * scaleX]);
      } else if (stroke.tool === 'highlighter') {
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = stroke.width * 3.5 * scaleX;
      }

      if (stroke.tool === 'line' || stroke.tool === 'arrow') {
        const p1 = stroke.points[0];
        const p2 = stroke.points[stroke.points.length - 1];
        ctx.beginPath();
        ctx.moveTo(p1.x * scaleX, p1.y * scaleY);
        ctx.lineTo(p2.x * scaleX, p2.y * scaleY);
        ctx.stroke();

        if (stroke.tool === 'arrow') {
          const angle = Math.atan2((p2.y - p1.y) * scaleY, (p2.x - p1.x) * scaleX);
          const arrowLen = 14 * scaleX;
          ctx.beginPath();
          ctx.moveTo(p2.x * scaleX, p2.y * scaleY);
          ctx.lineTo(
            p2.x * scaleX - arrowLen * Math.cos(angle - Math.PI / 6),
            p2.y * scaleY - arrowLen * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            p2.x * scaleX - arrowLen * Math.cos(angle + Math.PI / 6),
            p2.y * scaleY - arrowLen * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = stroke.color;
          ctx.fill();
        }
      } else {
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x * scaleX, stroke.points[0].y * scaleY);
        for (let i = 1; i < stroke.points.length - 1; i++) {
          const xc = ((stroke.points[i].x + stroke.points[i + 1].x) / 2) * scaleX;
          const yc = ((stroke.points[i].y + stroke.points[i + 1].y) / 2) * scaleY;
          ctx.quadraticCurveTo(stroke.points[i].x * scaleX, stroke.points[i].y * scaleY, xc, yc);
        }
        const last = stroke.points[stroke.points.length - 1];
        ctx.lineTo(last.x * scaleX, last.y * scaleY);
        ctx.stroke();
      }
      ctx.restore();
    });
  };

  const handleExportSnapshot = () => {
    if (isArActive) {
      handleArSnapshot();
      return;
    }
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    const canvas = document.createElement('canvas');
    canvas.width = rendererRef.current.domElement.width;
    canvas.height = rendererRef.current.domElement.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw WebGL 3D rendered scene
    ctx.drawImage(rendererRef.current.domElement, 0, 0);

    // 2. Draw teacher's freehand lines & auxiliary annotations
    if (drawnStrokesRef.current && drawnStrokesRef.current.length > 0) {
      const clientW = mountRef.current?.clientWidth || canvas.width;
      const clientH = mountRef.current?.clientHeight || canvas.height;
      renderStrokesToCanvas(ctx, drawnStrokesRef.current, canvas.width / clientW, canvas.height / clientH);
    }

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `hinh_hoc_khong_gian_${data.problem_analysis.shape_type.replace(/\s+/g, '_')}.png`;
    link.href = dataURL;
    link.click();
  };

  const handleArSnapshot = () => {
    if (!videoRef.current || !rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    const video = videoRef.current;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const scene = sceneRef.current;

    // Render transparent 3D scene frame
    renderer.render(scene, camera);

    const canvas = document.createElement('canvas');
    const w = video.videoWidth || renderer.domElement.width || 1280;
    const h = video.videoHeight || renderer.domElement.height || 720;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw real-world camera video frame
    try {
      ctx.drawImage(video, 0, 0, w, h);
    } catch {
      // ignore cross-origin if any
    }

    // 2. Draw 3D WebGL geometry overlay on top
    ctx.drawImage(renderer.domElement, 0, 0, w, h);

    // 3. Draw teacher's freehand annotations on top
    if (drawnStrokesRef.current && drawnStrokesRef.current.length > 0) {
      const clientW = mountRef.current?.clientWidth || w;
      const clientH = mountRef.current?.clientHeight || h;
      renderStrokesToCanvas(ctx, drawnStrokesRef.current, w / clientW, h / clientH);
    }

    // 4. Draw high-school geometry watermark
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.beginPath();
    ctx.roundRect(16, h - 50, 390, 34, 8);
    ctx.fill();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`📐 AR 3D: ${data.problem_analysis.shape_type} • GDPT 2018`, 28, h - 28);

    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `AR_${data.problem_analysis.shape_type.replace(/\s+/g, '_')}_${Date.now()}.png`;
    link.href = dataURL;
    link.click();
  };

  const getSnapshotDataUrl = useCallback((): string | null => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
    rendererRef.current.render(sceneRef.current, cameraRef.current);

    const canvas = document.createElement('canvas');
    canvas.width = rendererRef.current.domElement.width;
    canvas.height = rendererRef.current.domElement.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(rendererRef.current.domElement, 0, 0);

    if (drawnStrokesRef.current && drawnStrokesRef.current.length > 0) {
      const clientW = mountRef.current?.clientWidth || canvas.width;
      const clientH = mountRef.current?.clientHeight || canvas.height;
      renderStrokesToCanvas(ctx, drawnStrokesRef.current, canvas.width / clientW, canvas.height / clientH);
    }

    return canvas.toDataURL('image/png');
  }, []);

  useEffect(() => {
    if (registerGetSnapshot) {
      registerGetSnapshot(getSnapshotDataUrl);
    }
  }, [registerGetSnapshot, getSnapshotDataUrl]);

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border shadow-2xl transition-all duration-300 ${
        isLight ? 'border-slate-300 bg-slate-50' : 'border-slate-800 bg-slate-950'
      } ${isFullscreen || isPresentationMode || isArActive ? 'fixed inset-0 z-50 rounded-none' : isDualViewActive ? 'h-[680px]' : 'h-[620px]'}`}
    >
      <div className="w-full h-full flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Pane: 3D Perspective WebGL Viewport */}
        <div
          className={`relative h-full transition-all duration-300 overflow-hidden ${
            isDualViewActive
              ? splitRatio === '60-40'
                ? 'w-full md:w-[60%]'
                : splitRatio === '40-60'
                ? 'w-full md:w-[40%]'
                : 'w-full md:w-1/2'
              : 'w-full'
          }`}
        >
      {/* Real-World Video Feed for AR Passthrough */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 pointer-events-none ${
          isArActive ? 'opacity-100 z-0' : 'opacity-0 -z-10'
        }`}
      />

      {/* 3D WebGL Canvas Container */}
      <div ref={mountRef} className="relative z-10 w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Teacher Freehand Drawing Overlay */}
      <DrawingCanvasOverlay
        isActive={isDrawingActive}
        onToggleActive={handleToggleDrawing}
        isLight={isLight}
        onDrawingStateChange={(isCapturing) => setIsDrawingCapturing(isCapturing)}
        onStrokesChange={(strokes) => {
          drawnStrokesRef.current = strokes;
        }}
      />

      {/* 2D HTML Labels for Vertices */}
      {showLabels && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {vertexLabels2D.map((lbl) => {
            if (!lbl.visible) return null;
            const isSelected = selectedVertexId === lbl.id;
            const isDistanceEndpoint =
              activeDistance &&
              (activeDistance.vertex1.id === lbl.id || activeDistance.vertex2.id === lbl.id);

            return (
              <div
                key={lbl.id}
                style={{
                  transform: `translate(${lbl.x}px, ${lbl.y}px)`,
                  position: 'absolute',
                  left: 0,
                  top: 0,
                }}
                className="-translate-x-1/2 -translate-y-7 pointer-events-auto transition-transform"
              >
                {(() => {
                  const hasNote = notes && notes.some((n) => n.targetType === 'vertex' && n.targetId === lbl.id);
                  return (
                    <button
                      type="button"
                      onClick={() => {
                        const vertex = data.geometry_3d.vertices.find((v) => v.id === lbl.id);
                        if (onSelectVertex && vertex) onSelectVertex(vertex);
                        if (onOpenNoteForTarget) onOpenNoteForTarget('vertex', lbl.id);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-mono font-bold tracking-tight shadow-md backdrop-blur-md transition-all cursor-pointer ${
                        isDistanceEndpoint
                          ? 'bg-amber-500 text-slate-950 scale-125 ring-2 ring-amber-300 shadow-amber-500/50'
                          : isSelected
                          ? 'bg-amber-400 text-slate-950 scale-125 ring-2 ring-amber-300 shadow-amber-500/50'
                          : isLight
                          ? 'bg-white/95 text-cyan-950 border-2 border-cyan-600 shadow-md ring-1 ring-cyan-500/20 hover:bg-cyan-50 hover:border-cyan-700'
                          : 'bg-slate-900/90 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/20 hover:text-white'
                      }`}
                      title={`Đỉnh ${lbl.label}: Click để xem tọa độ & ghi chú`}
                    >
                      <span>{lbl.label}</span>
                      {hasNote && <Pin className="w-2.5 h-2.5 text-amber-500" />}
                    </button>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Floating 3D Sticky Note Badges */}
      {notePins2D.map((pin) => {
        if (!pin.visible) return null;
        return (
          <div
            key={pin.id}
            style={{
              transform: `translate(${pin.x}px, ${pin.y}px)`,
              position: 'absolute',
              left: 0,
              top: 0,
            }}
            className="-translate-x-1/2 -translate-y-8 pointer-events-auto z-20 group"
          >
            <button
              type="button"
              onClick={() => onOpenNoteForTarget?.(pin.targetType, pin.targetId)}
              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-[10px] shadow-lg border border-amber-200 transition-transform hover:scale-110 cursor-pointer"
              title={`Ghi chú cho ${pin.targetLabel}: ${pin.content}`}
            >
              <Pin className="w-2.5 h-2.5 text-amber-900" />
              <span className="max-w-[100px] truncate">{pin.targetLabel}</span>
            </button>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-48 p-2 rounded-lg bg-slate-900/95 text-slate-200 text-[11px] shadow-2xl border border-amber-500/40 pointer-events-none z-30">
              <span className="font-bold text-amber-400 block mb-0.5">📌 {pin.targetLabel}</span>
              <p className="line-clamp-3 leading-snug">{pin.content}</p>
            </div>
          </div>
        );
      })}

      {/* Floating 3D Measurement Badge */}
      {measureBadge2D && measureBadge2D.visible && (
        <div
          style={{
            transform: `translate(${measureBadge2D.x}px, ${measureBadge2D.y}px)`,
            position: 'absolute',
            left: 0,
            top: 0,
          }}
          className="-translate-x-1/2 -translate-y-10 pointer-events-none z-20 animate-in fade-in duration-150"
        >
          <div className="px-3 py-1.5 rounded-xl bg-amber-500/95 text-slate-950 font-bold text-xs shadow-xl border border-amber-300 flex items-center gap-1.5 whitespace-nowrap">
            <Ruler className="w-3.5 h-3.5" />
            <span>{measureBadge2D.text}</span>
          </div>
        </div>
      )}

      {/* Top Header Badge & Quick Action Strip */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
        <div className={`pointer-events-auto flex items-center gap-2 backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow-lg ${
          isLight ? 'bg-white/95 border-slate-200 text-slate-900 shadow-md' : 'bg-slate-900/90 border-slate-700/60 text-slate-100'
        } ${isPresentationMode ? 'border-purple-500/50 shadow-purple-500/10' : ''}`}>
          <div className={`w-2.5 h-2.5 rounded-full ${isPresentationMode ? 'bg-purple-400 animate-pulse' : 'bg-cyan-500'}`} />
          <span className={`text-xs font-semibold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
            {data.problem_analysis.shape_type || 'Mô hình 3D'}
          </span>
          {isPresentationMode && (
            <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/30">
              CHẾ ĐỘ TRÌNH CHIẾU
            </span>
          )}
          <span className={isLight ? 'text-slate-300' : 'text-slate-600'}>|</span>
          <span className={`text-[11px] ${isLight ? 'text-slate-500 font-medium' : 'text-slate-400'}`}>
            {data.geometry_3d.vertices.length} Đỉnh, {data.geometry_3d.edges.length} Cạnh
          </span>
        </div>

        <div className={`pointer-events-auto flex items-center gap-1.5 backdrop-blur-md p-1.5 rounded-full border shadow-lg ${
          isLight ? 'bg-white/95 border-slate-200 text-slate-700 shadow-md' : 'bg-slate-900/90 border-slate-700/60 shadow-lg text-slate-400'
        }`}>
          {/* Exit Presentation Mode Button if in presentation mode */}
          {isPresentationMode && onTogglePresentationMode ? (
            <button
              type="button"
              onClick={onTogglePresentationMode}
              className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg transition cursor-pointer"
              title="Thoát chế độ trình chiếu (Phím tắt: Esc)"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Thoát Trình Chiếu (Esc)</span>
            </button>
          ) : (
            onTogglePresentationMode && (
              <button
                type="button"
                onClick={onTogglePresentationMode}
                className="p-1.5 text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-full transition-colors cursor-pointer"
                title="Bật Chế độ Trình chiếu toàn màn hình (Presentation Mode)"
              >
                <Presentation className="w-4 h-4" />
              </button>
            )
          )}

          {onOpenNotesManager && (
            <button
              type="button"
              onClick={onOpenNotesManager}
              className={`p-1.5 rounded-full transition-colors cursor-pointer relative ${
                notes && notes.length > 0
                  ? 'bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/40'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title={`Xem & quản lý ghi chú học tập (${notes?.length || 0})`}
            >
              <StickyNote className="w-4 h-4" />
              {notes && notes.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-slate-950 font-bold text-[9px] flex items-center justify-center">
                  {notes.length}
                </span>
              )}
            </button>
          )}
          {onOpenMeasurement && (
            <button
              type="button"
              onClick={onOpenMeasurement}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                activeDistance || activeAngle
                  ? 'bg-amber-500 text-slate-950'
                  : isLight ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' : 'text-amber-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Mở công cụ đo khoảng cách & góc giữa 2 mặt phẳng"
            >
              <Ruler className="w-4 h-4" />
            </button>
          )}
          {/* Teacher Freehand Drawing Mode Button */}
          <button
            type="button"
            onClick={handleToggleDrawing}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isDrawingActive
                ? 'bg-indigo-600 text-white ring-2 ring-indigo-300 shadow-indigo-500/25'
                : isLight
                ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
            }`}
            title={isDrawingActive ? 'Tắt chế độ Vẽ tay' : 'Bật chế độ Vẽ tay: Cho phép vẽ đường cao, đường phụ, ghi chú hình học bằng chuột/bút cảm ứng'}
          >
            <Pencil className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDrawingActive ? 'Đang vẽ' : 'Vẽ tay'}</span>
          </button>

          {/* Nút Chế độ xem song song 3D & 2D */}
          <button
            type="button"
            onClick={handleToggleDualView}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isDualViewActive
                ? isLight
                  ? 'bg-teal-600 text-white ring-2 ring-teal-300 shadow-teal-500/25'
                  : 'bg-teal-500 text-slate-950 font-bold ring-2 ring-teal-300 shadow-teal-400/25'
                : isLight
                ? 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
                : 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40'
            }`}
            title={
              isDualViewActive
                ? 'Tắt Chế độ xem song song (trở về xem 3D toàn màn hình)'
                : 'Bật Chế độ xem song song: Hiển thị đồng thời mô hình 3D phối cảnh và hình chiếu 2D phẳng (đứng, bằng, cạnh)'
            }
          >
            <Columns2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isDualViewActive ? 'Đang xem 3D & 2D' : 'Xem song song'}</span>
            <span className="sm:hidden">Song song</span>
          </button>

          {/* Quick Quiz (Quiz Kiểm Tra Nhanh) Button */}
          {onOpenQuiz && (
            <button
              type="button"
              onClick={onOpenQuiz}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isLight
                  ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200'
                  : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
              }`}
              title="Mở Quiz Kiểm Tra Nhanh: Trả lời trắc nghiệm & nhận phản hồi tức thì về mô hình 3D"
            >
              <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Quiz 3D</span>
              <span className="sm:hidden">Quiz</span>
            </button>
          )}

          {/* Voice-Guided Tour (Hướng dẫn bằng giọng nói) Button */}
          {onToggleVoiceTour && (
            <button
              type="button"
              onClick={onToggleVoiceTour}
              className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
                isVoiceTourActive
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white ring-2 ring-purple-300 shadow-purple-500/25 animate-pulse'
                  : isLight
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-purple-500/10'
                  : 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/40 shadow-purple-500/10'
              }`}
              title={
                isVoiceTourActive
                  ? 'Tắt hướng dẫn bằng giọng nói'
                  : 'Bật hướng dẫn bằng giọng nói: Tự động di chuyển camera đến từng đỉnh/cạnh và đọc thuyết minh theo kịch bản'
              }
            >
              <Radio className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isVoiceTourActive ? 'Đang thuyết minh' : 'Thuyết minh'}</span>
              <span className="sm:hidden">Giọng nói</span>
            </button>
          )}

          {/* Augmented Reality (AR) View Mode Toggle Button */}
          <button
            type="button"
            onClick={handleToggleAr}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isArActive
                ? 'bg-rose-500 hover:bg-rose-600 text-white ring-2 ring-rose-300 animate-pulse'
                : isLight
                ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-500/20'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shadow-emerald-500/10'
            }`}
            title={isArActive ? 'Thoát chế độ Thực tế ảo (AR)' : 'Bật Thực tế ảo (AR): Chiếu mô hình 3D lên bàn học qua Camera'}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>{isArActive ? 'Tắt AR' : 'AR'}</span>
          </button>
          <button
            type="button"
            onClick={handleExportSnapshot}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Tải ảnh PNG (dán vào đề thi SGK/Word)"
          >
            <Download className="w-4 h-4" />
          </button>
          {onOpenExport3D && (
            <button
              type="button"
              onClick={onOpenExport3D}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-cyan-700 hover:text-cyan-900 hover:bg-cyan-50' : 'text-cyan-400 hover:text-white hover:bg-slate-800'}`}
              title="Xuất tệp 3D (.OBJ / .STL) để in 3D hoặc mở trong CAD"
            >
              <Printer className="w-4 h-4" />
            </button>
          )}
          {onOpenExportPdf && (
            <button
              type="button"
              onClick={() => {
                const snap = getSnapshotDataUrl();
                onOpenExportPdf(snap);
              }}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-rose-600 hover:text-rose-800 hover:bg-rose-50' : 'text-rose-400 hover:text-white hover:bg-slate-800'}`}
              title="Xuất PDF bài giảng chuyên nghiệp (Giáo án GDPT 2018)"
            >
              <FileText className="w-4 h-4" />
            </button>
          )}
          {/* Nút Tự động xoay mô hình quanh trục thẳng đứng */}
          <button
            type="button"
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isAutoRotating
                ? isLight
                  ? 'bg-cyan-500 text-white ring-2 ring-cyan-300 shadow-cyan-500/25'
                  : 'bg-cyan-500 text-slate-950 font-bold ring-2 ring-cyan-300 shadow-cyan-400/25'
                : isLight
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
            title={
              isAutoRotating
                ? 'Nhấp để dừng tự động xoay mô hình 3D'
                : 'Bật tự động xoay: Mô hình 3D tự động xoay chậm quanh trục thẳng đứng giúp học sinh dễ dàng quan sát mọi góc độ mà không cần kéo chuột'
            }
          >
            <RotateCw
              className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`}
              style={isAutoRotating ? { animationDuration: `${6 / (autoRotateSpeed || 1)}s` } : undefined}
            />
            <span className="hidden sm:inline">{isAutoRotating ? 'Đang tự xoay' : 'Tự động xoay'}</span>
            <span className="sm:hidden">{isAutoRotating ? 'Đang xoay' : 'Tự xoay'}</span>
          </button>
          <button
            type="button"
            onClick={() => setCameraView('sgk')}
            className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title="Đặt lại góc nhìn chuẩn SGK"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          {!isPresentationMode && (
            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
              title={isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Step-by-Step Construction Status Bar (Top Center) */}
      <div className={`absolute top-4 left-1/2 -translate-x-1/2 pointer-events-auto backdrop-blur-md px-3.5 py-1.5 rounded-full border shadow-lg flex items-center gap-2 text-xs ${
        isLight ? 'bg-white/95 border-slate-200 text-slate-700 shadow-md' : 'bg-slate-900/90 border-slate-700/60 shadow-lg text-slate-400'
      }`}>
        <span className={isLight ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium'}>Dựng hình:</span>
        <div className="flex items-center gap-1">
          {[
            { step: 1, label: '1. Đáy' },
            { step: 2, label: '2. Đường cao' },
            { step: 3, label: '3. Cạnh bên' },
            { step: 4, label: '4. Toàn bộ' },
          ].map((item) => (
            <button
              key={item.step}
              type="button"
              onClick={() => setConstructionStep(item.step)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition cursor-pointer ${
                constructionStep === item.step
                  ? 'bg-cyan-600 text-white font-semibold'
                  : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className={`h-3 w-px mx-1 ${isLight ? 'bg-slate-300' : 'bg-slate-700'}`} />
        <button
          type="button"
          onClick={() => setIsPlayingSteps(!isPlayingSteps)}
          className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 p-0.5 rounded cursor-pointer"
          title={isPlayingSteps ? 'Tạm dừng' : 'Tự động phát trình tự dựng hình'}
        >
          {isPlayingSteps ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Ergonomic Collapsible Bottom Control Dock */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-[95%] max-w-[840px] pointer-events-auto transition-transform duration-300 ease-out">
        <div className="flex justify-center mb-1.5">
          <button
            type="button"
            onClick={() => setIsDockCollapsed(!isDockCollapsed)}
            className={`px-3 py-0.5 text-[11px] font-medium tracking-wide uppercase rounded-full shadow-lg backdrop-blur-md cursor-pointer transition-colors border ${
              isLight
                ? 'bg-white/95 text-slate-600 hover:text-slate-900 border-slate-200 shadow-md'
                : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-700/60 shadow-lg'
            }`}
          >
            {isDockCollapsed ? '▴ Hiện bảng điều khiển' : '▾ Ẩn điều khiển (Zen Mode)'}
          </button>
        </div>

        {!isDockCollapsed && (
          <div className={`backdrop-blur-md border rounded-2xl p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 text-xs ${
            isLight ? 'bg-white/95 border-slate-200 text-slate-700' : 'bg-slate-900/95 border-slate-700/70 text-slate-300'
          }`}>
            {/* View presets */}
            <div className="flex items-center gap-1.5">
              <span className={isLight ? 'text-slate-500 font-medium' : 'text-slate-400 font-medium'}>Góc nhìn:</span>
              {[
                { key: 'sgk', label: 'SGK Chuẩn' },
                { key: 'top', label: 'Nhìn Đáy (Oxy)' },
                { key: 'front', label: 'Chiếu đứng' },
                { key: 'side', label: 'Chiếu cạnh' },
              ].map((view) => (
                <button
                  key={view.key}
                  type="button"
                  onClick={() => setCameraView(view.key as any)}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition-colors cursor-pointer ${
                    activeViewName === view.key
                      ? isLight ? 'bg-cyan-100 border-cyan-500 text-cyan-800 font-bold' : 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                      : isLight ? 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200' : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {view.label}
                </button>
              ))}
            </div>

            {/* Display Toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDashedSGK(!showDashedSGK)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  showDashedSGK
                    ? isLight ? 'bg-indigo-100 border-indigo-400 text-indigo-800 font-bold' : 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
                title="Quy ước nét đứt cho cạnh khuất chuẩn SGK Việt Nam"
              >
                <Eye className="w-3.5 h-3.5" />
                Nét đứt SGK
              </button>

              <button
                type="button"
                onClick={() => setShowLabels(!showLabels)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  showLabels
                    ? isLight ? 'bg-cyan-100 border-cyan-400 text-cyan-800 font-bold' : 'bg-cyan-600/30 border-cyan-500 text-cyan-300'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
              >
                Tên đỉnh
              </button>

              <button
                type="button"
                onClick={() => setShowRightAngles(!showRightAngles)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  showRightAngles
                    ? isLight ? 'bg-amber-100 border-amber-400 text-amber-800 font-bold' : 'bg-amber-600/30 border-amber-500 text-amber-300'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
                title="Bật/Tắt ký hiệu góc vuông 3D"
              >
                <Square className="w-3.5 h-3.5" />
                Góc vuông
              </button>

              <button
                type="button"
                onClick={() => setShowFaces(!showFaces)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  showFaces
                    ? isLight ? 'bg-emerald-100 border-emerald-400 text-emerald-800 font-bold' : 'bg-emerald-600/30 border-emerald-500 text-emerald-300'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-800/60 border-slate-700 text-slate-400'
                }`}
                title="Bật/Tắt mặt phẳng phụ & thiết diện"
              >
                <Layers className="w-3.5 h-3.5" />
                Mặt phẳng
              </button>

              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  showGrid
                    ? isLight ? 'bg-slate-200 border-slate-300 text-slate-800 font-bold' : 'bg-slate-700 border-slate-600 text-slate-200'
                    : isLight ? 'bg-slate-100 border-slate-200 text-slate-500' : 'bg-slate-800/60 border-slate-700 text-slate-500'
                }`}
                title="Bật/Tắt lưới tọa độ Oxy"
              >
                Lưới Oxy
              </button>

              {/* Nút Tự động xoay quanh trục thẳng đứng */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setIsAutoRotating(!isAutoRotating)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs transition cursor-pointer ${
                    isAutoRotating
                      ? isLight
                        ? 'bg-cyan-500 text-white border-cyan-600 shadow-sm shadow-cyan-500/30 font-bold'
                        : 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm shadow-cyan-400/30'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                  title="Tự động xoay chậm quanh trục thẳng đứng giúp học sinh dễ dàng quan sát hình khối từ mọi góc độ mà không cần tương tác chuột"
                >
                  <RotateCw
                    className={`w-3.5 h-3.5 ${isAutoRotating ? 'animate-spin' : ''}`}
                    style={isAutoRotating ? { animationDuration: `${6 / (autoRotateSpeed || 1)}s` } : undefined}
                  />
                  <span>{isAutoRotating ? 'Đang tự động xoay' : 'Tự động xoay'}</span>
                </button>

                {isAutoRotating && (
                  <div className={`flex items-center p-0.5 rounded-md border text-[10px] font-bold ${
                    isLight ? 'bg-white border-cyan-300 text-cyan-800 shadow-xs' : 'bg-slate-800 border-cyan-700 text-cyan-300'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setAutoRotateSpeed(0.8)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${autoRotateSpeed === 0.8 ? (isLight ? 'bg-cyan-100 text-cyan-900 font-extrabold' : 'bg-cyan-500/30 text-white font-extrabold') : 'opacity-60 hover:opacity-100'}`}
                      title="Tốc độ xoay chậm (0.8x)"
                    >
                      0.8x
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoRotateSpeed(1.2)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${autoRotateSpeed === 1.2 ? (isLight ? 'bg-cyan-100 text-cyan-900 font-extrabold' : 'bg-cyan-500/30 text-white font-extrabold') : 'opacity-60 hover:opacity-100'}`}
                      title="Tốc độ xoay tiêu chuẩn (1.2x)"
                    >
                      1.2x
                    </button>
                    <button
                      type="button"
                      onClick={() => setAutoRotateSpeed(2.0)}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${autoRotateSpeed === 2.0 ? (isLight ? 'bg-cyan-100 text-cyan-900 font-extrabold' : 'bg-cyan-500/30 text-white font-extrabold') : 'opacity-60 hover:opacity-100'}`}
                      title="Tốc độ xoay nhanh (2.0x)"
                    >
                      2.0x
                    </button>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleToggleDrawing}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer ${
                  isDrawingActive
                    ? 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-500/20'
                    : isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-600 hover:text-indigo-700'
                    : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-indigo-300'
                }`}
                title="Bật/Tắt chế độ Vẽ tay trực tiếp lên mô hình 3D cho giáo viên"
              >
                <Pencil className="w-3.5 h-3.5" />
                <span>{isDrawingActive ? 'Đang vẽ tay' : 'Vẽ tay'}</span>
              </button>

              {/* Nút Chế độ xem song song 3D & 2D */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleToggleDualView}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs transition cursor-pointer ${
                    isDualViewActive
                      ? isLight
                        ? 'bg-teal-600 text-white font-bold border-teal-700 shadow-sm shadow-teal-600/30 ring-1 ring-teal-400'
                        : 'bg-teal-500 text-slate-950 font-bold border-teal-400 shadow-sm shadow-teal-400/30 ring-1 ring-teal-300'
                      : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700 hover:text-teal-700'
                      : 'bg-slate-800/80 hover:bg-slate-700 border-slate-700 text-slate-400 hover:text-teal-300'
                  }`}
                  title="Bật/Tắt Chế độ xem song song: Hiển thị đồng thời mô hình 3D phối cảnh và hình chiếu phẳng 2D (đứng, bằng, cạnh)"
                >
                  <Columns2 className="w-3.5 h-3.5" />
                  <span>{isDualViewActive ? 'Đang xem song song' : 'Xem song song'}</span>
                </button>

                {isDualViewActive && (
                  <div className={`flex items-center p-0.5 rounded-md border text-[10px] font-bold ${
                    isLight ? 'bg-white border-teal-300 text-teal-800 shadow-xs' : 'bg-slate-800 border-teal-700 text-teal-300'
                  }`}>
                    <button
                      type="button"
                      onClick={() => setProjectionType('front')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${projectionType === 'front' ? (isLight ? 'bg-teal-100 text-teal-900 font-extrabold' : 'bg-teal-500/30 text-white font-extrabold') : 'opacity-60 hover:opacity-100'}`}
                      title="Hình chiếu đứng (Oxz)"
                    >
                      Đứng
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectionType('top')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${projectionType === 'top' ? (isLight ? 'bg-teal-100 text-teal-900 font-extrabold' : 'bg-teal-500/30 text-white font-extrabold') : 'opacity-60 hover:opacity-100'}`}
                      title="Hình chiếu bằng (Oxy)"
                    >
                      Bằng
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectionType('side')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${projectionType === 'side' ? (isLight ? 'bg-teal-100 text-teal-900 font-extrabold' : 'bg-teal-500/30 text-white font-extrabold') : 'opacity-60 hover:opacity-100'}`}
                      title="Hình chiếu cạnh (Oyz)"
                    >
                      Cạnh
                    </button>
                    <button
                      type="button"
                      onClick={() => setProjectionType('all3')}
                      className={`px-1.5 py-0.5 rounded cursor-pointer transition ${projectionType === 'all3' ? (isLight ? 'bg-teal-100 text-teal-900 font-extrabold' : 'bg-teal-500/30 text-white font-extrabold') : 'opacity-60 hover:opacity-100'}`}
                      title="Bộ 3 hình chiếu (Tam diện)"
                    >
                      Cả 3
                    </button>
                  </div>
                )}
              </div>

              {/* Nút Mở Quiz Kiểm Tra Nhanh */}
              {onOpenQuiz && (
                <button
                  type="button"
                  onClick={onOpenQuiz}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-semibold text-xs transition cursor-pointer ${
                    isLight
                      ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                      : 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-xs'
                  }`}
                  title="Mở Quiz Kiểm Tra Nhanh: Trả lời trắc nghiệm & nhận phản hồi tức thì về mô hình 3D"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Quiz 3D</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Auto-Rotate Active Floating Overlay Indicator */}
      {isAutoRotating && !isArActive && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-25 pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 text-cyan-300 border border-cyan-500/50 shadow-xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-top-2">
          <RotateCw
            className="w-3.5 h-3.5 animate-spin text-cyan-400"
            style={{ animationDuration: `${6 / (autoRotateSpeed || 1)}s` }}
          />
          <span>Đang tự động xoay quanh trục thẳng đứng</span>
          <span className="text-cyan-400/80 font-mono text-[11px] font-bold">({autoRotateSpeed}x)</span>
          <div className="flex items-center gap-1 border-l border-cyan-700/60 pl-2">
            <button
              type="button"
              onClick={() => setAutoRotateSpeed((s) => (s <= 0.8 ? 1.2 : s <= 1.2 ? 2.0 : 0.8))}
              className="text-[10px] text-cyan-300 hover:text-white bg-cyan-950/80 hover:bg-cyan-800 px-2 py-0.5 rounded border border-cyan-600/40 font-semibold cursor-pointer transition"
              title="Chuyển đổi tốc độ xoay (0.8x / 1.2x / 2.0x)"
            >
              {autoRotateSpeed === 0.8 ? 'Chậm 0.8x' : autoRotateSpeed === 1.2 ? 'Chuẩn 1.2x' : 'Nhanh 2.0x'}
            </button>
            <button
              type="button"
              onClick={() => setIsAutoRotating(false)}
              className="text-[10px] text-slate-300 hover:text-white bg-slate-800 hover:bg-rose-900/80 px-2 py-0.5 rounded border border-slate-700 hover:border-rose-500 font-semibold cursor-pointer transition"
              title="Dừng tự động xoay để giữ góc nhìn hiện tại"
            >
              Dừng ⏸
            </button>
          </div>
        </div>
      )}

      {/* AR Mode Active Top Banner */}
      {isArActive && (
        <div className="absolute top-16 left-4 right-4 z-30 flex items-center justify-between pointer-events-none animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="pointer-events-auto flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 text-white border border-emerald-500/40 shadow-xl backdrop-blur-md text-xs font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
            <span className="text-emerald-400 font-bold">AR CAMERA PASSTHROUGH:</span>
            <span className="hidden sm:inline">Mô hình 3D được chiếu trực tiếp lên không gian thực</span>
          </div>

          <div className="pointer-events-auto flex items-center gap-2">
            {/* Switch Camera Button (Facing mode: Rear / Front) */}
            <button
              type="button"
              onClick={() => setArFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="px-3 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 shadow-xl backdrop-blur-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
              title="Đổi camera sau / camera trước"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">{arFacing === 'environment' ? 'Cam sau' : 'Cam trước'}</span>
            </button>
          </div>
        </div>
      )}

      {/* AR Floating Control Dock */}
      {isArActive && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-slate-900/95 text-white border border-slate-700/80 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-3 duration-200">
          {/* Scale Adjustment */}
          <div className="flex items-center gap-1 border-r border-slate-700/80 pr-2.5">
            <button
              type="button"
              onClick={() => setArScale((s) => Math.max(0.25, +(s - 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Thu nhỏ mô hình AR"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono font-bold text-cyan-400 min-w-[38px] text-center">
              {Math.round(arScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setArScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)))}
              className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Phóng to mô hình AR"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </div>

          {/* Elevation Adjustment (Up/Down) */}
          <div className="flex items-center gap-1 border-r border-slate-700/80 pr-2.5">
            <button
              type="button"
              onClick={() => setArElevation((e) => +(e - 0.3).toFixed(2))}
              className="px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              title="Hạ thấp mô hình xuống sát mặt bàn"
            >
              <MoveVertical className="w-3.5 h-3.5 rotate-180" />
              <span>Hạ</span>
            </button>
            <button
              type="button"
              onClick={() => setArElevation((e) => +(e + 0.3).toFixed(2))}
              className="px-2 py-1 rounded-lg text-[11px] font-bold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center gap-1 transition-colors cursor-pointer"
              title="Nâng cao mô hình"
            >
              <MoveVertical className="w-3.5 h-3.5" />
              <span>Nâng</span>
            </button>
          </div>

          {/* Rotation by 45 deg */}
          <button
            type="button"
            onClick={() => setArRotationY((r) => (r + 45) % 360)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
            title="Xoay mô hình quanh trục đứng 45°"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Reset Position & Scale */}
          <button
            type="button"
            onClick={() => {
              setArScale(1.0);
              setArElevation(0.0);
              setArRotationY(0);
            }}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Đặt lại kích thước và góc xoay gốc"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Capture Combined AR Photo */}
          <button
            type="button"
            onClick={handleArSnapshot}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/25 ml-1 active:scale-95 transition-all cursor-pointer"
            title="Chụp ảnh thực tế kết hợp mô hình 3D"
          >
            <Camera className="w-4 h-4" />
            <span className="hidden sm:inline">Chụp ảnh AR</span>
          </button>
        </div>
      )}
        </div>

        {/* Right Pane: 2D Parallel Orthographic Projection View */}
        {isDualViewActive && (
          <div
            className={`h-full transition-all duration-300 overflow-hidden ${
              splitRatio === '60-40'
                ? 'w-full md:w-[40%]'
                : splitRatio === '40-60'
                ? 'w-full md:w-[60%]'
                : 'w-full md:w-1/2'
            }`}
          >
            <ParallelProjection2DView
              data={data}
              selectedVertexId={selectedVertexId}
              selectedEdge={selectedEdge}
              selectedFaceName={selectedFaceName}
              onSelectVertex={onSelectVertex}
              onSelectEdge={onSelectEdge}
              projectionType={projectionType}
              onChangeProjectionType={setProjectionType}
              isLight={isLight}
              onClose={() => handleToggleDualView()}
              splitRatio={splitRatio}
              onChangeSplitRatio={setSplitRatio}
            />
          </div>
        )}
      </div>

      {/* AR Loading Spinner Overlay */}
      {isArActive && isArLoading && (
        <div className="absolute inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-3">
          <div className="w-12 h-12 rounded-full border-4 border-emerald-500/20 border-t-emerald-500 animate-spin" />
          <p className="text-sm font-semibold">Đang xin quyền & khởi tạo Camera Thực tế ảo (AR)...</p>
          <p className="text-xs text-slate-400 max-w-sm">
            Vui lòng chọn &quot;Cho phép&quot; (Allow) khi trình duyệt yêu cầu quyền truy cập Camera.
          </p>
        </div>
      )}

      {/* AR Camera Error Overlay */}
      {isArActive && arError && (
        <div className="absolute inset-0 z-40 bg-slate-950/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center text-white space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl shadow-xl">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md">
            <h3 className="text-base font-bold text-amber-400">Không thể truy cập Camera</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{arError}</p>
          </div>
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setArFacing((prev) => (prev === 'environment' ? 'user' : 'environment'))}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer"
            >
              Thử lại Camera khác
            </button>
            <button
              type="button"
              onClick={handleToggleAr}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer"
            >
              Đóng AR
            </button>
          </div>
        </div>
      )}

      {/* Voice Tour Floating Controller & Subtitles Widget */}
      {isVoiceTourActive && voiceTourScript && (
        <VoiceTourFloatingWidget
          script={voiceTourScript}
          currentStepIndex={currentVoiceTourIndex}
          isSpeaking={isVoiceTourSpeaking}
          isPaused={isVoiceTourPaused}
          settings={
            voiceTourSettings ?? {
              rate: 1.0,
              pitch: 1.0,
              volume: 1.0,
              autoAdvance: true,
              pauseBetweenSteps: 1.5,
              showCaptions: true,
              highlightIn3D: true,
            }
          }
          isPresentationMode={isPresentationMode}
          isLight={isLight}
          onPlay={onVoiceTourPlay ?? (() => {})}
          onPause={onVoiceTourPause ?? (() => {})}
          onResume={onVoiceTourResume ?? (() => {})}
          onNext={onVoiceTourNext ?? (() => {})}
          onPrev={onVoiceTourPrev ?? (() => {})}
          onSelectStep={onVoiceTourSelectStep ?? (() => {})}
          onUpdateSettings={onVoiceTourUpdateSettings ?? (() => {})}
          onOpenScriptEditor={onOpenVoiceTourEditor ?? (() => {})}
          onClose={onToggleVoiceTour ?? (() => {})}
        />
      )}
    </div>
  );
};
