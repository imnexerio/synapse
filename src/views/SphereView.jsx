import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Environment360 from '../components/Environment360';
import GraphNetwork from '../components/GraphNetwork';
import DeviceOrientationControls from '../components/DeviceOrientationControls';
import useStore from '../store/useStore';
import './Views.css';

export default function SphereView() {
  const gyroEnabled = useStore((s) => s.gyroEnabled);
  const topics = useStore((s) => s.topics);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="sphere-view">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading topics...</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="sphere-view">
        <div className="empty-state">
          <span className="empty-icon">🌐</span>
          <h2>No topics yet</h2>
          <p>Add topics to explore in 360°</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sphere-view">
      <Canvas
        camera={{
          position: [0, 0, 0.1],
          fov: 75,
          near: 0.1,
          far: 20000
        }}
        style={{ background: '#000' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={0.5} />

        {/* 360° Background */}
        <Environment360 />

        {/* Graph nodes */}
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
          />
        )}
      </Canvas>
    </div>
  );
}
