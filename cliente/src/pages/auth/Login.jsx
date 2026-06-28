/**
 * Login.jsx — Layout partido estilo Cisco Networking Academy:
 *   · Panel izquierdo oscuro (60%): logo STS + formas decorativas geométricas
 *   · Panel derecho blanco (40%): formulario limpio y minimalista
 *
 * Colores de marca STS:
 *   Azul:   #4B729F
 *   Negro:  #000000
 *   Blanco: #FFFFFF
 *   Fondo panel: #0d1b2a (navy profundo)
 */
import '../../auth.css';
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { loginApi } from '../../api/authApi';
import stsLogo from '../../assets/Logo 20.png';

export default function Login() {
  const { token, login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  if (token) return <Navigate to="/" replace />;

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginApi(form.email, form.password);
      if (res.ok && res.data.estado === 'ok') {
        login(res.data.resultado.token, res.data.resultado.usuario);
        navigate('/');
      } else {
        setError(res.data?.mensaje || 'Credenciales inválidas');
      }
    } catch {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── PANEL IZQUIERDO — decorativo, oculto en mobile ── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col items-center justify-center px-16"
        style={{ background: 'linear-gradient(160deg, #0d1b2a 0%, #112236 60%, #0d1b2a 100%)' }}
      >
        {/* Formas geométricas decorativas — inspiradas en el estilo Cisco */}
        <DecorShapes />

        {/* Logo STS centrado */}
        <div className="relative z-10 flex flex-col items-center text-center">
          <img
            src={stsLogo}
            alt="STS Logo"
            className="w-56 h-56 object-contain mb-6 drop-shadow-2xl"
          />
          <h1 className="text-white text-3xl font-bold tracking-wider mb-2">
            Sales Technology System
          </h1>
          <p style={{ color: '#4B729F' }} className="text-lg font-medium tracking-widest uppercase">
            Óptica Macías
          </p>
          {/* Línea divisora decorativa */}
          <div className="mt-8 w-20 h-0.5 rounded-full" style={{ backgroundColor: '#4B729F' }} />
          <p className="text-slate-400 text-sm mt-4 max-w-xs leading-relaxed">
            Gestión integral de ventas, inventario y clientes para tu empresa
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO — formulario ── */}
      <div className="flex-1 lg:w-[42%] flex flex-col items-center justify-center bg-white px-8 py-12">

        {/* Logo pequeño solo visible en mobile (el panel izquierdo está oculto) */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img src={stsLogo} alt="STS" className="w-24 h-24 object-contain mb-2" />
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#4B729F' }}>
            Óptica Macías
          </p>
        </div>

        <div className="w-full max-w-sm">

          {/* Encabezado del formulario — idéntico al patrón Cisco */}
          <h2 className="text-3xl font-bold text-gray-900 mb-1">¡Bienvenido!</h2>
          <p className="text-sm font-medium mb-8" style={{ color: '#4B729F' }}>
            Inicia sesión en tu cuenta
          </p>

          {/* Alerta de error */}
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              <svg className="shrink-0" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">

            {/* Correo electrónico */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder=""
                autoFocus
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900
                           placeholder:text-gray-400 bg-white
                           focus:outline-none focus:border-transparent transition-colors"
                style={{ '--tw-ring-color': '#4B729F' }}
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #4B729F40'; e.target.style.borderColor = '#4B729F'; }}
                onBlur={e => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#d1d5db'; }}
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                  className="w-full border border-gray-300 rounded-lg px-4 pr-11 py-2.5 text-sm text-gray-900
                             placeholder:text-gray-400 bg-white
                             focus:outline-none transition-colors"
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #4B729F40'; e.target.style.borderColor = '#4B729F'; }}
                  onBlur={e => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#d1d5db'; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Botón ingresar — color de marca */}
            <button
              type="submit"
              disabled={loading}
              className="w-full text-white font-semibold rounded-lg py-2.5 text-sm
                         transition-all disabled:opacity-60 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2 mt-1"
              style={{ backgroundColor: '#4B729F' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#3d5e84'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#4B729F'; }}
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Ingresando...
                </>
              ) : 'Iniciar sesión'}
            </button>
          </form>

          {/* Footer del formulario */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-400">
              ¿No tienes cuenta? Contacta a tu administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Formas decorativas SVG del panel izquierdo ──
   Geometrías abstractas en tonos del logo STS (#4B729F + variantes)
   Posicionadas absolutamente para no interferir con el contenido */
function DecorShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Círculo grande top-left */}
      <div
        className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-20"
        style={{ backgroundColor: '#4B729F' }}
      />
      {/* Círculo mediano top-right */}
      <div
        className="absolute top-10 right-0 w-40 h-40 rounded-full opacity-15"
        style={{ backgroundColor: '#4B729F', transform: 'translateX(40%)' }}
      />
      {/* Rectángulo inclinado bottom-left */}
      <div
        className="absolute bottom-20 -left-10 w-48 h-48 opacity-10 rounded-2xl"
        style={{ backgroundColor: '#4B729F', transform: 'rotate(-30deg)' }}
      />
      {/* Cuadrado pequeño accent bottom-right */}
      <div
        className="absolute bottom-40 right-16 w-14 h-14 rounded-xl opacity-30"
        style={{ backgroundColor: '#4B729F' }}
      />
      {/* Línea diagonal sutil */}
      <div
        className="absolute top-0 right-20 w-0.5 h-full opacity-10"
        style={{ backgroundColor: '#4B729F', transform: 'rotate(15deg)', transformOrigin: 'top' }}
      />
    </div>
  );
}
