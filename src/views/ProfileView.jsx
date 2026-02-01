import useStore from '../store/useStore';
import { generateColorFromString } from '../utils/colorGenerator';
import './Views.css';

export default function ProfileView() {
  const topics = useStore((s) => s.topics);
  const tags = useStore((s) => s.tags);
  const getAllTags = useStore((s) => s.getAllTags);
  const user = useStore((s) => s.user);
  const signOut = useStore((s) => s.signOut);

  const allTags = getAllTags();
  const topicCount = topics.length;

  // Calculate tag statistics
  const tagStats = allTags.map(tag => ({
    name: tag,
    count: topics.filter(t => t.tags.includes(tag)).length,
    color: generateColorFromString(tag)
  })).sort((a, b) => b.count - a.count);

  return (
    <div className="profile-view">
      {/* User Profile Section */}
      <section className="profile-section user-section">
        <div className="user-info">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="Profile" className="user-avatar" />
          ) : (
            <div className="user-avatar-placeholder">
              {user?.displayName?.[0] || user?.email?.[0] || '?'}
            </div>
          )}
          <div className="user-details">
            <h2 className="user-name">{user?.displayName || 'User'}</h2>
            <p className="user-email">{user?.email}</p>
          </div>
        </div>
        <button className="sign-out-btn" onClick={signOut}>
          Sign Out
        </button>
      </section>

      {/* Stats Section */}
      <section className="profile-section">
        <h2>Overview</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-value">{topicCount}</span>
            <span className="stat-label">Topics</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{allTags.length}</span>
            <span className="stat-label">Tags</span>
          </div>
        </div>
      </section>

      {/* Tag Distribution */}
      <section className="profile-section">
        <h2>Tag Distribution</h2>
        {tagStats.length === 0 ? (
          <p className="empty-message">No tags yet. Add topics to see distribution.</p>
        ) : (
          <div className="tag-distribution">
            {tagStats.map((tag) => (
              <div key={tag.name} className="tag-stat-row">
                <div className="tag-stat-info">
                  <span
                    className="tag-stat-dot"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="tag-stat-name">{tag.name}</span>
                </div>
                <div className="tag-stat-bar-container">
                  <div
                    className="tag-stat-bar"
                    style={{
                      width: `${(tag.count / topicCount) * 100}%`,
                      backgroundColor: tag.color
                    }}
                  />
                </div>
                <span className="tag-stat-count">{tag.count}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* About Section */}
      <section className="profile-section">
        <h2>About Synapse</h2>
        <p className="about-text">
          A knowledge graph app for UPSC aspirants to track and connect daily news topics.
          Visualize relationships between current affairs to better understand the big picture.
        </p>
      </section>
    </div>
  );
}
