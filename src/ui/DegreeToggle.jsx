import useStore from '../store/useStore';
import './UI.css';

export default function DegreeToggle() {
  const maxDegree = useStore((s) => s.maxDegree);
  const setMaxDegree = useStore((s) => s.setMaxDegree);
  
  return (
    <div className="degree-toggle">
      <span className="label">Depth:</span>
      {[1, 2, 3].map((deg) => (
        <button
          key={deg}
          className={`degree-btn ${maxDegree === deg ? 'active' : ''}`}
          onClick={() => setMaxDegree(deg)}
        >
          {deg}°
        </button>
      ))}
    </div>
  );
}
