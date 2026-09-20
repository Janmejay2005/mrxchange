import React, { useEffect, useState } from 'react';
import { Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState('Initializing system core...');
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Smooth progress counter from 0 to 100% over ~1600ms
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        const next = prev + Math.floor(Math.random() * 8) + 4;
        return next > 100 ? 100 : next;
      });
    }, 55);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress < 35) {
      setStageText('Initializing system core...');
    } else if (progress < 70) {
      setStageText('Synchronizing inventory & ledgers...');
    } else if (progress < 98) {
      setStageText('Verifying permissions & security...');
    } else {
      setStageText('Welcome to MR.X.Change');
      const fadeTimer = setTimeout(() => {
        setFading(true);
        const finishTimer = setTimeout(() => {
          onFinish && onFinish();
        }, 350);
        return () => clearTimeout(finishTimer);
      }, 250);
      return () => clearTimeout(fadeTimer);
    }
  }, [progress, onFinish]);

  return (
    <div 
      className={`splash-container ${fading ? 'fade-out' : ''}`}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0b132b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        transition: 'opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s ease',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.03)' : 'scale(1)',
        pointerEvents: fading ? 'none' : 'auto',
        overflow: 'hidden'
      }}
    >
      {/* Background radial glow */}
      <div 
        style={{
          position: 'absolute',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(2, 132, 199, 0.15) 0%, rgba(11, 19, 43, 0) 70%)',
          pointerEvents: 'none'
        }} 
      />

      {/* Pulsing Brand Icon */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
        <div className="splash-pulse-ring" />
        <div 
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '22px',
            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 16px 36px rgba(2, 132, 199, 0.45)',
            position: 'relative',
            zIndex: 2
          }}
        >
          <Smartphone size={42} color="#ffffff" strokeWidth={2.2} />
        </div>
      </div>

      {/* Brand Title */}
      <h1 
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.5px',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
      >
        MR.X.CHANGE
      </h1>

      <p 
        style={{
          fontSize: '12px',
          color: '#94a3b8',
          letterSpacing: '1px',
          textTransform: 'uppercase',
          marginTop: '6px',
          fontWeight: 600
        }}
      >
        Mobile Exchange • Inventory • Central Ledger
      </p>

      {/* Dynamic Loading Progress Bar */}
      <div style={{ width: '240px', marginTop: '36px' }}>
        <div 
          style={{
            width: '100%',
            height: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)'
          }}
        >
          <div 
            style={{
              width: `${progress}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #38bdf8, #0284c7)',
              borderRadius: '10px',
              transition: 'width 0.1s linear',
              boxShadow: '0 0 12px rgba(56, 189, 248, 0.7)'
            }}
          />
        </div>

        {/* Progress % and Status Text */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '12px' }}>
          <span style={{ color: '#94a3b8', fontWeight: 500, fontSize: '11px' }}>
            {stageText}
          </span>
          <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'monospace' }}>
            {progress}%
          </span>
        </div>
      </div>

      <style>{`
        .splash-pulse-ring {
          position: absolute;
          inset: -10px;
          border-radius: 30px;
          border: 2px solid rgba(56, 189, 248, 0.35);
          animation: splashPulseRing 2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
          pointer-events: none;
        }
        @keyframes splashPulseRing {
          0% { transform: scale(0.95); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 0; }
          100% { transform: scale(0.95); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

