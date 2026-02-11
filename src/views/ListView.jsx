import { useState } from 'react';
import useStore from '../store/useStore';
import { getTopicColor, generateColorFromString } from '../utils/colorGenerator';
import './Views.css';

const SORT_OPTIONS = [
  { field: 'createdAt', label: 'Date Created' },
  { field: 'title', label: 'Title' },
  { field: 'tagsCount', label: 'Tag Count' },
];

export default function ListView() {
  const topics = useStore((s) => s.topics);
  const isLoading = useStore((s) => s.isLoading);
  const selectNode = useStore((s) => s.selectNode);
  const getAllTags = useStore((s) => s.getAllTags);

  // List filter/sort state from store
  const listSortField = useStore((s) => s.listSortField);
  const listSortAscending = useStore((s) => s.listSortAscending);
  const listTagFilters = useStore((s) => s.listTagFilters);
  const showListFilters = useStore((s) => s.showListFilters);
  const setListSortField = useStore((s) => s.setListSortField);
  const toggleListSortOrder = useStore((s) => s.toggleListSortOrder);
  const toggleListTagFilter = useStore((s) => s.toggleListTagFilter);
  const clearListFilters = useStore((s) => s.clearListFilters);
  const toggleListFiltersPanel = useStore((s) => s.toggleListFiltersPanel);
  const getFilteredListTopics = useStore((s) => s.getFilteredListTopics);

  const filteredTopics = getFilteredListTopics();
  const allTags = getAllTags();
  const totalFilters = listTagFilters.length;

  if (isLoading) {
    return (
      <div className="list-view">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading topics...</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="list-view">
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <h2>No topics yet</h2>
          <p>Add your first topic to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="list-view">
      <div className="list-header">
        <h2>All Topics</h2>
        <span className="topic-count">
          {filteredTopics.length}{totalFilters > 0 ? ` / ${topics.length}` : ''} topics
        </span>
      </div>

      {/* Sort & Filter Bar */}
      <div className="list-toolbar">
        {/* Sort controls */}
        <div className="list-sort-row">
          <span className="list-sort-label">Sort by</span>
          <div className="list-sort-options">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.field}
                className={`list-sort-chip ${listSortField === opt.field ? 'active' : ''}`}
                onClick={() => setListSortField(opt.field)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            className="list-sort-order-btn"
            onClick={toggleListSortOrder}
            title={listSortAscending ? 'Ascending' : 'Descending'}
          >
            {listSortAscending ? '↑' : '↓'}
          </button>
        </div>

        {/* Filter toggle */}
        {allTags.length > 0 && (
          <button
            className={`list-filter-toggle ${showListFilters ? 'open' : ''}`}
            onClick={toggleListFiltersPanel}
          >
            <span>
              🏷️ Filters
              {totalFilters > 0 && (
                <span className="list-filter-badge">{totalFilters}</span>
              )}
            </span>
            <span className="toggle-arrow">{showListFilters ? '▼' : '▶'}</span>
          </button>
        )}

        {/* Filter chips */}
        {showListFilters && allTags.length > 0 && (
          <div className="list-filter-content">
            <div className="list-filter-header">
              <span>Filter by tags:</span>
              {totalFilters > 0 && (
                <button className="list-filter-clear" onClick={clearListFilters}>
                  Clear all
                </button>
              )}
            </div>
            <div className="list-tag-chips">
              {allTags.map((tag) => {
                const isActive = listTagFilters.includes(tag);
                const tagColor = generateColorFromString(tag);
                return (
                  <button
                    key={tag}
                    className={`list-tag-chip ${isActive ? 'active' : ''}`}
                    style={{
                      '--tag-color': tagColor,
                      borderColor: isActive ? tagColor : undefined,
                      background: isActive ? `${tagColor}20` : undefined,
                    }}
                    onClick={() => toggleListTagFilter(tag)}
                  >
                    <span
                      className="list-tag-dot"
                      style={{ background: tagColor }}
                    />
                    {tag}
                    {isActive && <span className="list-tag-check">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {filteredTopics.length === 0 ? (
        <div className="list-empty-filter">
          <span>🔍</span>
          <p>No topics match the selected filters</p>
          <button className="list-filter-clear" onClick={clearListFilters}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="topic-list">
          {filteredTopics.map((topic) => {
            const color = getTopicColor(topic);
            return (
              <div
                key={topic.id}
                className="topic-card"
                style={{ borderLeftColor: color }}
                onClick={() => selectNode(topic.id)}
              >
                <div className="topic-card-header">
                  <h3 className="topic-title">{topic.title}</h3>
                  <span className="topic-date">{topic.date}</span>
                </div>

                <p className="topic-description">{topic.description}</p>

                <div className="topic-tags">
                  {topic.tags.map((tag) => (
                    <span
                      key={tag}
                      className="topic-tag"
                      style={{ backgroundColor: getTopicColor({ tags: [tag] }) + '33' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
