import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

import logo from '../assets/STS_Logo.ico'; // ruta de tu icono

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <img src={logo} alt="Logo" className="navbar-logo" />
        <span>Sales Technology System</span>
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