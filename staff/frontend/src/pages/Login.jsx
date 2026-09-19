import React, { useState } from 'react';
import { Smartphone, Lock, User, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [identifier, setIdentifier] = useState('Staff23');
  const [password, setPassword] = useState('staff123');
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
      setError('Invalid credentials. Please try Staff23/staff123 or Admin23/admin123');
    }
  };

  const fillCredentials = (role) => {
    if (role === 'STAFF') {
      setIdentifier('Staff23');
      setPassword('staff123');
    } else {
      setIdentifier('Admin23');
      setPassword('admin123');
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
          <div className="form-group">
            <label className="form-label">Username or Email</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Staff23 or Admin23"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input 
                type="password" 
                className="form-control" 
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', justifyContent: 'center', padding: '12px', marginTop: '12px', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        {/* Quick Demo Credentials */}
        <div style={{ marginTop: '24px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#0284c7" /> Quick Demo Login (Click to Fill):
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => fillCredentials('STAFF')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: identifier === 'Staff23' ? '2px solid #0284c7' : '1px solid #cbd5e1',
                background: identifier === 'Staff23' ? '#e0f2fe' : '#ffffff',
                textAlign: 'left',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, color: '#0369a1' }}>Staff User</div>
              <div style={{ color: '#64748b' }}>Staff23 / staff123</div>
            </button>

            <button
              type="button"
              onClick={() => fillCredentials('SUPERADMIN')}
              style={{
                padding: '8px 10px',
                borderRadius: '8px',
                border: identifier === 'Admin23' ? '2px solid #7c3aed' : '1px solid #cbd5e1',
                background: identifier === 'Admin23' ? '#f5f3ff' : '#ffffff',
                textAlign: 'left',
                fontSize: '11px',
                cursor: 'pointer'
              }}
            >
              <div style={{ fontWeight: 700, color: '#7c3aed' }}>Superadmin</div>
              <div style={{ color: '#64748b' }}>Admin23 / admin123</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

