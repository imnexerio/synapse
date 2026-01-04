import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Environment360 from './Environment360';
import GraphNetwork from './GraphNetwork';
import DeviceOrientationControls from './DeviceOrientationControls';
import useStore from '../store/useStore';

export default function Scene() {
  const gyroEnabled = useStore((s) => s.gyroEnabled);
  
  return (
    <Canvas
      camera={{ 
        position: [0, 0, 0.1], // Slightly off center so OrbitControls works
        fov: 75,
        near: 0.1,
        far: 20000
      }}
      style={{ background: '#000' }}
    >
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
      
      {/* Background */}
      <Environment360 />
      
      {/* Graph */}
      <GraphNetwork />
      
      {/* Controls - touch or gyroscope */}
      {gyroEnabled ? (
        <DeviceOrientationControls enabled={gyroEnabled} />
      ) : (
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          minDistance={0.1}
          maxDistance={15}
          rotateSpeed={-0.5}
          zoomSpeed={0.5}
          target={[0, 0, 0]}
          reverseOrbit={true}
        />
      )}
    </Canvas>
  );
}
