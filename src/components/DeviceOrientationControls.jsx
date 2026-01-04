import { useRef, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Proper DeviceOrientation to Quaternion conversion based on W3C spec
// Reference: https://w3c.github.io/deviceorientation/

const _zee = new THREE.Vector3(0, 0, 1);
const _euler = new THREE.Euler();
const _q0 = new THREE.Quaternion();
const _q1 = new THREE.Quaternion(-Math.sqrt(0.5), 0, 0, Math.sqrt(0.5)); // -90° around X

function setObjectQuaternion(quaternion, alpha, beta, gamma, orient) {
  // 'ZXY' for device orientation
  _euler.set(beta, alpha, -gamma, 'YXZ');
  quaternion.setFromEuler(_euler);
  
  // Camera looks out the back of the device, not the top
  quaternion.multiply(_q1);
  
  // Adjust for screen orientation
  _q0.setFromAxisAngle(_zee, -orient);
  quaternion.multiply(_q0);
}

export default function DeviceOrientationControls({ enabled }) {
  const { camera } = useThree();
  
  // Store raw orientation values
  const deviceOrientation = useRef({ alpha: 0, beta: 0, gamma: 0 });
  const screenOrientation = useRef(0);
  
  // Smoothed quaternion for stable output
  const targetQuaternion = useRef(new THREE.Quaternion());
  const currentQuaternion = useRef(new THREE.Quaternion());
  const isFirstReading = useRef(true);
  
  // Smoothing factor (lower = smoother but more lag)
  const SMOOTHING = 0.15;
  
  useEffect(() => {
    if (!enabled) {
      isFirstReading.current = true;
      return;
    }
    
    const onDeviceOrientation = (event) => {
      if (event.alpha !== null) {
        deviceOrientation.current = {
          alpha: event.alpha,
          beta: event.beta,
          gamma: event.gamma
        };
      }
    };
    
    const onScreenOrientationChange = () => {
      screenOrientation.current = window.orientation || 0;
    };
    
    // Request permission on iOS 13+
    const connect = async () => {
      if (typeof DeviceOrientationEvent !== 'undefined' && 
          typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          const permission = await DeviceOrientationEvent.requestPermission();
          if (permission === 'granted') {
            window.addEventListener('deviceorientation', onDeviceOrientation);
          }
        } catch (error) {
          console.warn('Device orientation permission denied:', error);
        }
      } else {
        window.addEventListener('deviceorientation', onDeviceOrientation);
      }
    };
    
    connect();
    window.addEventListener('orientationchange', onScreenOrientationChange);
    onScreenOrientationChange();
    
    return () => {
      window.removeEventListener('deviceorientation', onDeviceOrientation);
      window.removeEventListener('orientationchange', onScreenOrientationChange);
    };
  }, [enabled]);
  
  useFrame(() => {
    if (!enabled) return;
    
    const { alpha, beta, gamma } = deviceOrientation.current;
    const orient = screenOrientation.current;
    
    // Convert to radians
    const alphaRad = THREE.MathUtils.degToRad(alpha);
    const betaRad = THREE.MathUtils.degToRad(beta);
    const gammaRad = THREE.MathUtils.degToRad(gamma);
    const orientRad = THREE.MathUtils.degToRad(orient);
    
    // Calculate target quaternion
    setObjectQuaternion(targetQuaternion.current, alphaRad, betaRad, gammaRad, orientRad);
    
    if (isFirstReading.current) {
      // Snap to initial position without smoothing
      currentQuaternion.current.copy(targetQuaternion.current);
      isFirstReading.current = false;
    } else {
      // Smooth interpolation to reduce jitter
      currentQuaternion.current.slerp(targetQuaternion.current, SMOOTHING);
    }
    
    // Apply to camera
    camera.quaternion.copy(currentQuaternion.current);
  });
  
  return null;
}
