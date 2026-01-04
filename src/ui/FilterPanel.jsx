import { getAllTags } from '../data/topics';
import useStore from '../store/useStore';
import './UI.css';

export default function FilterPanel() {
  const allTags = getAllTags();
  const activeTagFilters = useStore((s) => s.activeTagFilters);
  const toggleTagFilter = useStore((s) => s.toggleTagFilter);
  const clearFilters = useStore((s) => s.clearFilters);
  
  return (
    <div className="filter-panel">
      <div className="filter-header">
        <span>Filter by tags:</span>
        {activeTagFilters.length > 0 && (
          <button className="clear-btn" onClick={clearFilters}>
            Clear
          </button>
        )}
      </div>
      <div className="tag-list">
        {allTags.map((tag) => (
          <button
            key={tag}
            className={`tag-chip ${activeTagFilters.includes(tag) ? 'active' : ''}`}
            onClick={() => toggleTagFilter(tag)}
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
