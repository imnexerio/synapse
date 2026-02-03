import { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import Dagre from 'dagre';
import '@xyflow/react/dist/style.css';
import useStore from '../store/useStore';
import { getTopicColor } from '../utils/colorGenerator';
import TopicNode from '../components/TopicNode2D';
import './Views.css';

// Custom node types
const nodeTypes = {
  topic: TopicNode,
};

const NODE_WIDTH = 180;
const NODE_HEIGHT = 80;

// Apply dagre layout to nodes
const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const dagreGraph = new Dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({ 
    rankdir: direction,
    ranksep: 80,
    nodesep: 50,
    edgesep: 20,
  });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  Dagre.layout(dagreGraph);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - NODE_HEIGHT / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

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

    allTopics.forEach(topic => {
      if (!degrees.has(topic.id) && getSharedTags(currentTopic, topic).length > 0) {
        degrees.set(topic.id, currentDegree + 1);
        queue.push(topic.id);
      }
    });
  }

  return degrees;
};

export default function PlaneView() {
  const topics = useStore((s) => s.topics);
  const isLoading = useStore((s) => s.isLoading);
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const maxDegree = useStore((s) => s.maxDegree);
  const activeTagFilters = useStore((s) => s.activeTagFilters);
  const selectNode = useStore((s) => s.selectNode);
  const setFocusedNode = useStore((s) => s.setFocusedNode);

  // Generate nodes and edges from topics
  const { initialNodes, initialEdges } = useMemo(() => {
    if (topics.length === 0) {
      return { initialNodes: [], initialEdges: [] };
    }

    // Calculate degrees from focused node (or first topic)
    const effectiveFocusId = focusedNodeId || topics[0]?.id;
    const degrees = effectiveFocusId ? calculateDegrees(effectiveFocusId, topics) : new Map();

    // Filter visible topics - show all if no connections exist
    let visibleTopics = topics.filter(topic => {
      const degree = degrees.get(topic.id);
      
      // If no focus or topic has no connections, show it anyway
      if (!effectiveFocusId) return true;
      
      // Always show focused topic
      if (topic.id === effectiveFocusId) return true;
      
      // If topic is not reachable via shared tags, show it at max degree + 1
      // unless maxDegree is very restrictive
      if (degree === undefined) {
        return maxDegree >= 2; // Show unconnected topics if degree allows
      }
      
      if (degree > maxDegree) return false;

      // Tag filter
      if (activeTagFilters.length > 0) {
        return topic.tags.some(tag => activeTagFilters.includes(tag));
      }
      return true;
    });

    // If filter is too restrictive, at least show all topics
    if (visibleTopics.length === 0) {
      visibleTopics = topics;
    }

    // Create nodes
    const nodes = visibleTopics.map((topic, index) => ({
      id: topic.id,
      type: 'topic',
      data: {
        ...topic,
        color: getTopicColor(topic),
        degree: degrees.get(topic.id) ?? 99,
        isFocused: topic.id === effectiveFocusId,
      },
      // Default position in case dagre fails
      position: { x: (index % 3) * 220, y: Math.floor(index / 3) * 120 },
    }));

    // Create edges (connections based on shared tags)
    const edges = [];
    for (let i = 0; i < visibleTopics.length; i++) {
      for (let j = i + 1; j < visibleTopics.length; j++) {
        const shared = getSharedTags(visibleTopics[i], visibleTopics[j]);
        if (shared.length > 0) {
          const fromColor = getTopicColor(visibleTopics[i]);
          edges.push({
            id: `e-${visibleTopics[i].id}-${visibleTopics[j].id}`,
            source: visibleTopics[i].id,
            target: visibleTopics[j].id,
            type: 'default',
            animated: false,
            style: { 
              stroke: fromColor,
              strokeWidth: 2 + shared.length,
              opacity: 0.6,
            },
            markerEnd: {
              type: MarkerType.Arrow,
              color: fromColor,
            },
          });
        }
      }
    }

    // Apply layout only if we have nodes
    if (nodes.length > 0) {
      try {
        const result = getLayoutedElements(nodes, edges, 'TB');
        return { initialNodes: result.nodes, initialEdges: result.edges };
      } catch (err) {
        console.error('Dagre layout failed:', err);
        return { initialNodes: nodes, initialEdges: edges };
      }
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [topics, focusedNodeId, maxDegree, activeTagFilters]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges || []);

  // Update nodes/edges when data changes
  useEffect(() => {
    if (initialNodes) setNodes(initialNodes);
    if (initialEdges) setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Handle node click
  const onNodeClick = useCallback((event, node) => {
    selectNode(node.id);
  }, [selectNode]);

  // Handle node double click - set as focus
  const onNodeDoubleClick = useCallback((event, node) => {
    setFocusedNode(node.id);
  }, [setFocusedNode]);

  if (isLoading) {
    return (
      <div className="plane-view">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Loading topics...</p>
        </div>
      </div>
    );
  }

  if (topics.length === 0) {
    return (
      <div className="plane-view">
        <div className="empty-state">
          <span className="empty-icon">🗺️</span>
          <h2>No topics yet</h2>
          <p>Add topics to see your mind map</p>
        </div>
      </div>
    );
  }

  return (
    <div className="plane-view">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onNodeDoubleClick={onNodeDoubleClick}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        attributionPosition="bottom-left"
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#1a1a2e" gap={20} />
        <Controls 
          showInteractive={false}
          style={{ 
            background: 'rgba(0,0,0,0.7)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.1)'
          }}
        />
        <MiniMap
          nodeColor={(node) => node.data?.color || '#4ECDC4'}
          maskColor="rgba(0,0,0,0.8)"
          style={{
            background: 'rgba(10,10,15,0.9)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
