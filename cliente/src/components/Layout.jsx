import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { SucursalProvider } from '../context/SucursalContext';
import { TabHistoryProvider } from '../context/TabHistoryContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import CtrlTabNavigator from './CtrlTabNavigator';
import './Layout.css';

export default function Layout() {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;

  return (
    <SucursalProvider>
      <TabHistoryProvider>
        <div className="app-layout">
          <Navbar />
          <div className="content-wrapper">
            <Sidebar />
            <main className="main-content">
              <Outlet />
            </main>
          </div>
        </div>
        <CtrlTabNavigator />
      </TabHistoryProvider>
    </SucursalProvider>
  );
}
