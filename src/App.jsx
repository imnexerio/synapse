import Scene from './components/Scene';
import DegreeToggle from './ui/DegreeToggle';
import FilterPanel from './ui/FilterPanel';
import TopicModal from './ui/TopicModal';
import useStore from './store/useStore';
import './ui/UI.css';

function App() {
  const topics = useStore((s) => s.topics);
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  
  const focusedTopic = topics.find((t) => t.id === focusedNodeId);

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#000' }}>
      {/* 3D Scene */}
      <Scene />
      
      {/* Title */}
      <div className="info-box">
        <h1>🌐 Synapse</h1>
        <p>Drag to rotate • Scroll to zoom • Click nodes</p>
      </div>
      
      {/* Current focus indicator */}
      {focusedTopic && (
        <div className="focus-indicator">
          <div className="focus-dot" style={{ background: focusedTopic.color }} />
          <span className="focus-title">{focusedTopic.title}</span>
        </div>
      )}
      
      {/* Bottom controls */}
      <div className="controls">
        <DegreeToggle />
        <FilterPanel />
      </div>
      
      {/* Modal */}
      <TopicModal />
    </div>
  );
}

export default App;
