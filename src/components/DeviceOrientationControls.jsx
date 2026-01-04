import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function DeviceOrientationControls({ enabled }) {
  const { camera } = useThree();
  const orientation = useRef({ alpha: 0, beta: 90, gamma: 0 });
  const screenOrientation = useRef(0);
  
  useEffect(() => {
    if (!enabled) return;
    
    const handleOrientation = (event) => {
      if (event.alpha !== null) {
        orientation.current = {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        };
      }
    };
    
    const handleOrientationChange = () => {
      screenOrientation.current = window.orientation || 0;
    };
    
    // Request permission on iOS 13+
    const requestPermission = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', handleOrientation);
          }
        } catch (error) {
          console.warn('Device orientation permission denied:', error);
        }
      } else {
        window.addEventListener('deviceorientation', handleOrientation);
      }
    };
    
    requestPermission();
    window.addEventListener('orientationchange', handleOrientationChange);
    handleOrientationChange();
    
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [enabled]);
  
  useFrame(() => {
    if (!enabled) return;
    
    const { alpha, beta, gamma } = orientation.current;
    const orient = screenOrientation.current;
    
    // Convert to radians
    const alphaRad = THREE.MathUtils.degToRad(alpha);
    const betaRad = THREE.MathUtils.degToRad(beta);
    const gammaRad = THREE.MathUtils.degToRad(gamma);
    const orientRad = THREE.MathUtils.degToRad(orient);
    
    // Create rotation quaternion
    const q = new THREE.Quaternion();
    const euler = new THREE.Euler();
    
    // Correct orientation mapping
    euler.set(betaRad, -alphaRad, -gammaRad, 'YXZ');
    q.setFromEuler(euler);
    
    // Apply world correction - flip to put south pole at bottom
    const worldFix = new THREE.Quaternion();
    worldFix.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    q.multiply(worldFix);
    
    // Apply screen orientation (portrait vs landscape)
    const screenFix = new THREE.Quaternion();
    screenFix.setFromAxisAngle(new THREE.Vector3(0, 0, 1), -orientRad);
    q.multiply(screenFix);
    
    // Apply to camera
    camera.quaternion.copy(q);
  });
  
  return null;
}
