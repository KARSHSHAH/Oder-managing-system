import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, User, ArrowRight, ShieldCheck, ShoppingBag, Store } from 'lucide-react';

const Login = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, getDashboardPath } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionExpired = searchParams.get('sessionExpired');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifier || !password) {
      setError('Please fill in both fields');
      return;
    }

    try {
      setLoading(true);
      setError('');
      const loggedUser = await login(identifier, password);
      const destination = getDashboardPath(loggedUser.role);
      navigate(destination, { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoId, demoPass) => {
    setIdentifier(demoId);
    setPassword(demoPass);
    setError('');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        padding: '1.5rem',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: 20,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          overflow: 'hidden',
        }}
      >
        {/* Header Banner */}
        <div
          style={{
            padding: '2.2rem 2rem 1.75rem',
            background: 'linear-gradient(135deg, #1e40af 0%, #2563eb 100%)',
            color: '#ffffff',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              backdropFilter: 'blur(8px)',
              margin: '0 auto 1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 800,
            }}
          >
            UW
          </div>
          <h2 style={{ color: '#fff', fontSize: '1.4rem', marginBottom: 4 }}>
            Undergarments Wholesale
          </h2>
          <p style={{ color: '#bfdbfe', fontSize: '0.85rem' }}>
            B2B Wholesale Order Management System
          </p>
        </div>

        <div style={{ padding: '2rem' }}>
          {sessionExpired && (
            <div className="alert alert-warning" style={{ fontSize: '0.82rem' }}>
              Your session has expired. Please log in again.
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ fontSize: '0.82rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Login ID / Email</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                >
                  <User size={18} />
                </span>
                <input
                  type="text"
                  placeholder="admin@wholesale.com or RP1001"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label>Password</label>
              <div style={{ position: 'relative' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                >
                  <Lock size={18} />
                </span>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '2.4rem' }}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.75rem',
                fontSize: '0.95rem',
                marginTop: '0.5rem',
              }}
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          {/* Quick Demo Fill Buttons */}
          <div style={{ marginTop: '1.8rem', paddingTop: '1.4rem', borderTop: '1px solid #f1f5f9' }}>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                color: '#94a3b8',
                marginBottom: '0.75rem',
                textAlign: 'center',
                letterSpacing: '0.05em',
              }}
            >
              Quick Demo Accounts
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <button
                type="button"
                onClick={() => handleQuickFill('admin@wholesale.com', 'admin123')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <ShieldCheck size={16} color="#2563eb" />
                <span style={{ fontWeight: 600 }}>Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('rajesh@wholesale.com', 'staff123')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <ShoppingBag size={16} color="#059669" />
                <span style={{ fontWeight: 600 }}>Staff</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('RP1001', 'retail123')}
                style={{
                  padding: '8px 4px',
                  borderRadius: 8,
                  border: '1px solid #e2e8f0',
                  background: '#f8fafc',
                  textAlign: 'center',
                  fontSize: '0.75rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                <Store size={16} color="#d97706" />
                <span style={{ fontWeight: 600 }}>Retailer</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
