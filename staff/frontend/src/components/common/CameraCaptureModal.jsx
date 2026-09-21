import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, RefreshCw, CheckCircle } from 'lucide-react';

export default function CameraCaptureModal({ isOpen, onClose, onCapture }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [facingMode, setFacingMode] = useState('environment'); // 'user' or 'environment'
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode]);

  const startCamera = async () => {
    setErrorMsg('');
    stopCamera();
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setErrorMsg('Could not open live camera preview. Please check browser permissions or use the native camera upload option below.');
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const handleSnapPhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      onCapture(dataUrl);
      stopCamera();
      onClose();
    }
  };

  const handleNativeCameraChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onCapture(reader.result);
        onClose();
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFacingMode = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-card" style={{ maxWidth: '540px', borderRadius: '16px', padding: '20px', background: '#0f172a', color: '#ffffff' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #334155', paddingBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>Live Camera Capture</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={22} />
          </button>
        </div>

        {/* Video stream container */}
        <div style={{ position: 'relative', width: '100%', height: '320px', background: '#000000', borderRadius: '12px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #334155' }}>
          {errorMsg ? (
            <div style={{ padding: '20px', textAlign: 'center', color: '#f87171', fontSize: '13px' }}>
              <p>{errorMsg}</p>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()} 
                style={{ marginTop: '10px', background: '#0284c7', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 700 }}
              >
                📷 Open Native Device Camera
              </button>
            </div>
          ) : (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          )}

          {/* Toggle camera flip button */}
          {!errorMsg && (
            <button 
              type="button"
              onClick={toggleFacingMode} 
              style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(15,23,42,0.75)', border: '1px solid #475569', color: '#fff', padding: '8px', borderRadius: '50%', cursor: 'pointer' }}
              title="Flip Camera"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />
        <input 
          type="file" 
          accept="image/*" 
          capture="environment" 
          ref={fileInputRef} 
          onChange={handleNativeCameraChange} 
          style={{ display: 'none' }} 
        />

        {/* Footer controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()} 
            style={{ background: '#334155', color: '#cbd5e1', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
          >
            Use File / Mobile Camera
          </button>

          {!errorMsg && (
            <button 
              type="button" 
              onClick={handleSnapPhoto} 
              style={{ background: '#0284c7', color: '#ffffff', border: 'none', padding: '10px 24px', borderRadius: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <CheckCircle size={18} /> Push Photo to Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
