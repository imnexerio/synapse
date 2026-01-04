import { useMemo } from 'react';
import TopicNode from './TopicNode';
import useStore from '../store/useStore';

export default function GraphNetwork() {
  // Get state values directly to trigger re-renders
  const topics = useStore((s) => s.topics);
  const focusedNodeId = useStore((s) => s.focusedNodeId);
  const maxDegree = useStore((s) => s.maxDegree);
  const activeTagFilters = useStore((s) => s.activeTagFilters);
  const getVisibleNodes = useStore((s) => s.getVisibleNodes);
  
  // Compute visible nodes
  const visibleNodes = useMemo(() => getVisibleNodes(), [topics, focusedNodeId, maxDegree, activeTagFilters, getVisibleNodes]);
  
  return (
    <group>
      {visibleNodes.map((topic) => (
        <TopicNode key={topic.id} topic={topic} />
      ))}
    </group>
  );
}
