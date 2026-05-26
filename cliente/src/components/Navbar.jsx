import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        
        <span>STS</span>
      </div>

      <div className="navbar-right">
        {usuario && (
          <div className="navbar-user">
            <span className="navbar-user-name">{usuario.nombre} {usuario.apellido}</span>
            <span className="navbar-user-rol">{usuario.rol}</span>
          </div>
        )}
      </div>
    </nav>
  );
}
