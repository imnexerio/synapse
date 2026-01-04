import useStore from '../store/useStore';

export default function GyroToggle() {
  const gyroEnabled = useStore((s) => s.gyroEnabled);
  const toggleGyro = useStore((s) => s.toggleGyro);
  
  const handleToggle = async () => {
    // Request permission on iOS before enabling
    if (!gyroEnabled && typeof DeviceOrientationEvent !== 'undefined' && 
        typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission !== 'granted') {
          alert('Gyroscope permission denied. Please allow access to use this feature.');
          return;
        }
      } catch (error) {
        console.warn('Permission request failed:', error);
        return;
      }
    }
    toggleGyro();
  };
  
  return (
    <button 
      className={`gyro-toggle ${gyroEnabled ? 'active' : ''}`}
      onClick={handleToggle}
      title={gyroEnabled ? 'Switch to touch controls' : 'Use device orientation'}
    >
      <span className="gyro-icon">📱</span>
      <span className="gyro-label">{gyroEnabled ? 'Gyro ON' : 'Gyro OFF'}</span>
    </button>
  );
}
