import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural space background
export default function Environment360() {
  const starsRef = useRef();
  
  // Slow rotation
  useFrame((state, delta) => {
    if (starsRef.current) {
      starsRef.current.rotation.y += delta * 0.01;
    }
  });
  
  // Generate star positions
  const starCount = 500;
  const starPositions = new Float32Array(starCount * 3);
  const starColors = new Float32Array(starCount * 3);
  
  for (let i = 0; i < starCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const radius = 50 + Math.random() * 50;
    
    starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);
    
    // Slight color variation
    const brightness = 0.7 + Math.random() * 0.3;
    starColors[i * 3] = brightness;
    starColors[i * 3 + 1] = brightness;
    starColors[i * 3 + 2] = brightness + Math.random() * 0.1;
  }
  
  return (
    <group ref={starsRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={starCount}
            array={starPositions}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            count={starCount}
            array={starColors}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.3}
          vertexColors
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
      
      {/* Ambient glow */}
      <mesh>
        <sphereGeometry args={[100, 32, 32]} />
        <meshBasicMaterial
          color="#0a0a20"
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
