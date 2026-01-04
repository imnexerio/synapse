import useStore from '../store/useStore';
import './UI.css';

export default function TopicModal() {
  const selectedNode = useStore((s) => s.selectedNode);
  const topics = useStore((s) => s.topics);
  const closeModal = useStore((s) => s.closeModal);
  const setFocusedNode = useStore((s) => s.setFocusedNode);
  
  if (!selectedNode) return null;
  
  const topic = topics.find((t) => t.id === selectedNode);
  if (!topic) return null;
  
  // Find related topics
  const related = topics.filter(
    (t) => t.id !== topic.id && t.tags.some((tag) => topic.tags.includes(tag))
  ).slice(0, 5);
  
  const handleRelatedClick = (id) => {
    setFocusedNode(id);
    closeModal();
  };
  
  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>×</button>
        
        <div className="modal-header" style={{ borderLeftColor: topic.color }}>
          <h2>{topic.title}</h2>
          <div className="modal-tags">
            {topic.tags.map((tag) => (
              <span key={tag} className="modal-tag">{tag}</span>
            ))}
          </div>
        </div>
        
        <p className="modal-description">{topic.description}</p>
        
        {related.length > 0 && (
          <div className="modal-related">
            <h3>Related Topics</h3>
            <div className="related-list">
              {related.map((r) => (
                <button
                  key={r.id}
                  className="related-item"
                  style={{ borderLeftColor: r.color }}
                  onClick={() => handleRelatedClick(r.id)}
                >
                  {r.title}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
