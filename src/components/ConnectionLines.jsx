import { useMemo } from 'react';
import * as THREE from 'three';
import useStore from '../store/useStore';

// Create a curved arc between two points on a sphere using proper slerp
function createArc(from, to, segments = 32) {
  const points = [];
  const start = new THREE.Vector3(...from);
  const end = new THREE.Vector3(...to);
  
  // Get the sphere radius (average of the two point distances from center)
  const radius = (start.length() + end.length()) / 2;
  
  // Normalize both points to unit sphere
  const startNorm = start.clone().normalize();
  const endNorm = end.clone().normalize();
  
  // Calculate angle between vectors for proper spherical interpolation
  const angle = startNorm.angleTo(endNorm);
  
  // If points are too close, just return straight line
  if (angle < 0.01) {
    return [start, end];
  }
  
  // Spherical linear interpolation along great circle
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    
    // Proper slerp formula
    const sinAngle = Math.sin(angle);
    const a = Math.sin((1 - t) * angle) / sinAngle;
    const b = Math.sin(t * angle) / sinAngle;
    
    const point = new THREE.Vector3(
      a * startNorm.x + b * endNorm.x,
      a * startNorm.y + b * endNorm.y,
      a * startNorm.z + b * endNorm.z
    ).multiplyScalar(radius);
    
    points.push(point);
  }
  
  return points;
}

export default function ConnectionLines() {
  // Get state values directly
  const topics = useStore((s) => s.topics);
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const maxDegree = useStore((s) => s.maxDegree);
  const activeTagFilters = useStore((s) => s.activeTagFilters);
  const getConnections = useStore((s) => s.getConnections);
  
  const connections = useMemo(() => getConnections(), [topics, focusedNodeId, maxDegree, activeTagFilters, getConnections]);
  
  const curves = useMemo(() => {
    return connections.map(({ from, to }, index) => {
      const arcPoints = createArc(from.position, to.position, 24);
      const curve = new THREE.CatmullRomCurve3(arcPoints);
      return { curve, key: `${from.id}-${to.id}-${index}` };
    });
  }, [connections]);
  
  if (connections.length === 0) return null;
  
  return (
    <group>
      {curves.map(({ curve, key }) => (
        <mesh key={key}>
          <tubeGeometry args={[curve, 24, 0.02, 8, false]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.2}
          />
        </mesh>
      ))}
    </group>
  );
}
