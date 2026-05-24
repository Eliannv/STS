import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { api } from '../api/api';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) return <Navigate to="/" replace />;

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/usuario/login', form);
      if (res.ok && res.data.estado === 'ok') {
        login(res.data.resultado.token, res.data.resultado.usuario);
        navigate('/');
      } else {
        setError(res.data.mensaje || 'Credenciales inválidas');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6" cy="15" r="4"/>
            <circle cx="18" cy="15" r="4"/>
            <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
            <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/>
            <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/>
          </svg>
        </div>
        <h1 className="login-title">Óptica Macías</h1>
        <p className="login-subtitle">Sistema de Gestión Integral</p>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">Correo electrónico</label>
            <input
              className="form-control"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="usuario@optica.com"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <input
              className="form-control"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              required
            />
          </div>

          <button className="btn btn-primary login-btn" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                Ingresando...
              </>
            ) : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
