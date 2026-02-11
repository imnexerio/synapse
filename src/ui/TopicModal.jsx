import { useState, useEffect, useMemo } from 'react';
import useStore from '../store/useStore';
import { getTopicColor, generateColorFromString } from '../utils/colorGenerator';
import './UI.css';

export default function TopicModal() {
  const selectedNode = useStore((s) => s.selectedNode);
  const topics = useStore((s) => s.topics);
  const closeModal = useStore((s) => s.closeModal);
  const setFocusedNode = useStore((s) => s.setFocusedNode);
  const updateTopic = useStore((s) => s.updateTopic);
  const deleteTopic = useStore((s) => s.deleteTopic);
  const getAllTags = useStore((s) => s.getAllTags);

  // Editable fields state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Original values for change detection
  const [originalValues, setOriginalValues] = useState(null);

  // Get the topic
  const topic = topics.find((t) => t.id === selectedNode);

  // Initialize form when topic changes
  useEffect(() => {
    if (topic) {
      setTitle(topic.title || '');
      setDescription(topic.description || '');
      setDate(topic.date || '');
      setSelectedTags(topic.tags || []);
      setTagInput('');
      setOriginalValues({
        title: topic.title || '',
        description: topic.description || '',
        date: topic.date || '',
        tags: [...(topic.tags || [])]
      });
    }
  }, [topic?.id]);

  // Check if any changes have been made
  const hasChanges = useMemo(() => {
    if (!originalValues) return false;
    return (
      title !== originalValues.title ||
      description !== originalValues.description ||
      date !== originalValues.date ||
      selectedTags.length !== originalValues.tags.length ||
      selectedTags.some((tag, i) => tag !== originalValues.tags[i])
    );
  }, [title, description, date, selectedTags, originalValues]);

  // Get existing tags for suggestions
  const existingTags = getAllTags();

  // Filter suggestions based on input
  const suggestions = useMemo(() => {
    if (!tagInput.trim()) return [];
    const input = tagInput.toLowerCase().trim();
    return existingTags
      .filter(tag => tag.toLowerCase().includes(input) && !selectedTags.includes(tag))
      .slice(0, 5);
  }, [tagInput, existingTags, selectedTags]);

  if (!selectedNode || !topic) return null;

  const topicColor = getTopicColor(topic);

  // Find related topics
  const related = topics.filter(
    (t) => t.id !== topic.id && t.tags.some((tag) => topic.tags.includes(tag))
  ).slice(0, 5);

  const handleRelatedClick = (id) => {
    setFocusedNode(id);
    closeModal();
  };

  const handleDelete = () => {
    if (window.confirm(`Delete "${topic.title}"? This cannot be undone.`)) {
      deleteTopic(topic.id);
      closeModal();
    }
  };

  // Discard changes - reset to original values
  const handleDiscard = () => {
    if (originalValues) {
      setTitle(originalValues.title);
      setDescription(originalValues.description);
      setDate(originalValues.date);
      setSelectedTags([...originalValues.tags]);
      setTagInput('');
    }
  };

  // Save changes
  const handleSave = () => {
    if (!title.trim() || selectedTags.length === 0) return;

    updateTopic(
      topic.id,
      {
        title: title.trim(),
        description: description.trim(),
        date,
        tags: selectedTags
      },
      originalValues.tags,
      selectedTags
    );
    closeModal();
  };

  // Tag management
  const handleAddTag = (tag) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !selectedTags.includes(normalizedTag)) {
      setSelectedTags([...selectedTags, normalizedTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(t => t !== tagToRemove));
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  // Format dates
  const formatDate = (timestamp) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isValid = title.trim() && selectedTags.length > 0;

  return (
    <div className="modal-overlay" onClick={closeModal}>
      <div className="modal-content topic-modal-edit" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeModal}>×</button>

        {/* Header with color indicator */}
        <div className="modal-header" style={{ borderLeftColor: topicColor }}>
          {/* Editable Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="modal-title-input"
            placeholder="Topic title"
          />
          
          {/* Editable Tags */}
          <div className="modal-tags-edit">
            {selectedTags.map((tag) => (
              <span 
                key={tag} 
                className="modal-tag editable"
                style={{ background: `${generateColorFromString(tag)}40` }}
              >
                {tag}
                <button 
                  className="tag-remove-btn"
                  onClick={() => handleRemoveTag(tag)}
                >×</button>
              </span>
            ))}
          </div>
          
          {/* Tag input */}
          <div className="tag-input-inline">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag..."
              className="tag-input-small"
            />
            {suggestions.length > 0 && (
              <div className="tag-suggestions-inline">
                {suggestions.map(tag => (
                  <button
                    key={tag}
                    className="tag-suggestion-item"
                    onClick={() => handleAddTag(tag)}
                  >
                    <span
                      className="tag-dot"
                      style={{ backgroundColor: generateColorFromString(tag) }}
                    />
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Editable Description */}
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="modal-description-input"
          placeholder="Add description..."
          rows={5}
        />

        {/* Editable Date */}
        <div className="modal-date-edit">
          <span>📅</span>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="modal-date-input"
          />
        </div>

        {/* Meta info (read-only) */}
        <div className="modal-meta">
          {topic.createdAt && (
            <p className="modal-date">🕐 Created: {formatDate(topic.createdAt)}</p>
          )}
          {topic.modifiedAt && (
            <p className="modal-date">✏️ Modified: {formatDate(topic.modifiedAt)}</p>
          )}
        </div>

        {/* Dynamic Action Buttons */}
        <div className="modal-actions">
          {hasChanges ? (
            // DISCARD + SAVE CHANGES when edits made
            <>
              <button 
                className="modal-action-btn discard" 
                onClick={handleDiscard}
              >
                ✕ Discard
              </button>
              <button 
                className="modal-action-btn save" 
                onClick={handleSave}
                disabled={!isValid}
              >
                💾 Save Changes
              </button>
            </>
          ) : (
            // SET AS FOCUS + DELETE when no changes
            <>
              <button 
                className="modal-action-btn focus" 
                onClick={() => {
                  setFocusedNode(topic.id);
                  closeModal();
                }}
              >
                🎯 Set as Focus
              </button>
              <button 
                className="modal-action-btn delete" 
                onClick={handleDelete}
              >
                🗑️ Delete
              </button>
            </>
          )}
        </div>

        {/* Related Topics */}
        {related.length > 0 && (
          <div className="modal-related">
            <h3>Related Topics</h3>
            <div className="related-list">
              {related.map((r) => (
                <button
                  key={r.id}
                  className="related-item"
                  style={{ borderLeftColor: getTopicColor(r) }}
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
