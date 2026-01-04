import React, { useState, useCallback } from 'react';
import { 
  View, 
  StyleSheet, 
  StatusBar, 
  SafeAreaView,
  Text,
  Alert,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Scene from './src/components/Scene';
import FilterPanel from './src/ui/FilterPanel';
import DegreeToggle from './src/ui/DegreeToggle';
import ControlModeToggle from './src/ui/ControlModeToggle';
import SearchBar from './src/ui/SearchBar';
import TopicModal from './src/ui/TopicModal';
import useStore from './src/store/useStore';
import useDeviceOrientation from './src/hooks/useDeviceOrientation';

/**
 * Main App Component
 * 3D Graph Explorer with 360° environment
 */
export default function App() {
  const [controlMode, setControlMode] = useState('touch');
  const isScenePaused = useStore((state) => state.isScenePaused);
  const focusedNodeId = useStore((state) => state.focusedNodeId);
  const topics = useStore((state) => state.topics);
  
  // Device orientation hook
  const {
    orientation,
    permissionGranted,
    isListening,
    requestPermission,
    startListening,
    stopListening,
  } = useDeviceOrientation();
  
  // Get focused topic info for display
  const focusedTopic = topics.find((t) => t.id === focusedNodeId);
  
  // Handle control mode change
  const handleModeChange = useCallback(async (mode) => {
    if (mode === 'gyro') {
      if (!permissionGranted) {
        const granted = await requestPermission();
        if (!granted) return;
      }
      
      const started = await startListening();
      if (started) {
        setControlMode('gyro');
      }
    } else {
      stopListening();
      setControlMode('touch');
    }
  }, [permissionGranted, requestPermission, startListening, stopListening]);
  
  // Handle gyro permission request
  const handleRequestGyroPermission = useCallback(async () => {
    const granted = await requestPermission();
    if (granted) {
      Alert.alert(
        'Permission Granted',
        'You can now use gyroscope mode. Tap the Gyro button again to activate.',
        [{ text: 'OK' }]
      );
    }
  }, [requestPermission]);
  
  return (
    <GestureHandlerRootView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* 3D Scene - Full screen */}
      <View style={styles.sceneContainer}>
        <Scene
          controlMode={controlMode}
          gyroData={controlMode === 'gyro' ? orientation : null}
          paused={isScenePaused}
        />
      </View>
      
      {/* UI Overlay */}
      <SafeAreaView style={[styles.uiOverlay, { pointerEvents: 'box-none' }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          {/* Search */}
          <View style={styles.searchContainer}>
            <SearchBar />
          </View>
          
          {/* Control Mode Toggle */}
          <ControlModeToggle
            mode={controlMode}
            onModeChange={handleModeChange}
            gyroPermissionGranted={permissionGranted}
            onRequestGyroPermission={handleRequestGyroPermission}
          />
        </View>
        
        {/* Current Focus Info */}
        {focusedTopic && (
          <View style={styles.focusInfo}>
            <View style={[styles.focusDot, { backgroundColor: focusedTopic.color }]} />
            <Text style={styles.focusTitle} numberOfLines={1}>
              {focusedTopic.title}
            </Text>
            <Text style={styles.focusHint}>Tap again for details</Text>
          </View>
        )}
        
        {/* Spacer */}
        <View style={styles.spacer} />
        
        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <DegreeToggle />
          <FilterPanel />
        </View>
      </SafeAreaView>
      
      {/* Detail Modal */}
      <TopicModal />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sceneContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  uiOverlay: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 15,
    paddingTop: 10,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
  },
  focusInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
    maxWidth: '80%',
  },
  focusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  focusTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    flexShrink: 1,
  },
  focusHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
  },
  spacer: {
    flex: 1,
  },
  bottomControls: {
    gap: 0,
  },
});
