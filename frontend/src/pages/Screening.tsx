import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AppLayout from '../components/AppLayout';
import { FaceMesh } from '@mediapipe/face_mesh';
import * as cam from '@mediapipe/camera_utils';

import happy from '../assets/happy.gif';
import cry from '../assets/cry.gif';
import suprised from '../assets/suprised.gif';
import angry from '../assets/angry.gif';
import fear from '../assets/fear.gif';
import love from '../assets/love.gif';
import neutral from '../assets/neutral.gif';

const defaultMedia: Record<string, string> = {
  Happy: happy,
  Cry: cry,
  Surprised: suprised,
  Angry: angry,
  Fear: fear,
  Love: love,
  Neutral: neutral,
};

type Stimulus = { name: string; src: string };

const Screening = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraRef = useRef<cam.Camera | null>(null);
  const faceMeshRef = useRef<FaceMesh | null>(null);
  const screeningDataRef = useRef<any[]>([]); // store frames per stimulus

  const selected: Record<string, string> = JSON.parse(localStorage.getItem('selectedStimuli') || '{}');
  const moods = ['Happy', 'Cry', 'Surprised', 'Angry', 'Fear', 'Love', 'Neutral'];

  const stimuliList: Stimulus[] = moods.map((mood) => {
    const moodFace = `${mood} face`;
    const chosen = selected[mood];
    const src =
      chosen && chosen !== 'Default'
        ? `http://localhost:8000/stimuli/${chosen}`
        : defaultMedia[mood];
    return { name: moodFace, src };
  });

  const [currentStimulus, setCurrentStimulus] = useState<Stimulus | null>(null);
  const [stimulusIndex, setStimulusIndex] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [phase, setPhase] = useState<'countdown' | 'showing' | 'done'>('countdown');

  const cleanup = () => {
    cameraRef.current?.stop();
    faceMeshRef.current?.close();
  };

  useEffect(() => {
    setCurrentStimulus(null);
    screeningDataRef.current = [];
  }, []);

  useEffect(() => {
    if (stimulusIndex >= stimuliList.length) {
      setPhase('done');
      return;
    }
    if (phase === 'countdown') {
      setCurrentStimulus(stimuliList[stimulusIndex]);
      setCountdown(5);
    }
  }, [stimulusIndex, phase]);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      setPhase('showing');
      setCountdown(null);
      return;
    }
    const timer = setTimeout(() => setCountdown((prev) => (prev ? prev - 1 : 0)), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (phase === 'showing') {
      const timer = setTimeout(async () => {
        setPhase('countdown');
        const token = localStorage.getItem('token');
        const payload = [...screeningDataRef.current];
        screeningDataRef.current = [];

        try {
          await axios.post('http://localhost:8000/api/screening/batch', payload, {
            headers: { Authorization: `Bearer ${token}` },
          });
        } catch (error) {
          console.error('❌ Failed to send data for', currentStimulus?.name, error);
        }

        setStimulusIndex((prev) => prev + 1);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [phase, currentStimulus]);

  useEffect(() => {
    if (phase === 'done') {
      cleanup();
      navigate('/reports', { replace: true });
    }
  }, [phase, navigate]);

  useEffect(() => {
    const videoEl = videoRef.current;
    const canvasEl = canvasRef.current;
    const ctx = canvasEl?.getContext('2d');
    if (!videoEl || !canvasEl || !ctx) return;

    let cancelled = false;

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
      if (cancelled || !ctx || phase !== 'showing') return;

      ctx.save();
      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
      ctx.drawImage(results.image, 0, 0, canvasEl.width, canvasEl.height);

      if (results.multiFaceLandmarks && currentStimulus) {
        const landmarks = results.multiFaceLandmarks[0];
        const left = landmarks[468];
        const right = landmarks[473];

        if (left) {
          ctx.beginPath();
          ctx.arc(left.x * canvasEl.width, left.y * canvasEl.height, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#00FF00';
          ctx.fill();
        }

        if (right) {
          ctx.beginPath();
          ctx.arc(right.x * canvasEl.width, right.y * canvasEl.height, 4, 0, 2 * Math.PI);
          ctx.fillStyle = '#00FF00';
          ctx.fill();
        }

        const payload = {
          timestamp: new Date().toISOString(),
          stimulus: currentStimulus.name,
          frame: canvasEl.toDataURL('image/jpeg').split(',')[1],
        };

        screeningDataRef.current.push(payload);
      }

      ctx.restore();
    });

    faceMeshRef.current = faceMesh;

    const camera = new cam.Camera(videoEl, {
      onFrame: async () => {
        if (!cancelled && phase === 'showing') {
          await faceMesh.send({ image: videoEl });
        }
      },
      width: 640,
      height: 480,
    });

    cameraRef.current = camera;
    camera.start();

    return () => {
      cancelled = true;
      cleanup();
    };
  }, [currentStimulus, phase]);

  return (
    <AppLayout>
      <div className="h-screen relative flex flex-col items-center justify-start pt-8 bg-white text-center px-4 overflow-hidden">
        {countdown !== null ? (
          <div className="mt-4">
            <h2 className="text-4xl font-semibold text-blue-800 mb-2">
              {currentStimulus?.name} in {countdown}...
            </h2>
            <p className="text-gray-500 text-sm">
              Next: {stimuliList[stimulusIndex + 1]?.name || 'End'}
            </p>
          </div>
        ) : currentStimulus ? (
          <img
            src={currentStimulus.src}
            alt={currentStimulus.name}
            className="w-[500px] h-[500px] object-cover rounded-lg shadow-lg mt-6"
          />
        ) : null}

        {phase !== 'done' && (
          <div className="absolute bottom-20 right-4 w-32 h-24 border border-gray-400 rounded overflow-hidden shadow-md z-10">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
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
        )}
      </div>
    </AppLayout>
  );
};

export default Screening;
