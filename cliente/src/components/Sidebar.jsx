import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const allMenuItems = [
  // DASHBOARD
  {
    label: 'Dashboard',
    route: '/',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
        <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
      </svg>
    ),
  },
  // PERSONAS
  {
    label: 'Personas',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    children: [
      { label: 'Clientes', route: '/clientes' },
      { label: 'Proveedores', route: '/proveedores' },
      { label: 'Usuarios', route: '/usuarios', adminOnly: true },
    ],
  },
  // INVENTARIO
  {
    label: 'Inventario',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
        <path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
      </svg>
    ),
    children: [
      { label: 'Productos', route: '/productos' },
      { label: 'Ingresos',  route: '/ingresos'  },
    ],
  },
  // SUCURSALES
  {
    label: 'Sucursales',
    route: '/sucursales',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9 22 9 12 15 12 15 22"/>
      </svg>
    ),
  },
];

function ChevronIcon({ open }) {
  return (
    <svg
      className={`chevron-icon ${open ? 'open' : ''}`}
      width="16" height="16" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [expanded, setExpanded] = useState({});
  const { logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    logout();
    navigate('/login');
  }

  function toggleSection(label) {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
  }

  function filterChildren(children) {
    return children.filter(c => !c.adminOnly || isAdmin);
  }

  function hasActiveChild(children) {
    return filterChildren(children).some(c => location.pathname === c.route);
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        <button
          className="sidebar-logo-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? 'Abrir menú' : 'Cerrar menú'}
        >
          <span className="logo-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="6" cy="15" r="4"/><circle cx="18" cy="15" r="4"/>
              <path d="M14 15a2 2 0 0 0-2-2 2 2 0 0 0-2 2"/>
              <path d="M2.5 13 5 7c.7-1.3 1.4-2 3-2"/>
              <path d="M21.5 13 19 7c-.7-1.3-1.5-2-3-2"/>
            </svg>
          </span>
          {!collapsed && <span className="logo-text">Optica Macias</span>}
        </button>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <ul className="menu-list">
          {allMenuItems.map(item => {
            // Item sin hijos → enlace directo
            if (!item.children) {
              return (
                <li key={item.route} className="menu-item">
                  <NavLink
                    to={item.route}
                    end={item.route === '/'}
                    className={({ isActive }) => `menu-link ${isActive ? 'active' : ''}`}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="menu-icon">{item.icon}</span>
                    {!collapsed && <span className="menu-label">{item.label}</span>}
                  </NavLink>
                </li>
              );
            }

            // Item con hijos → sección desplegable
            const visibleChildren = filterChildren(item.children);
            if (visibleChildren.length === 0) return null;

            const isOpen = collapsed ? false : !!expanded[item.label];
            const sectionActive = hasActiveChild(item.children);

            return (
              <li key={item.label} className="menu-item">
                <button
                  className={`menu-section-btn ${sectionActive ? 'active' : ''}`}
                  onClick={() => !collapsed && toggleSection(item.label)}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="menu-icon">{item.icon}</span>
                  {!collapsed && (
                    <>
                      <span className="menu-label">{item.label}</span>
                      <ChevronIcon open={isOpen} />
                    </>
                  )}
                </button>

                {!collapsed && (
                  <ul className={`submenu-list ${isOpen ? 'open' : ''}`}>
                    {visibleChildren.map(child => (
                      <li key={child.route} className="submenu-item">
                        <NavLink
                          to={child.route}
                          className={({ isActive }) => `submenu-link ${isActive ? 'active' : ''}`}
                        >
                          {child.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className={`logout-area ${collapsed ? 'collapsed' : ''}`}>
        <button className="logout-btn" onClick={handleLogout} title={collapsed ? 'Cerrar sesión' : undefined}>
          <span className="logout-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            </svg>
          </span>
          {!collapsed && <span className="logout-text">Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  );
}
