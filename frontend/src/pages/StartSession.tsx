import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

const StartSession = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();

  const [showModal, setShowModal] = useState(true);
  const [faceMeshInstance, setFaceMeshInstance] = useState<FaceMesh | null>(null);
  const cameraRef = useRef<cam.Camera | null>(null);

  const cleanupCamera = async () => {
    const video = videoRef.current;

    if (cameraRef.current) {
      cameraRef.current.stop();
      cameraRef.current = null;
    }

    if (faceMeshInstance) {
      await faceMeshInstance.close();
      setFaceMeshInstance(null);
    }

    if (video?.srcObject) {
      const tracks = (video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      video.srcObject = null;
    }
  };

  useEffect(() => {
    let active = true;

    const initialize = async () => {
      const video = videoRef.current!;
      const canvas = canvasRef.current!;
      const ctx = canvas?.getContext('2d');
      if (!ctx) return;

      try {
        const faceMesh = new FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`,
        });

        faceMesh.setOptions({
          maxNumFaces: 1,
          refineLandmarks: true,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        faceMesh.onResults((results) => {
          if (!active || !ctx || !canvas || !results.image) return;

          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

          const faces = results.multiFaceLandmarks;
          if (faces && faces.length > 0) {
            const [left, right] = [faces[0][468], faces[0][473]];
            [left, right].forEach(p => {
              if (p) {
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, 4, 0, 2 * Math.PI);
                ctx.fillStyle = '#00FF00';
                ctx.fill();
              }
            });
          }

          ctx.restore();
        });

        await navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
          video.srcObject = stream;

          const camera = new cam.Camera(video, {
            onFrame: async () => {
              if (active) {
                await faceMesh.send({ image: video });
              }
            },
            width: 640,
            height: 480,
          });

          cameraRef.current = camera;
          camera.start();
          setFaceMeshInstance(faceMesh);
        });
      } catch (err) {
        console.error('❌ Failed to start FaceMesh:', err);
        alert("Camera or facial landmark loading failed. Please refresh the page.");
      }
    };

    initialize();

    return () => {
      active = false;
      cleanupCamera();
    };
  }, []);

  const handleNavigate = async (path: string) => {
    await cleanupCamera();
    navigate(path);
  };

  return (
    <AppLayout>
      <div className="min-h-screen flex flex-col items-center justify-start pt-8 px-4 relative">
        <div className="relative w-full max-w-2xl aspect-video bg-black rounded-lg overflow-hidden shadow-md border">
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full object-cover"
            playsInline
            muted
            autoPlay
          />
          <canvas
            ref={canvasRef}
            width={640}
            height={480}
            className="absolute top-0 left-0 w-full h-full"
          />
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={() => handleNavigate('/screening')}
            className="bg-blue-800 text-white px-6 py-2 rounded-md hover:bg-blue-900"
          >
            Start Screening
          </button>
          <button
            onClick={() => handleNavigate('/dashboard')}
            className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
          >
            Cancel
          </button>
        </div>

        {showModal && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center space-y-4">
              <h3 className="text-xl font-semibold text-blue-800">Before You Start</h3>
              <ul className="text-gray-700 text-left list-disc list-inside space-y-1">
                <li>Ensure the child’s face is clearly visible in the camera.</li>
                <li>Use a well-lit space, avoid shadows.</li>
                <li>Keep the child centered and still.</li>
                <li>The process takes only a few minutes.</li>
              </ul>
              <button
                onClick={() => setShowModal(false)}
                className="mt-4 bg-blue-800 text-white px-4 py-2 rounded hover:bg-blue-900"
              >
                I Understand
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default StartSession;
