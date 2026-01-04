import { useState } from 'react';
import { Billboard, Text } from '@react-three/drei';
import useStore from '../store/useStore';

// Colors based on degree - easy to identify hierarchy visually
const DEGREE_COLORS = {
  0: '#FF6B6B', // Focus - Red/Coral (most important)
  1: '#4ECDC4', // Degree 1 - Teal
  2: '#A29BFE', // Degree 2 - Purple  
  3: '#FFEAA7', // Degree 3 - Yellow
};

export default function TopicNode({ topic }) {
  const [hovered, setHovered] = useState(false);
  
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const selectNode = useStore((s) => s.selectNode);
  
  const isFocused = topic.id === focusedNodeId;
  const scale = isFocused ? 1.2 : hovered ? 1.1 : 1;
  
  // Use degree-based color
  const cardColor = DEGREE_COLORS[topic.degree] || DEGREE_COLORS[3];
  
  const handleClick = (e) => {
    e.stopPropagation();
    // Show modal with topic info
    selectNode(topic.id);
  };
  
  return (
    <group
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
            color={cardColor}
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
