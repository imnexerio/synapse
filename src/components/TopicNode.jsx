import { useRef, useState } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import useStore from '../store/useStore';

export default function TopicNode({ topic }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const setFocusedNode = useStore((s) => s.setFocusedNode);
  const selectNode = useStore((s) => s.selectNode);
  
  const isFocused = topic.id === focusedNodeId;
  const scale = isFocused ? 1.2 : hovered ? 1.1 : 1;
  
  // Create a stable numeric hash from topic.id for animation offset
  const idHash = topic.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Gentle floating animation
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.position.y = topic.position[1] + Math.sin(state.clock.elapsedTime + idHash) * 0.1;
    }
  });
  
  const handleClick = (e) => {
    e.stopPropagation();
    // Show modal with topic info
    selectNode(topic.id);
  };
  
  return (
    <group
      ref={meshRef}
      position={topic.position}
      scale={scale}
      onClick={handleClick}
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      <Billboard follow={true}>
        {/* Card background */}
        <mesh>
          <planeGeometry args={[2.5, 1.2]} />
          <meshBasicMaterial
            color={topic.color}
            transparent
            opacity={isFocused ? 0.95 : 0.85}
          />
        </mesh>
        
        {/* Border glow for focused */}
        {isFocused && (
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[2.7, 1.4]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
          </mesh>
        )}
        
        {/* Title */}
        <Text
          position={[0, 0.2, 0.01]}
          fontSize={0.22}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.2}
          textAlign="center"
        >
          {topic.title}
        </Text>
        
        {/* Tags */}
        <Text
          position={[0, -0.25, 0.01]}
          fontSize={0.12}
          color="#b3b3b3"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.2}
        >
          {topic.tags.slice(0, 3).join(' • ')}
        </Text>
        
        {/* Degree indicator */}
        {topic.degree > 0 && (
          <Text
            position={[1.0, 0.45, 0.01]}
            fontSize={0.15}
            color="#808080"
          >
            {topic.degree}°
          </Text>
        )}
      </Billboard>
    </group>
  );
}
