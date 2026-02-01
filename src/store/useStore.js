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

// Sphere radius (think of 1 unit = 1 foot, so 10 = 10 feet)
const SPHERE_RADIUS = 20;

// Position nodes on a TRUE sphere - focus at south pole, others spread on surface
const calculatePositions = (visibleTopics, focusedId) => {
  const positions = new Map();
  const focusedTopic = visibleTopics.find(t => t.id === focusedId);
  
  if (!focusedTopic) return positions;
  
  // Focus node at bottom (south pole) of sphere
  positions.set(focusedId, [0, -SPHERE_RADIUS, 0]);
  
  // Group by degree
  const byDegree = {};
  visibleTopics.forEach(topic => {
    if (topic.id !== focusedId) {
      const deg = topic.degree || 1;
      if (!byDegree[deg]) byDegree[deg] = [];
      byDegree[deg].push(topic);
    }
  });
  
  // Position each degree level on spherical bands
  // Degree 1: South pole to equator (theta 180° to 90°)
  // Degree 2: 45°S to 30°N (theta 135° to 60°)
  // Degree 3: Near north pole (theta 15° to 0°)
  Object.keys(byDegree).forEach(deg => {
    const nodes = byDegree[deg];
    const degNum = parseInt(deg);
    const count = nodes.length;
    
    // Define theta ranges for each degree (in radians)
    // Latitude to theta: theta = 90° - latitude (in degrees), then convert to radians
    let thetaMin, thetaMax;
    if (degNum === 1) {
      // South pole (180°) to equator (90°)
      thetaMin = Math.PI / 2;      // 90° = equator
      thetaMax = Math.PI;           // 180° = south pole
    } else if (degNum === 2) {
      // 45°S (135°) to 30°N (60°)
      thetaMin = Math.PI / 3;       // 60° = 30°N
      thetaMax = Math.PI * 0.75;    // 135° = 45°S
    } else {
      // Near north pole: 15° to 0° theta (75°N to 90°N)
      thetaMin = 0;                 // 0° = north pole
      thetaMax = Math.PI / 12;      // 15° = 75°N
    }
    
    nodes.forEach((topic, i) => {
      // Distribute theta within the range
      const thetaRange = thetaMax - thetaMin;
      const theta = thetaMin + (thetaRange * (i + 0.5) / count);
      
      // Azimuthal angle (phi): distribute evenly around the sphere
      const phi = (i / count) * Math.PI * 2;
      
      // Add small jitter for organic feel
      const jitterTheta = (Math.random() - 0.5) * 0.2;
      const jitterPhi = (Math.random() - 0.5) * 0.3;
      
      const finalTheta = theta + jitterTheta;
      const finalPhi = phi + jitterPhi;
      
      // Spherical to Cartesian coordinates
      // X = r * sin(θ) * cos(φ)
      // Y = r * cos(θ)  (Y is up in Three.js)
      // Z = r * sin(θ) * sin(φ)
      positions.set(topic.id, [
        SPHERE_RADIUS * Math.sin(finalTheta) * Math.cos(finalPhi),
        SPHERE_RADIUS * Math.cos(finalTheta),
        SPHERE_RADIUS * Math.sin(finalTheta) * Math.sin(finalPhi)
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
  gyroEnabled: false,
  
  // Toggle gyro
  toggleGyro: () => set((state) => ({ gyroEnabled: !state.gyroEnabled })),
  
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
