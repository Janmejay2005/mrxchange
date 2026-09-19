import React, { useEffect, useState } from 'react';
import { Smartphone, Loader2 } from 'lucide-react';

export default function SplashScreen({ onFinish }) {
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFading(true);
      const finishTimer = setTimeout(() => {
        onFinish && onFinish();
      }, 400);
      return () => clearTimeout(finishTimer);
    }, 1200);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: '#0b132b',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        transition: 'opacity 0.4s ease, transform 0.4s ease',
        opacity: fading ? 0 : 1,
        transform: fading ? 'scale(1.02)' : 'scale(1)',
        pointerEvents: fading ? 'none' : 'auto'
      }}
    >
      <div 
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          backgroundColor: '#0284c7',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(2, 132, 199, 0.4)',
          marginBottom: '20px',
          animation: 'pulseIcon 1.5s infinite ease-in-out'
        }}
      >
        <Smartphone size={40} color="#ffffff" />
      </div>

      <h1 
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.5px',
          margin: 0
        }}
      >
        MR.X.CHANGE
      </h1>

      <p 
        style={{
          fontSize: '13px',
          color: '#94a3b8',
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          marginTop: '6px',
          fontWeight: 600
        }}
      >
        Mobile Exchange • Inventory • Central Ledger
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '32px', color: '#38bdf8', fontSize: '12px', fontWeight: 600 }}>
        <Loader2 size={16} className="animate-spin" />
        <span>Initializing system...</span>
      </div>

      <style>{`
        @keyframes pulseIcon {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
