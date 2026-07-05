import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

export default function QRScanner({ onScan, onCancel }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [error, setError] = useState('');
  const streamRef = useRef(null);
  const requestRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!active) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', true); // Required for iOS Safari
          videoRef.current.play();
          requestRef.current = requestAnimationFrame(tick);
        }
      } catch (err) {
        if (active) {
          setError('Unable to access camera. Please check permissions.');
        }
      }
    }

    function tick() {
      if (!active) return;
      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });

            if (code && code.data) {
              onScan(code.data);
              return; // Stop looping on successful scan
            }
          } catch (e) {
            // Ignore temporary canvas extraction errors
          }
        }
      }
      requestRef.current = requestAnimationFrame(tick);
    }

    startCamera();

    return () => {
      active = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [onScan]);

  return (
    <div className="relative w-full overflow-hidden rounded-lg bg-black border border-gray-200 dark:border-slate-700 aspect-square flex items-center justify-center">
      {error ? (
        <div className="p-5 text-center">
            <p className="text-3xl mb-2">📸</p>
            <p className="text-sm text-red-400">{error}</p>
            <button 
              onClick={onCancel}
              className="mt-4 px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
            >
              Go Back
            </button>
        </div>
      ) : (
        <>
          <video ref={videoRef} className="w-full h-full object-cover" />
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Scanning Overlay UI */}
          <div className="absolute inset-0 bg-black/40 z-10 pointer-events-none flex items-center justify-center">
            <div className="w-48 h-48 sm:w-56 sm:h-56 relative" style={{ boxShadow: '0 0 0 4000px rgba(0,0,0,0.4)' }}>
                {/* Clear the center using a trick, or simply use borders. Box shadow trick is better, but border is simpler. 
                    Actually, replacing the background with a 4-border div is perfectly transparent in the center! */}
                <div className="absolute inset-0 border-2 border-indigo-500/50"></div>
                {/* Corner accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-indigo-500"></div>
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-indigo-500"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-indigo-500"></div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-indigo-500"></div>
                
                {/* Scanning laser line animation */}
                <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_8px_2px_rgba(99,102,241,0.6)] animate-[scan_2s_ease-in-out_infinite] absolute top-0"></div>
            </div>
          </div>
          
          <button 
            onClick={onCancel}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-sm font-medium z-20 shadow-lg"
          >
            Cancel Scan
          </button>
        </>
      )}
    </div>
  );
}
