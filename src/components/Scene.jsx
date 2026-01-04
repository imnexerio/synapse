import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Environment360 from './Environment360';
import GraphNetwork from './GraphNetwork';

export default function Scene() {
  return (
    <Canvas
      camera={{ position: [0, 2, 12], fov: 60 }}
      style={{ background: '#000' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Background */}
      <Environment360 />
      
      {/* Graph */}
      <GraphNetwork />
      
      {/* Controls - drag to rotate, scroll to zoom */}
      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={20}
        rotateSpeed={0.5}
        zoomSpeed={0.5}
      />
    </Canvas>
  );
}
