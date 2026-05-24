import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const menuItems = [
  {
    label: 'Dashboard', route: '/',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
  },
  {
    label: 'Clientes', route: '/clientes',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
  },
  {
    label: 'Productos', route: '/productos',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
  },
  {
    label: 'Proveedores', route: '/proveedores',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
  },
  {
    label: 'Sucursales', route: '/sucursales',
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
  },
  {
    label: 'Usuarios', route: '/usuarios', adminOnly: true,
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
  },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { usuario, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  const items = menuItems.filter(i => !i.adminOnly || isAdmin);

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <button className="sidebar-logo-btn" onClick={() => setCollapsed(!collapsed)} title={collapsed ? 'Abrir menú' : 'Cerrar menú'}>
          <span className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="15" r="4"/>
              <circle cx="18" cy="15" r="4"/>
              <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
              <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/>
              <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/>
            </svg>
          </span>
          {!collapsed && <span className="logo-text">Menú</span>}
        </button>
      </div>

      

      <nav className="sidebar-nav">
        <ul className="menu-list">
          {items.map(item => (
            <li key={item.route} className="menu-item">
              <NavLink to={item.route} end={item.route === '/'} className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`} title={collapsed ? item.label : undefined}>
                <span className="menu-icon">{item.icon}</span>
                {!collapsed && <span className="menu-label">{item.label}</span>}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className={`logout-area ${collapsed ? 'collapsed' : ''}`}>
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Cerrar sesión' : undefined}>
          <span className="logout-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 17 5-5-5-5"/>
              <path d="M21 12H9"/>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            </svg>
          </span>
          {!collapsed && <span className="logout-text">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
