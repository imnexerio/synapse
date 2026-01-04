import { create } from 'zustand';
import { topics } from '../data/topics';

// Calculate shared tags between two topics
const getSharedTags = (topic1, topic2) => {
  return topic1.tags.filter(tag => topic2.tags.includes(tag));
};

// BFS to calculate degrees from focused node
const calculateDegrees = (focusedId, allTopics) => {
  const degrees = new Map();
  degrees.set(focusedId, 0);
  
  const queue = [focusedId];
  
  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentTopic = allTopics.find(t => t.id === currentId);
    const currentDegree = degrees.get(currentId);
    
    // Find connected topics (share at least 1 tag)
    allTopics.forEach(topic => {
      if (!degrees.has(topic.id) && getSharedTags(currentTopic, topic).length > 0) {
        degrees.set(topic.id, currentDegree + 1);
        queue.push(topic.id);
      }
    });
  }
  
  return degrees;
};

// Position nodes in 3D spherical space - focus at bottom, branches go up
const calculatePositions = (visibleTopics, focusedId) => {
  const positions = new Map();
  const focusedTopic = visibleTopics.find(t => t.id === focusedId);
  
  if (!focusedTopic) return positions;
  
  // Focus node at bottom center
  positions.set(focusedId, [0, -3, 0]);
  
  // Group by degree
  const byDegree = {};
  visibleTopics.forEach(topic => {
    if (topic.id !== focusedId) {
      const deg = topic.degree || 1;
      if (!byDegree[deg]) byDegree[deg] = [];
      byDegree[deg].push(topic);
    }
  });
  
  // Position each degree level on a sphere going upward
  Object.keys(byDegree).forEach(deg => {
    const nodes = byDegree[deg];
    const degNum = parseInt(deg);
    const count = nodes.length;
    
    // Each degree level goes higher and spreads out more
    const baseY = -3 + degNum * 2.5; // Move up with each degree
    const radius = 2 + degNum * 1.5; // Spread out more with each degree
    
    nodes.forEach((topic, i) => {
      // Distribute around a sphere segment
      const angleH = (i / count) * Math.PI * 2; // Horizontal angle
      const angleV = Math.PI * 0.3 * (1 - degNum * 0.1); // Vertical tilt
      
      // Add some randomness for organic feel
      const jitterX = (Math.random() - 0.5) * 0.5;
      const jitterY = (Math.random() - 0.5) * 0.5;
      const jitterZ = (Math.random() - 0.5) * 0.5;
      
      positions.set(topic.id, [
        Math.cos(angleH) * radius * Math.sin(angleV) + jitterX,
        baseY + jitterY,
        Math.sin(angleH) * radius * Math.sin(angleV) + jitterZ
      ]);
    });
  });
  
  return positions;
};

const useStore = create((set, get) => ({
  // Data
  topics: topics,
  
  // State
  focusedNodeId: 1,
  maxDegree: 1,
  activeTagFilters: [],
  selectedNode: null,
  
  // Set focused node
  setFocusedNode: (id) => set({ focusedNodeId: id }),
  
  // Set max degree
  setMaxDegree: (degree) => set({ maxDegree: degree }),
  
  // Toggle tag filter
  toggleTagFilter: (tag) => set((state) => ({
    activeTagFilters: state.activeTagFilters.includes(tag)
      ? state.activeTagFilters.filter(t => t !== tag)
      : [...state.activeTagFilters, tag]
  })),
  
  // Clear filters
  clearFilters: () => set({ activeTagFilters: [] }),
  
  // Select node (for modal)
  selectNode: (id) => set({ selectedNode: id }),
  closeModal: () => set({ selectedNode: null }),
  
  // Computed values (call these as functions, don't use as selectors)
  getVisibleNodes: () => {
    const { topics, focusedNodeId, maxDegree, activeTagFilters } = get();
    
    // Calculate degrees from focus
    const degrees = calculateDegrees(focusedNodeId, topics);
    
    // Filter by degree and tags
    let visible = topics.filter(topic => {
      const degree = degrees.get(topic.id);
      if (degree === undefined || degree > maxDegree) return false;
      
      // Tag filter
      if (activeTagFilters.length > 0) {
        return topic.tags.some(tag => activeTagFilters.includes(tag));
      }
      return true;
    });
    
    // Add degree info
    visible = visible.map(topic => ({
      ...topic,
      degree: degrees.get(topic.id)
    }));
    
    // Calculate positions
    const positions = calculatePositions(visible, focusedNodeId);
    
    return visible.map(topic => ({
      ...topic,
      position: positions.get(topic.id) || [0, 0, 0]
    }));
  },
  
  // Get connections between visible nodes
  getConnections: () => {
    const visibleNodes = get().getVisibleNodes();
    const connections = [];
    
    for (let i = 0; i < visibleNodes.length; i++) {
      for (let j = i + 1; j < visibleNodes.length; j++) {
        const shared = getSharedTags(visibleNodes[i], visibleNodes[j]);
        if (shared.length > 0) {
          connections.push({
            from: visibleNodes[i],
            to: visibleNodes[j],
            sharedTags: shared
          });
        }
      }
    }
    
    return connections;
  }
}));

export default useStore;
