import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import './TopicNode2D.css';

function TopicNode({ data }) {
  const { title, tags = [], color = '#4ECDC4', degree = 0, isFocused = false } = data || {};

  return (
    <div 
      className={`topic-node-2d ${isFocused ? 'focused' : ''}`}
      style={{ 
        borderColor: color,
        boxShadow: isFocused 
          ? `0 0 20px ${color}80, 0 4px 15px rgba(0,0,0,0.3)`
          : `0 4px 15px rgba(0,0,0,0.3)`
      }}
    >
      {/* Connection handles */}
      <Handle type="target" position={Position.Top} className="node-handle" />
      <Handle type="source" position={Position.Bottom} className="node-handle" />
      <Handle type="target" position={Position.Left} className="node-handle" />
      <Handle type="source" position={Position.Right} className="node-handle" />
      
      {/* Node content */}
      <div className="node-header" style={{ background: color }}>
        <span className="node-title">{title || 'Untitled'}</span>
        {degree > 0 && !isFocused && (
          <span className="node-degree">{degree}°</span>
        )}
        {isFocused && (
          <span className="node-focus-badge">⭐</span>
        )}
      </div>
      
      <div className="node-tags">
        {(tags || []).slice(0, 3).map((tag, i) => (
          <span 
            key={i} 
            className="node-tag"
            style={{ background: `${color}30`, borderColor: `${color}50` }}
          >
            {tag}
          </span>
        ))}
        {tags && tags.length > 3 && (
          <span className="node-tag-more">+{tags.length - 3}</span>
        )}
      </div>
    </div>
  );
}

export default memo(TopicNode);
