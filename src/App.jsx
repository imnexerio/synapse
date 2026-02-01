import { useEffect } from 'react';
import SphereView from './views/SphereView';
import PlaneView from './views/PlaneView';
import ListView from './views/ListView';
import ProfileView from './views/ProfileView';
import TabBar from './ui/TabBar';
import DegreeToggle from './ui/DegreeToggle';
import FilterPanel from './ui/FilterPanel';
import TopicModal from './ui/TopicModal';
import AddTopicForm from './ui/AddTopicForm';
import GyroToggle from './ui/GyroToggle';
import FullscreenToggle from './ui/FullscreenToggle';
import AuthScreen from './ui/AuthScreen';
import useStore from './store/useStore';
import { getTopicColor } from './utils/colorGenerator';
import './ui/UI.css';

function App() {
  const activeTab = useStore((s) => s.activeTab);
  const topics = useStore((s) => s.topics);
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const gyroEnabled = useStore((s) => s.gyroEnabled);
  const isLoading = useStore((s) => s.isLoading);
  const openAddForm = useStore((s) => s.openAddForm);
  const initializeAuth = useStore((s) => s.initializeAuth);
  const user = useStore((s) => s.user);
  const authLoading = useStore((s) => s.authLoading);

  // Initialize Auth on mount
  useEffect(() => {
    const cleanup = initializeAuth();
    return cleanup;
  }, [initializeAuth]);

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className="app-container auth-loading">
        <div className="loading-spinner" />
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <AuthScreen />;
  }

  const focusedTopic = topics.find((t) => t.id === focusedNodeId);
  const showGraphControls = activeTab === 'sphere' || activeTab === 'plane';

  // Render active view
  const renderView = () => {
    switch (activeTab) {
      case 'sphere':
        return <SphereView />;
      case 'plane':
        return <PlaneView />;
      case 'list':
        return <ListView />;
      case 'profile':
        return <ProfileView />;
      default:
        return <SphereView />;
    }
  };

  return (
    <div className="app-container">
      {/* Main View */}
      <main className="main-content">
        {renderView()}
      </main>

      {/* Graph Controls Overlay - only for graph views */}
      {showGraphControls && (
        <>
          {/* Title */}
          <div className="info-box">
            <h1>🌐 Synapse</h1>
            <p>
              {activeTab === 'sphere'
                ? (gyroEnabled ? 'Tilt device to look around' : 'Drag to rotate • Scroll to zoom')
                : 'Pan to move • Scroll to zoom'
              } • Click nodes
            </p>
          </div>

          {/* Top right controls */}
          <div className="top-right-controls">
            <FullscreenToggle />
          </div>

          {/* Gyro Toggle - only in sphere view */}
          {activeTab === 'sphere' && (
            <div className="gyro-container">
              <GyroToggle />
            </div>
          )}

          {/* Current focus indicator */}
          {focusedTopic && (
            <div className="focus-indicator">
              <div className="focus-dot" style={{ background: getTopicColor(focusedTopic) }} />
              <span className="focus-title">{focusedTopic.title}</span>
            </div>
          )}

          {/* Bottom controls */}
          <div className="controls">
            <DegreeToggle />
            <FilterPanel />
          </div>
        </>
      )}

      {/* Tab Bar */}
      <TabBar />

      {/* Floating Action Button - Add Topic */}
      <button className="fab" onClick={openAddForm} aria-label="Add topic">
        +
      </button>

      {/* Modals */}
      <TopicModal />
      <AddTopicForm />
    </div>
  );
}

export default App;
