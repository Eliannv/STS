import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import './Layout.css';

export default function Layout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <div className="app-layout">
      <Navbar />
      <div className="content-wrapper">
        <Sidebar />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
