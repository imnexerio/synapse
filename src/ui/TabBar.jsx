import useStore from '../store/useStore';
import './UI.css';

const tabs = [
  { id: 'plane', label: 'Mind Map', icon: '🗺️' },
  { id: 'list', label: 'List', icon: '📋' },
  { id: 'sphere', label: 'Explore', icon: '🌐' },
  { id: 'profile', label: 'Settings', icon: '⚙️' }
];

export default function TabBar() {
  const activeTab = useStore((s) => s.activeTab);
  const setActiveTab = useStore((s) => s.setActiveTab);

  return (
    <nav className="tab-bar">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => setActiveTab(tab.id)}
        >
          <span className="tab-icon">{tab.icon}</span>
          <span className="tab-label">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
