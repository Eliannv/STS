import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/Dashboard';
import Clientes from './pages/clientes/Clientes';
import Productos from './pages/productos/Productos';
import Proveedores from './pages/proveedores/Proveedores';
import Sucursales from './pages/sucursales/Sucursales';
import Usuarios from './pages/usuarios/Usuarios';
import Ingresos from './pages/ingresos/Ingresos';
import CrearIngreso from './pages/ingresos/CrearIngreso';
import ImportarIngreso from './pages/ingresos/ImportarIngreso';
import AgregarProductosIngreso from './pages/ingresos/AgregarProductosIngreso';
import VerIngreso from './pages/ingresos/VerIngreso';
import FichaCliente from './pages/clientes/FichaCliente';
import Ventas from './pages/ventas/Ventas';
import CrearVenta from './pages/ventas/CrearVenta';
import CobrarDeuda from './pages/ventas/CobrarDeuda';
import VerFactura from './pages/facturas/VerFactura';
import CajaChica from './pages/cajas/CajaChica';
import VerCajaChica from './pages/cajas/VerCajaChica';
import CajaBanco from './pages/cajas/CajaBanco';
import VerCajaBanco from './pages/cajas/VerCajaBanco';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/clientes/:id/ficha" element={<FichaCliente />} />
            <Route path="/productos" element={<Productos />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/sucursales" element={<Sucursales />} />
            <Route path="/usuarios" element={<Usuarios />} />
            <Route path="/ingresos" element={<Ingresos />} />
            <Route path="/ingresos/nuevo" element={<CrearIngreso />} />
            <Route path="/ingresos/importar" element={<ImportarIngreso />} />
            <Route path="/ingresos/:id" element={<VerIngreso />} />
            <Route path="/ingresos/:id/productos" element={<AgregarProductosIngreso />} />
            <Route path="/facturas" element={<Ventas />} />
            <Route path="/facturas/nueva" element={<CrearVenta />} />
            <Route path="/facturas/cobrar" element={<CobrarDeuda />} />
            <Route path="/facturas/:id" element={<VerFactura />} />
            <Route path="/caja-chica" element={<CajaChica />} />
            <Route path="/caja-chica/:id" element={<VerCajaChica />} />
            <Route path="/caja-banco" element={<CajaBanco />} />
            <Route path="/caja-banco/:id" element={<VerCajaBanco />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


