import { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

import logo from '../assets/STS_Logo.ico';

const allPages = [
  { label: 'Dashboard',       route: '/' },
  { label: 'Clientes',        route: '/clientes' },
  { label: 'Proveedores',     route: '/proveedores' },
  { label: 'Empleados',       route: '/empleados',      adminOnly: true },
  { label: 'Usuarios',        route: '/usuarios',       adminOnly: true },
  { label: 'Productos',       route: '/productos' },
  { label: 'Ingresos',        route: '/ingresos' },
  { label: 'Facturas',        route: '/facturas' },
  { label: 'Venta POS',       route: '/facturas/nueva' },
  { label: 'Cobrar deuda',    route: '/facturas/cobrar' },
  { label: 'Caja Chica',      route: '/caja-chica' },
  { label: 'Caja Banco',      route: '/caja-banco',     adminOnly: true },
  { label: 'Sucursales',      route: '/sucursales' },
];

export default function Navbar() {
  const { usuario, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const ref = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return allPages
      .filter(p => !p.adminOnly || isAdmin)
      .filter(p => p.label.toLowerCase().includes(q) || p.route.toLowerCase().includes(q))
      .slice(0, 10);
  }, [query, isAdmin]);

  useEffect(() => { setSelectedIndex(-1); }, [results]);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function go(route) {
    navigate(route);
    setQuery('');
    setOpen(false);
    setSelectedIndex(-1);
    inputRef.current?.blur();
  }

  function handleKeyDown(e) {
    if (e.key === 'Escape') {
      setOpen(false);
      setSelectedIndex(-1);
      inputRef.current?.blur();
      return;
    }
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => {
        const next = i < results.length - 1 ? i + 1 : 0;
        const el = dropdownRef.current?.children[next];
        el?.scrollIntoView({ block: 'nearest' });
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => {
        const prev = i > 0 ? i - 1 : results.length - 1;
        const el = dropdownRef.current?.children[prev];
        el?.scrollIntoView({ block: 'nearest' });
        return prev;
      });
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      go(results[selectedIndex].route);
    }
  }

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Logo" className="navbar-logo" />
        <span>Sales Technology System</span>
      </div>

      <div className="navbar-search" ref={ref}>
        <svg className="navbar-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref={inputRef}
          className="navbar-search-input"
          type="text"
          placeholder="Buscar sección…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => query.trim() && setOpen(true)}
          onKeyDown={handleKeyDown}
        />
        {open && results.length > 0 && (
          <div className="navbar-search-dropdown" ref={dropdownRef}>
            {results.map((r, i) => (
              <button key={r.route} className={`navbar-search-item${i === selectedIndex ? ' selected' : ''}`} onClick={() => go(r.route)} onMouseEnter={() => setSelectedIndex(i)}>
                <span className="navbar-search-item-label">{r.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="navbar-right">
        {usuario && (
          <div className="navbar-user">
            <span className="navbar-user-name">
              {usuario.nombre} {usuario.apellido}
            </span>
            <span className="navbar-user-rol">{usuario.rol}</span>
          </div>
        )}
      </div>
    </nav>
  );
}