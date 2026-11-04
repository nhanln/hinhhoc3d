import * as THREE from 'three';
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';
import { SolidGeometryOutput } from '../types/geometry';
import { mathToThreeCoord } from './math3d';

export interface Export3DOptions {
  format: 'obj' | 'stl';
  includeStrutsAndJoints: boolean; // Solid 3D printable cylinders for edges and spheres for vertices
  includeFaces: boolean; // Solid face polygons
  strutRadius?: number; // Thickness of printable wireframe rods (default ~0.08)
  jointRadius?: number; // Size of joint spheres (default ~0.15)
}

/**
 * Builds a clean, watertight 3D printable group from the solid geometry data
 */
export function buildPrintable3DGroup(
  data: SolidGeometryOutput,
  options: { includeStrutsAndJoints: boolean; includeFaces: boolean; strutRadius?: number; jointRadius?: number }
): THREE.Group {
  const exportGroup = new THREE.Group();
  const { vertices, edges, faces } = data.geometry_3d;
  const coordsMap = new Map<string, THREE.Vector3>();

  const strutRadius = options.strutRadius || 0.08;
  const jointRadius = options.jointRadius || 0.16;

  // 1. Build Joint Spheres at Vertices
  vertices.forEach((v) => {
    const v3 = mathToThreeCoord(v.coord);
    coordsMap.set(v.id, v3);

    if (options.includeStrutsAndJoints) {
      const sphereGeo = new THREE.SphereGeometry(jointRadius, 20, 20);
      const sphereMesh = new THREE.Mesh(sphereGeo, new THREE.MeshStandardMaterial());
      sphereMesh.position.copy(v3);
      exportGroup.add(sphereMesh);
    }
  });

  // 2. Build Solid Strut Cylinders along Edges
  if (options.includeStrutsAndJoints) {
    edges.forEach((edge) => {
      const p1 = coordsMap.get(edge.start);
      const p2 = coordsMap.get(edge.end);
      if (!p1 || !p2) return;

      const dir = new THREE.Vector3().subVectors(p2, p1);
      const length = dir.length();
      if (length < 0.001) return;

      const cylGeo = new THREE.CylinderGeometry(strutRadius, strutRadius, length, 16);
      const cylMesh = new THREE.Mesh(cylGeo, new THREE.MeshStandardMaterial());
      const midPoint = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
      cylMesh.position.copy(midPoint);
      cylMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      exportGroup.add(cylMesh);
    });
  }

  // 3. Build Solid Polygonal Faces
  if (options.includeFaces) {
    faces.forEach((face) => {
      const faceVertices3D = face.vertices
        .map((id) => coordsMap.get(id))
        .filter((v): v is THREE.Vector3 => !!v);

      if (faceVertices3D.length < 3) return;

      // Triangulate face using fan triangulation from first vertex
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

      const faceMesh = new THREE.Mesh(faceGeo, new THREE.MeshStandardMaterial({ side: THREE.DoubleSide }));
      exportGroup.add(faceMesh);
    });
  }

  return exportGroup;
}

/**
 * Exports the solid geometry model to .OBJ or .STL file and triggers browser download
 */
export function export3DModel(
  data: SolidGeometryOutput,
  options: Export3DOptions,
  filename?: string
): void {
  const printableGroup = buildPrintable3DGroup(data, {
    includeStrutsAndJoints: options.includeStrutsAndJoints,
    includeFaces: options.includeFaces,
    strutRadius: options.strutRadius,
    jointRadius: options.jointRadius,
  });

  const baseName =
    filename ||
    `mo_hinh_3d_${data.problem_analysis.shape_type.toLowerCase().replace(/[^a-z0-9]/gi, '_')}`;

  if (options.format === 'obj') {
    const exporter = new OBJExporter();
    const result = exporter.parse(printableGroup);
    const blob = new Blob([result], { type: 'text/plain' });
    downloadBlob(blob, `${baseName}.obj`);
  } else if (options.format === 'stl') {
    const exporter = new STLExporter();
    const result = exporter.parse(printableGroup, { binary: true });
    const blob = new Blob([result], { type: 'application/octet-stream' });
    downloadBlob(blob, `${baseName}.stl`);
  }

  // Cleanup geometries
  printableGroup.traverse((child: any) => {
    if (child.geometry) child.geometry.dispose();
  });
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
