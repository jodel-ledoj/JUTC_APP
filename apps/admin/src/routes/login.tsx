import React, { useState } from 'react';
import { api } from '../lib/api';
import { useAuthStore } from '../stores/auth.store';

const S = {
  page: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0F1115' } as React.CSSProperties,
  card: { background: '#1A1D23', borderRadius: 16, padding: 40, width: 380, border: '1px solid #2A2F38' } as React.CSSProperties,
  logo: { fontSize: 32, fontWeight: 800, color: '#2F80ED', letterSpacing: 4, marginBottom: 4, textAlign: 'center' as const },
  subtitle: { fontSize: 13, color: '#B6BDC9', textAlign: 'center' as const, marginBottom: 32 },
  label: { display: 'block', fontSize: 13, color: '#B6BDC9', marginBottom: 8 },
  input: { width: '100%', background: '#22262E', border: '1px solid #2A2F38', borderRadius: 10, padding: '14px 16px', color: '#F5F7FA', fontSize: 15, outline: 'none', boxSizing: 'border-box' as const },
  btn: { width: '100%', background: '#2F80ED', border: 'none', borderRadius: 10, padding: 16, color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer', marginTop: 24 },
  error: { color: '#EB5757', fontSize: 13, marginTop: 12, textAlign: 'center' as const },
};

export default function Login() {
  const { setAuth } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { phone, password });
      const { user, tokens } = res.data.data;
      if (!['ADMIN', 'EXECUTIVE'].includes(user.role)) {
        setError('Admin or Executive role required');
        return;
      }
      setAuth(user, tokens.accessToken);
    } catch {
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={S.page}>
      <form style={S.card} onSubmit={handleLogin}>
        <p style={S.logo}>JUTC</p>
        <p style={S.subtitle}>Operations Dashboard</p>
        <label style={S.label}>Phone Number</label>
        <input style={S.input} type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+18765550001" required />
        <label style={{ ...S.label, marginTop: 16 }}>Password</label>
        <input style={S.input} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
        <button style={S.btn} type="submit" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
        {error && <p style={S.error}>{error}</p>}
      </form>
    </div>
  );
}
