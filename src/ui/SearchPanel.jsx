import { useState, useEffect, useRef, useCallback } from 'react';
import useStore from '../store/useStore';
import { getTopicColor, generateColorFromString } from '../utils/colorGenerator';
import './UI.css';

export default function SearchPanel() {
  const showSearchPanel = useStore((s) => s.showSearchPanel);
  const closeSearchPanel = useStore((s) => s.closeSearchPanel);
  const searchQuery = useStore((s) => s.searchQuery);
  const setSearchQuery = useStore((s) => s.setSearchQuery);
  const searchTagFilters = useStore((s) => s.searchTagFilters);
  const toggleSearchTagFilter = useStore((s) => s.toggleSearchTagFilter);
  const clearSearchFilters = useStore((s) => s.clearSearchFilters);
  const getSearchResults = useStore((s) => s.getSearchResults);
  const getAllTags = useStore((s) => s.getAllTags);
  const setFocusedNode = useStore((s) => s.setFocusedNode);
  const selectNode = useStore((s) => s.selectNode);

  const [localQuery, setLocalQuery] = useState(searchQuery);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  const results = getSearchResults();
  const allTags = getAllTags();

  // Focus input when panel opens
  useEffect(() => {
    if (showSearchPanel && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showSearchPanel]);

  // Sync local query with store on open
  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  // Debounced search - filters cached data (no Firebase reads)
  const debouncedSearch = useCallback((value) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      setSearchQuery(value);
    }, 300);
  }, [setSearchQuery]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setLocalQuery(value);
    debouncedSearch(value);
  };

  const handleClearInput = () => {
    setLocalQuery('');
    setSearchQuery('');
    inputRef.current?.focus();
  };

  const handleResultClick = (topic) => {
    // Focus the topic and open its modal
    setFocusedNode(topic.id);
    selectNode(topic.id);
    closeSearchPanel();
  };

  const handleResultFocus = (topic) => {
    // Just focus the topic without opening modal
    setFocusedNode(topic.id);
    closeSearchPanel();
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      closeSearchPanel();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeSearchPanel();
    }
  };

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query.trim() || !text) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, i) => 
      regex.test(part) ? (
        <mark key={i} className="search-highlight">{part}</mark>
      ) : part
    );
  };

  if (!showSearchPanel) return null;

  const totalFilters = searchTagFilters.length;
  const queryLower = localQuery.toLowerCase().trim();

  return (
    <div className="search-overlay" onClick={handleOverlayClick} onKeyDown={handleKeyDown}>
      <div className="search-panel">
        {/* Handle indicator */}
        <div className="search-handle" />

        {/* Search input */}
        <div className="search-input-container">
          <span className="search-icon">🔍</span>
          <input
            ref={inputRef}
            type="text"
            className="search-input"
            placeholder="Search topics..."
            value={localQuery}
            onChange={handleInputChange}
          />
          {localQuery && (
            <button className="search-clear" onClick={handleClearInput}>
              ✕
            </button>
          )}
        </div>

        {/* Filter section */}
        {allTags.length > 0 && (
          <div className="search-filters">
            <button 
              className="search-filter-toggle"
              onClick={() => setShowFilters(!showFilters)}
            >
              <span>
                🏷️ Filters
                {totalFilters > 0 && (
                  <span className="search-filter-badge">{totalFilters}</span>
                )}
              </span>
              <span className="toggle-arrow">{showFilters ? '▼' : '▶'}</span>
            </button>

            {showFilters && (
              <div className="search-filter-content">
                <div className="search-filter-header">
                  <span>Filter by tags:</span>
                  {totalFilters > 0 && (
                    <button className="clear-btn" onClick={clearSearchFilters}>
                      Clear all
                    </button>
                  )}
                </div>
                <div className="search-tag-list">
                  {allTags.map((tag) => {
                    const isActive = searchTagFilters.includes(tag);
                    const tagColor = generateColorFromString(tag);
                    return (
                      <button
                        key={tag}
                        className={`search-tag-chip ${isActive ? 'active' : ''}`}
                        style={{
                          '--tag-color': tagColor,
                          borderColor: isActive ? tagColor : undefined,
                          background: isActive ? `${tagColor}20` : undefined
                        }}
                        onClick={() => toggleSearchTagFilter(tag)}
                      >
                        <span 
                          className="search-tag-dot" 
                          style={{ background: tagColor }}
                        />
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Results count */}
        <div className="search-results-header">
          <span className="search-results-count">
            {results.length} result{results.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Results list */}
        <div className="search-results">
          {results.length === 0 ? (
            <div className="search-empty">
              <span className="search-empty-icon">
                {localQuery || totalFilters > 0 ? '🔍' : '💡'}
              </span>
              <p>
                {localQuery || totalFilters > 0 
                  ? 'No matching topics found'
                  : 'Start typing to search'}
              </p>
            </div>
          ) : (
            results.map((topic) => {
              const topicColor = getTopicColor(topic);
              return (
                <div 
                  key={topic.id} 
                  className="search-result-item"
                  style={{ '--topic-color': topicColor }}
                >
                  <div 
                    className="search-result-indicator"
                    style={{ background: topicColor }}
                  />
                  <div className="search-result-content" onClick={() => handleResultClick(topic)}>
                    <h4 className="search-result-title">
                      {highlightMatch(topic.title, queryLower)}
                    </h4>
                    {topic.description && (
                      <p className="search-result-description">
                        {highlightMatch(
                          topic.description.length > 200 
                            ? topic.description.slice(0, 200) + '...' 
                            : topic.description,
                          queryLower
                        )}
                      </p>
                    )}
                    <div className="search-result-tags">
                      {topic.tags.slice(0, 4).map((tag) => (
                        <span 
                          key={tag} 
                          className="search-result-tag"
                          style={{ 
                            background: `${generateColorFromString(tag)}25`,
                            color: generateColorFromString(tag)
                          }}
                        >
                          {highlightMatch(tag, queryLower)}
                        </span>
                      ))}
                      {topic.tags.length > 4 && (
                        <span className="search-result-tag-more">
                          +{topic.tags.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                  <button 
                    className="search-result-focus"
                    onClick={() => handleResultFocus(topic)}
                    title="Focus this topic"
                  >
                    ◎
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
