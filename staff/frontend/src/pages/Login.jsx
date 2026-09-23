import React, { useState } from 'react';
import { Smartphone, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState('Jeet@1');
  const [password, setPassword] = useState('jeetxchange');
  const [error, setError] = useState('');
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(identifier, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Invalid username or password. Please check credentials or contact Super Admin.');
    }
  };

  const fillCredentials = (userType) => {
    if (userType === 'JEET') {
      setIdentifier('Jeet@1');
      setPassword('jeetxchange');
    } else if (userType === 'SONAL') {
      setIdentifier('Sonal@1');
      setPassword('sonalxchange');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0b132b', padding: '20px' }}>
      <div style={{ background: '#ffffff', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '36px', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#e0f2fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px auto' }}>
            <Smartphone size={32} color="#0284c7" />
          </div>
          <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a' }}>MR.X.Change</h2>
          <p style={{ color: '#64748b', fontSize: '13px', marginTop: '4px' }}>Inventory & Finance Management Portal</p>
        </div>

        {error && (
          <div style={{ padding: '10px 14px', background: '#fee2e2', color: '#dc2626', borderRadius: '8px', fontSize: '13px', marginBottom: '16px', border: '1px solid #fca5a5' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group" style={{ marginBottom: '16px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Username</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Jeet@1 or Sonal@1"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '13px', color: '#334155' }}>Password</label>
            <input 
              type="password" 
              className="form-control" 
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '8px', opacity: loading ? 0.7 : 1, borderRadius: '8px', fontSize: '15px', fontWeight: 700 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Super Admin Quick Logins */}
        <div style={{ marginTop: '24px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#7c3aed" /> Super Admin Accounts:
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fillCredentials('JEET')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: identifier === 'Jeet@1' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: identifier === 'Jeet@1' ? '#e0f2fe' : '#ffffff',
                textAlign: 'left',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0369a1' }}>Jeet Patel</div>
              <div style={{ color: '#64748b' }}>Jeet@1</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('SONAL')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: identifier === 'Sonal@1' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                background: identifier === 'Sonal@1' ? '#f5f3ff' : '#ffffff',
                textAlign: 'left',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, color: '#7c3aed' }}>Sonal Sharma</div>
              <div style={{ color: '#64748b' }}>Sonal@1</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

