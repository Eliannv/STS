/**
 * CrearCuenta.jsx — Alta de usuario (solo ADMINISTRADOR).
 * Mismo layout dividido que Login.jsx: panel oscuro izquierdo + panel blanco derecho.
 * El endpoint POST /api/usuario/crear requiere token de ADMINISTRADOR.
 */
import '../../auth.css';
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { crearUsuarioApi } from '../../api/authApi';
import stsLogo from '../../assets/Logo 10.jpg';

function cedulaValida(v) { return /^\d{10}$/.test(v); }
function passwordFuerte(v) { return v.length >= 8 && /[A-Z]/.test(v) && /[a-z]/.test(v) && /\d/.test(v); }

export default function CrearCuenta() {
  const { token, isAdmin } = useAuth();

  const [form, setForm] = useState({
    nombre: '', apellido: '', email: '', cedula: '',
    fechaNacimiento: '', password: '', confirmPassword: '', rol: 'OPERADOR',
  });
  const [showPass,    setShowPass]    = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({});

  if (!token) return <Navigate to="/login" replace />;

  /* ── Pantalla de bloqueo para no-admins — mismo layout dividido ── */
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex">
        <div
          className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col items-center justify-center px-16"
          style={{ background: 'linear-gradient(160deg, #0d1b2a 0%, #112236 60%, #0d1b2a 100%)' }}
        >
          <DecorShapes />
          <div className="relative z-10 flex flex-col items-center text-center">
            <img src={stsLogo} alt="STS" className="w-48 h-48 object-contain mb-6 drop-shadow-2xl" />
            <h1 className="text-white text-3xl font-bold tracking-wider mb-2">Sales Technology System</h1>
            <p style={{ color: '#4B729F' }} className="text-lg font-medium tracking-widest uppercase">Óptica Macías</p>
            <div className="mt-6 w-20 h-0.5 rounded-full" style={{ backgroundColor: '#4B729F' }} />
          </div>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center bg-white px-8 text-center">
          <ShieldCheck size={52} className="mb-4" style={{ color: '#4B729F' }} />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso restringido</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-xs">
            Solo los administradores pueden registrar nuevas cuentas de usuario.
          </p>
          <Link
            to="/"
            className="text-white font-semibold rounded-lg px-6 py-2.5 text-sm transition-colors"
            style={{ backgroundColor: '#4B729F' }}
            onMouseEnter={e => e.currentTarget.style.backgroundColor = '#3d5e84'}
            onMouseLeave={e => e.currentTarget.style.backgroundColor = '#4B729F'}
          >
            Volver al dashboard
          </Link>
        </div>
      </div>
    );
  }

  function handleChange(e) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }
  function handleBlur(e) {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  }

  const errors = {
    nombre:          touched.nombre          && form.nombre.trim().length < 2 ? 'Mínimo 2 caracteres' : '',
    apellido:        touched.apellido        && form.apellido.trim().length < 2 ? 'Mínimo 2 caracteres' : '',
    email:           touched.email           && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) ? 'Correo inválido' : '',
    cedula:          touched.cedula          && form.cedula && !cedulaValida(form.cedula) ? '10 dígitos numéricos' : '',
    password:        touched.password        && !passwordFuerte(form.password) ? 'Mín. 8 chars, mayúscula, minúscula y número' : '',
    confirmPassword: touched.confirmPassword && form.password !== form.confirmPassword ? 'Las contraseñas no coinciden' : '',
  };

  const formValido =
    form.nombre.trim().length >= 2 && form.apellido.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email) &&
    passwordFuerte(form.password) && form.password === form.confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();
    setTouched({ nombre: true, apellido: true, email: true, cedula: true, password: true, confirmPassword: true });
    if (!formValido) return;
    setError(''); setSuccess(''); setLoading(true);
    try {
      const res = await crearUsuarioApi({
        nombre: form.nombre.trim(), apellido: form.apellido.trim(),
        email: form.email.trim(), password: form.password,
        cedula: form.cedula || null, fechaNacimiento: form.fechaNacimiento || null,
        rol: form.rol, activo: true,
      });
      if (res.ok && res.data.estado === 'ok') {
        setSuccess(`Cuenta creada. El usuario puede iniciar sesión con ${form.email}.`);
        setForm({ nombre: '', apellido: '', email: '', cedula: '', fechaNacimiento: '', password: '', confirmPassword: '', rol: 'OPERADOR' });
        setTouched({});
      } else {
        setError(res.data?.mensaje || res.data?.resultado || 'No se pudo crear la cuenta');
      }
    } catch { setError('Error de conexión con el servidor'); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── PANEL IZQUIERDO — mismo que Login ── */}
      <div
        className="hidden lg:flex lg:w-[58%] relative overflow-hidden flex-col items-center justify-center px-16"
        style={{ background: 'linear-gradient(160deg, #0d1b2a 0%, #112236 60%, #0d1b2a 100%)' }}
      >
        <DecorShapes />
        <div className="relative z-10 flex flex-col items-center text-center">
          <img src={stsLogo} alt="STS Logo" className="w-56 h-56 object-contain mb-6 drop-shadow-2xl" />
          <h1 className="text-white text-3xl font-bold tracking-wider mb-2">Sales Technology System</h1>
          <p style={{ color: '#4B729F' }} className="text-lg font-medium tracking-widest uppercase">Óptica Macías</p>
          <div className="mt-8 w-20 h-0.5 rounded-full" style={{ backgroundColor: '#4B729F' }} />
          <p className="text-slate-400 text-sm mt-4 max-w-xs leading-relaxed">
            Registra nuevos empleados para que accedan al sistema
          </p>
        </div>
      </div>

      {/* ── PANEL DERECHO — formulario con scroll ── */}
      <div className="flex-1 lg:w-[42%] flex flex-col items-center justify-center bg-white px-8 py-12 overflow-y-auto">

        {/* Logo mobile */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <img src={stsLogo} alt="STS" className="w-20 h-20 object-contain mb-2" />
          <p className="text-sm font-semibold tracking-widest uppercase" style={{ color: '#4B729F' }}>Óptica Macías</p>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Crear Cuenta</h2>
          <p className="text-sm font-medium mb-8" style={{ color: '#4B729F' }}>
            Registro para nuevos empleados
          </p>

          {/* Alertas */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-5">
              <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="flex items-start gap-2 bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3 mb-5">
              <svg className="shrink-0 mt-0.5" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>

            {/* Nombre + Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Nombre" error={errors.nombre}>
                <input type="text" name="nombre" value={form.nombre}
                  onChange={handleChange} onBlur={handleBlur} placeholder="Juan"
                  className={iCls(errors.nombre)} />
              </Field>
              <Field label="Apellido" error={errors.apellido}>
                <input type="text" name="apellido" value={form.apellido}
                  onChange={handleChange} onBlur={handleBlur} placeholder="Pérez"
                  className={iCls(errors.apellido)} />
              </Field>
            </div>

            {/* Cédula */}
            <Field label="Cédula" error={errors.cedula} optional>
              <input type="text" name="cedula" value={form.cedula} maxLength={10}
                onChange={handleChange} onBlur={handleBlur} placeholder="1234567890"
                className={iCls(errors.cedula)} />
            </Field>

            {/* Fecha nacimiento */}
            <Field label="Fecha de nacimiento" optional>
              <input type="date" name="fechaNacimiento" value={form.fechaNacimiento}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none transition-colors"
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #4B729F40'; e.target.style.borderColor = '#4B729F'; }}
                onBlur={e => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#d1d5db'; }} />
            </Field>

            {/* Correo */}
            <Field label="Correo electrónico" error={errors.email}>
              <input type="email" name="email" value={form.email}
                onChange={handleChange} onBlur={handleBlur} placeholder="juan.perez@sts.local"
                className={iCls(errors.email)} />
            </Field>

            {/* Rol */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Rol</label>
              <select name="rol" value={form.rol} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm text-gray-900 bg-white focus:outline-none transition-colors"
                onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #4B729F40'; e.target.style.borderColor = '#4B729F'; }}
                onBlur={e => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#d1d5db'; }}>
                <option value="OPERADOR">Operador</option>
                <option value="ADMINISTRADOR">Administrador</option>
              </select>
            </div>

            {/* Contraseña */}
            <Field label="Contraseña" error={errors.password}>
              <div className="relative">
                <input type={showPass ? 'text' : 'password'} name="password" value={form.password}
                  onChange={handleChange} onBlur={handleBlur} placeholder="••••••••"
                  className={iCls(errors.password) + ' pr-10'}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #4B729F40'; e.target.style.borderColor = '#4B729F'; }}
                  onBlur={e => { handleBlur(e); e.target.style.boxShadow = ''; e.target.style.borderColor = errors.password ? '#fca5a5' : '#d1d5db'; }} />
                <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPass
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </Field>

            {/* Confirmar contraseña */}
            <Field label="Confirmar contraseña" error={errors.confirmPassword}>
              <div className="relative">
                <input type={showConfirm ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword}
                  onChange={handleChange} onBlur={handleBlur} placeholder="••••••••"
                  className={iCls(errors.confirmPassword) + ' pr-10'}
                  onFocus={e => { e.target.style.boxShadow = '0 0 0 2px #4B729F40'; e.target.style.borderColor = '#4B729F'; }}
                  onBlur={e => { handleBlur(e); e.target.style.boxShadow = ''; e.target.style.borderColor = errors.confirmPassword ? '#fca5a5' : '#d1d5db'; }} />
                <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showConfirm
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>}
                </button>
              </div>
            </Field>

            {/* Botón */}
            <button
              type="submit" disabled={loading}
              className="w-full text-white font-semibold rounded-lg py-2.5 text-sm mt-1
                         disabled:opacity-60 disabled:cursor-not-allowed transition-all
                         flex items-center justify-center gap-2"
              style={{ backgroundColor: '#4B729F' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.backgroundColor = '#3d5e84'; }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#4B729F'; }}
            >
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando cuenta...</>
              ) : 'Crear Cuenta'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Helpers ── */

function iCls(err) {
  return [
    'w-full border rounded-lg px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white',
    'focus:outline-none transition-colors',
    err ? 'border-red-300' : 'border-gray-300',
  ].join(' ');
}

function Field({ label, error, optional, children }) {
  return (
    <div>
      <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {optional && <span className="text-gray-400 font-normal text-xs">(opcional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

/* Formas decorativas — reutilizadas del Login */
function DecorShapes() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full opacity-20" style={{ backgroundColor: '#4B729F' }} />
      <div className="absolute top-10 right-0 w-40 h-40 rounded-full opacity-15" style={{ backgroundColor: '#4B729F', transform: 'translateX(40%)' }} />
      <div className="absolute bottom-20 -left-10 w-48 h-48 opacity-10 rounded-2xl" style={{ backgroundColor: '#4B729F', transform: 'rotate(-30deg)' }} />
      <div className="absolute bottom-40 right-16 w-14 h-14 rounded-xl opacity-30" style={{ backgroundColor: '#4B729F' }} />
      <div className="absolute top-0 right-20 w-0.5 h-full opacity-10" style={{ backgroundColor: '#4B729F', transform: 'rotate(15deg)', transformOrigin: 'top' }} />
    </div>
  );
}
