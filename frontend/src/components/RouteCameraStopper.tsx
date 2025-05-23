import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { stopCameraResources } from '../utils/cameraManager';

const RouteCameraStopper = () => {
  const location = useLocation();

  useEffect(() => {
    stopCameraResources(); // stop webcam and cleanup faceMesh
  }, [location.pathname]);

  return null;
};

export default RouteCameraStopper;
