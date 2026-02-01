import { useState, useMemo } from 'react';
import useStore from '../store/useStore';
import { generateColorFromString } from '../utils/colorGenerator';
import './UI.css';

export default function AddTopicForm() {
  const showAddForm = useStore((s) => s.showAddForm);
  const closeAddForm = useStore((s) => s.closeAddForm);
  const addTopic = useStore((s) => s.addTopic);
  const getAllTags = useStore((s) => s.getAllTags);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      handleAddTag(tagInput);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || selectedTags.length === 0) return;

    addTopic({
      title: title.trim(),
      description: description.trim(),
      date,
      tags: selectedTags
    });

    // Reset form
    setTitle('');
    setDescription('');
    setDate(new Date().toISOString().split('T')[0]);
    setTagInput('');
    setSelectedTags([]);
  };

  const isValid = title.trim() && selectedTags.length > 0;

  if (!showAddForm) return null;

  return (
    <div className="modal-overlay" onClick={closeAddForm}>
      <div className="add-form-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={closeAddForm}>×</button>

        <h2 className="add-form-title">Add New Topic</h2>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., RBI Monetary Policy Update"
              className="form-input"
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the news..."
              className="form-input form-textarea"
              rows={3}
            />
          </div>

          {/* Date */}
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="form-input"
            />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags * (at least 1)</label>
            
            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div className="selected-tags">
                {selectedTags.map(tag => (
                  <span
                    key={tag}
                    className="selected-tag"
                    style={{ backgroundColor: generateColorFromString(tag) + '40' }}
                  >
                    {tag}
                    <button
                      type="button"
                      className="tag-remove"
                      onClick={() => handleRemoveTag(tag)}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Tag input */}
            <div className="tag-input-container">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type tag and press Enter..."
                className="form-input"
              />
              
              {/* Suggestions dropdown */}
              {suggestions.length > 0 && (
                <div className="tag-suggestions">
                  {suggestions.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      className="tag-suggestion"
                      onClick={() => handleAddTag(tag)}
                    >
                      <span
                        className="tag-suggestion-dot"
                        style={{ backgroundColor: generateColorFromString(tag) }}
                      />
                      {tag}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className={`form-submit ${isValid ? '' : 'disabled'}`}
            disabled={!isValid}
          >
            Add Topic
          </button>
        </form>
      </div>
    </div>
  );
}
