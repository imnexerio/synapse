import { useMemo } from 'react';
import * as THREE from 'three';
import useStore from '../store/useStore';

export default function ConnectionLines() {
  // Get state values directly
  const topics = useStore((s) => s.topics);
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const maxDegree = useStore((s) => s.maxDegree);
  const activeTagFilters = useStore((s) => s.activeTagFilters);
  const getConnections = useStore((s) => s.getConnections);
  
  const connections = useMemo(() => getConnections(), [topics, focusedNodeId, maxDegree, activeTagFilters, getConnections]);
  
  const lineGeometry = useMemo(() => {
    const points = [];
    
    connections.forEach(({ from, to }) => {
      points.push(
        new THREE.Vector3(...from.position),
        new THREE.Vector3(...to.position)
      );
    });
    
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [connections]);
  
  if (connections.length === 0) return null;
  
  return (
    <lineSegments geometry={lineGeometry}>
      <lineBasicMaterial
        color="#ffffff"
        transparent
        opacity={0.15}
        linewidth={1}
      />
    </lineSegments>
  );
}
