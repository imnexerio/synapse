import { useMemo } from 'react';
import useStore from '../store/useStore';
import { getTopicColor } from '../utils/colorGenerator';
import './Views.css';

export default function ListView() {
  const topics = useStore((s) => s.topics);
  const isLoading = useStore((s) => s.isLoading);
  const selectNode = useStore((s) => s.selectNode);

  // Sort by date (newest first)
  const sortedTopics = useMemo(() => {
    return [...topics].sort((a, b) => b.createdAt - a.createdAt);
  }, [topics]);

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
        <span className="topic-count">{topics.length} topics</span>
      </div>

      <div className="topic-list">
        {sortedTopics.map((topic) => {
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
    </div>
  );
}
