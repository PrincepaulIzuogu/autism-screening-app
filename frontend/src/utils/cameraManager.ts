declare global {
  interface Window {
    __frameId?: number;
  }
}

let mediaStream: MediaStream | null = null;
let videoElement: HTMLVideoElement | null = null;
let camera: any = null;
let faceMesh: any = null;

export function setCameraResources(
  vid: HTMLVideoElement,
  stream: MediaStream,
  cam: any,
  mesh: any
) {
  videoElement = vid;
  mediaStream = stream;
  camera = cam;
  faceMesh = mesh;
}

export async function stopCameraResources(): Promise<void> {
  console.log('[cameraManager] Stopping camera resources...');

  return new Promise((resolve) => {
    try {
      if (faceMesh) {
        faceMesh.close();
        faceMesh = null;
      }

      if (camera) {
        try {
          camera.stop();
        } catch (e) {
          console.warn('Camera stop error:', e);
        }
        camera = null;
      }

      if (window.__frameId) {
        cancelAnimationFrame(window.__frameId);
        window.__frameId = undefined;
      }

      if (mediaStream) {
        mediaStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {
            console.warn('[cameraManager] Track stop error:', e);
          }
        });
        mediaStream = null;
      }

      if (videoElement) {
        videoElement.pause();
        videoElement.srcObject = null;
        videoElement.removeAttribute('src');
        videoElement.load();
        videoElement = null;
      }

      setTimeout(resolve, 300); // delay to ensure teardown completes
    } catch (err) {
      console.error('[cameraManager] Error stopping camera:', err);
      resolve();
    }
  });
}
