import { create } from 'zustand';
import { getTopicColor } from '../utils/colorGenerator';
import {
  subscribeToTopics,
  subscribeToTags,
  addTopic as firebaseAddTopic,
  updateTopic as firebaseUpdateTopic,
  deleteTopic as firebaseDeleteTopic
} from '../services/firebaseService';
import {
  subscribeToAuthState,
  logout
} from '../services/authService';

// Calculate shared tags between two topics
const getSharedTags = (topic1, topic2) => {
  return topic1.tags.filter(tag => topic2.tags.includes(tag));
};

// BFS to calculate degrees from focused node
const calculateDegrees = (focusedId, allTopics) => {
  if (!focusedId) return new Map();
  
  const degrees = new Map();
  degrees.set(focusedId, 0);

  const queue = [focusedId];

  while (queue.length > 0) {
    const currentId = queue.shift();
    const currentTopic = allTopics.find(t => t.id === currentId);
    const currentDegree = degrees.get(currentId);

    if (!currentTopic) continue;

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

// Sphere radius for 3D view
const SPHERE_RADIUS = 20;

// Position nodes on a sphere - focus at south pole, others spread on surface
const calculateSpherePositions = (visibleTopics, focusedId) => {
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
  Object.keys(byDegree).forEach(deg => {
    const nodes = byDegree[deg];
    const degNum = parseInt(deg);
    const count = nodes.length;

    let thetaMin, thetaMax;
    if (degNum === 1) {
      thetaMin = Math.PI / 2;
      thetaMax = Math.PI;
    } else if (degNum === 2) {
      thetaMin = Math.PI / 3;
      thetaMax = Math.PI * 0.75;
    } else {
      thetaMin = 0;
      thetaMax = Math.PI / 12;
    }

    nodes.forEach((topic, i) => {
      const thetaRange = thetaMax - thetaMin;
      const theta = thetaMin + (thetaRange * (i + 0.5) / count);
      const phi = (i / count) * Math.PI * 2;
      const jitterTheta = (Math.random() - 0.5) * 0.2;
      const jitterPhi = (Math.random() - 0.5) * 0.3;
      const finalTheta = theta + jitterTheta;
      const finalPhi = phi + jitterPhi;

      positions.set(topic.id, [
        SPHERE_RADIUS * Math.sin(finalTheta) * Math.cos(finalPhi),
        SPHERE_RADIUS * Math.cos(finalTheta),
        SPHERE_RADIUS * Math.sin(finalTheta) * Math.sin(finalPhi)
      ]);
    });
  });

  return positions;
};

// Position nodes on flat plane for 2D mind map view (radial tree layout)
const calculatePlanePositions = (visibleTopics, focusedId) => {
  const positions = new Map();
  
  if (visibleTopics.length === 0) return positions;
  
  // If no focused topic, pick the first one
  const actualFocusId = focusedId || visibleTopics[0]?.id;
  const focusedTopic = visibleTopics.find(t => t.id === actualFocusId);

  if (!focusedTopic) return positions;

  // Focus node at center
  positions.set(actualFocusId, [0, 0, 0]);

  // Group by degree
  const byDegree = {};
  visibleTopics.forEach(topic => {
    if (topic.id !== actualFocusId) {
      const deg = topic.degree || 1;
      if (!byDegree[deg]) byDegree[deg] = [];
      byDegree[deg].push(topic);
    }
  });

  // Position in concentric circles with consistent spacing
  const degreeKeys = Object.keys(byDegree).sort((a, b) => parseInt(a) - parseInt(b));
  
  degreeKeys.forEach(deg => {
    const nodes = byDegree[deg];
    const degNum = parseInt(deg);
    const count = nodes.length;
    const baseRadius = 6; // Base radius for first degree
    const radius = baseRadius + (degNum - 1) * 5; // 5 units between each degree level
    
    // Calculate starting angle offset for visual balance
    const angleOffset = degNum * 0.3;

    nodes.forEach((topic, i) => {
      const angle = angleOffset + (i / count) * Math.PI * 2;
      positions.set(topic.id, [
        Math.cos(angle) * radius,
        0, // Flat on Y=0 plane
        Math.sin(angle) * radius
      ]);
    });
  });

  return positions;
};

const useStore = create((set, get) => ({
  // ============ AUTH STATE ============
  user: null,
  authLoading: true,
  authError: null,
  _unsubscribeFirebase: null, // Internal: cleanup function for Firebase subscriptions

  // ============ DATA (synced from Firebase) ============
  topics: [],
  tags: {}, // { tagName: { count: number } }
  isLoading: false,

  // ============ VIEW STATE ============
  activeTab: 'plane', // 'plane' | 'list' | 'sphere' | 'profile'
  showAddForm: false, // Show/hide add topic modal

  // ============ GRAPH STATE ============
  focusedNodeId: null,
  maxDegree: 1,
  activeTagFilters: [],
  selectedNode: null,
  gyroEnabled: false,

  // ============ AUTH ACTIONS ============

  // Initialize auth listener - call this once on app start
  initializeAuth: () => {
    const unsubscribe = subscribeToAuthState((user) => {
      const state = get();

      // Cleanup previous Firebase subscriptions
      if (state._unsubscribeFirebase) {
        state._unsubscribeFirebase();
      }

      set({
        user,
        authLoading: false,
        authError: null,
        topics: [],
        tags: {},
        focusedNodeId: null,
        isLoading: !!user // Only loading if user is present
      });

      // If logged in, subscribe to user's data
      if (user) {
        const unsubFirebase = get().initializeFirebase(user.uid);
        set({ _unsubscribeFirebase: unsubFirebase });
      }
    });

    return unsubscribe;
  },

  setAuthError: (error) => set({ authError: error }),

  signOut: async () => {
    try {
      await logout();
      // Auth state change listener will handle cleanup
    } catch (error) {
      console.error('Sign out error:', error);
      set({ authError: error.message });
    }
  },

  // ============ VIEW ACTIONS ============

  // Set active tab
  setActiveTab: (tab) => set({ activeTab: tab }),

  // Toggle add form
  openAddForm: () => set({ showAddForm: true }),
  closeAddForm: () => set({ showAddForm: false }),

  // Add new topic (Firebase)
  addTopic: async (topic) => {
    const { user } = get();
    if (!user) {
      console.error('Cannot add topic: not authenticated');
      return;
    }

    try {
      set({ showAddForm: false });
      const topicId = await firebaseAddTopic(user.uid, topic);
      // Auto-focus new topic (Firebase listener will update the topics array)
      set({ focusedNodeId: topicId });
    } catch (error) {
      console.error('Failed to add topic:', error);
      // Reopen form on error
      set({ showAddForm: true });
    }
  },

  // Update existing topic (Firebase)
  updateTopic: async (topicId, updates, oldTags, newTags) => {
    const { user } = get();
    if (!user) {
      console.error('Cannot update topic: not authenticated');
      return;
    }

    try {
      set({ selectedNode: null });
      await firebaseUpdateTopic(user.uid, topicId, updates, oldTags, newTags);
    } catch (error) {
      console.error('Failed to update topic:', error);
    }
  },

  // Delete topic (Firebase)
  deleteTopic: async (id) => {
    const { user, topics, selectedNode, focusedNodeId } = get();
    if (!user) {
      console.error('Cannot delete topic: not authenticated');
      return;
    }

    const topic = topics.find(t => t.id === id);
    if (!topic) return;

    try {
      await firebaseDeleteTopic(user.uid, id, topic.tags);
      // Update local UI state
      set({
        selectedNode: selectedNode === id ? null : selectedNode,
        focusedNodeId: focusedNodeId === id
          ? (topics.find(t => t.id !== id)?.id || null)
          : focusedNodeId
      });
    } catch (error) {
      console.error('Failed to delete topic:', error);
    }
  },

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

  // ============ FIREBASE SYNC ============
  initializeFirebase: (userId) => {
    if (!userId) {
      set({ isLoading: false });
      return () => {};
    }

    set({ isLoading: true });

    // Subscribe to user's topics
    const unsubTopics = subscribeToTopics(
      userId,
      (topics) => {
        set({ topics, isLoading: false });
        // Auto-focus first topic if none focused
        const state = get();
        if (!state.focusedNodeId && topics.length > 0) {
          set({ focusedNodeId: topics[0].id });
        }
      },
      (error) => {
        console.error('Topics subscription error:', error);
        set({ isLoading: false });
      }
    );

    // Subscribe to user's tags
    const unsubTags = subscribeToTags(
      userId,
      (tags) => set({ tags }),
      (error) => console.error('Tags subscription error:', error)
    );

    // Return cleanup function
    return () => {
      unsubTopics();
      unsubTags();
    };
  },

  setTopics: (topics) => {
    set({ topics, isLoading: false });
    // Auto-focus first topic if none focused
    if (!get().focusedNodeId && topics.length > 0) {
      set({ focusedNodeId: topics[0].id });
    }
  },

  setTags: (tags) => set({ tags }),

  setLoading: (isLoading) => set({ isLoading }),

  // ============ COMPUTED VALUES ============
  getVisibleNodes: () => {
    const { topics, focusedNodeId, maxDegree, activeTagFilters, activeTab } = get();

    if (topics.length === 0) return [];

    // Calculate degrees from focus
    const degrees = focusedNodeId ? calculateDegrees(focusedNodeId, topics) : new Map();

    // Filter by degree and tags
    let visible = topics.filter(topic => {
      const degree = degrees.get(topic.id);

      // If no focused node, show all at degree 0
      if (!focusedNodeId) return true;

      if (degree === undefined || degree > maxDegree) return false;

      // Tag filter
      if (activeTagFilters.length > 0) {
        return topic.tags.some(tag => activeTagFilters.includes(tag));
      }
      return true;
    });

    // Add degree info and color
    visible = visible.map(topic => ({
      ...topic,
      degree: degrees.get(topic.id) || 0,
      color: getTopicColor(topic)
    }));

    // Calculate positions based on active view
    const positions = activeTab === 'sphere'
      ? calculateSpherePositions(visible, focusedNodeId)
      : calculatePlanePositions(visible, focusedNodeId);

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
  },

  // Get all unique tags from topics
  getAllTags: () => {
    const { topics } = get();
    const tagSet = new Set();
    topics.forEach(topic => topic.tags.forEach(tag => tagSet.add(tag)));
    return Array.from(tagSet).sort();
  }
}));

export default useStore;
