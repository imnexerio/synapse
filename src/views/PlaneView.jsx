import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid } from '@react-three/drei';
import GraphNetwork from '../components/GraphNetwork';
import ConnectionLines from '../components/ConnectionLines';
import useStore from '../store/useStore';
import './Views.css';

export default function PlaneView() {
  const topics = useStore((s) => s.topics);
  const isLoading = useStore((s) => s.isLoading);

  if (isLoading) {
    return (
      <div className="plane-view">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading topics...</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="plane-view">
        <div className="empty-state">
          <span className="empty-icon">🗺️</span>
          <h2>No topics yet</h2>
          <p>Add topics to see your mind map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plane-view">
      <Canvas
        camera={{
          position: [0, 30, 30],
          fov: 60,
          near: 0.1,
          far: 1000
        }}
        style={{ background: '#0a0a0f' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 20, 10]} intensity={0.5} />

        {/* Grid floor */}
        <Grid
          position={[0, -0.5, 0]}
          args={[100, 100]}
          cellSize={2}
          cellThickness={0.5}
          cellColor="#1a1a2e"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#2a2a4e"
          fadeDistance={100}
          infiniteGrid
        />

        {/* Connection lines */}
        <ConnectionLines />

        {/* Graph nodes */}
        <GraphNetwork />

        {/* Controls */}
        <OrbitControls
          enableRotate={true}
          enablePan={true}
          enableZoom={true}
          minDistance={10}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.2}
          target={[0, 0, 0]}
        />
      </Canvas>
    </div>
  );
}
