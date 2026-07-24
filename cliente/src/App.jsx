// cliente/src/App.jsx
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
import EmpleadoEstadisticas from './pages/usuarios/EmpleadoEstadisticas';
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
import CajaBancoPage from './pages/CajaBanco/CajaBancoPage';
import CajaBancoDetalle from './pages/CajaBanco/CajaBancoDetalle';
import CajaChicaPage from './pages/CajaChica/CajaChicaPage';
import CajaChicaDetalle from './pages/CajaChica/CajaChicaDetalle';
import VentasTarjetaPage from './pages/VentasTarjeta/VentasTarjetaPage';
import VentaTarjetaDetalle from './pages/VentasTarjeta/VentaTarjetaDetalle';
import CuentasPagarPage from './pages/CuentasPagar/CuentasPagarPage';
import CuentasCobrarPage from './pages/CuentasCobrar/CuentasCobrarPage';
import ReportCategory from './pages/reportes/ReportCategory';
import ReportPage from './pages/reportes/ReportPage';
import KardexPage from './pages/reportes/KardexPage';
import AnalisisVentas from './pages/reportes/AnalisisVentas';

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
            <Route path="/empleados" element={<EmpleadoEstadisticas />} />
            <Route path="/ingresos" element={<Ingresos />} />
            <Route path="/ingresos/nuevo" element={<CrearIngreso />} />
            <Route path="/ingresos/importar" element={<ImportarIngreso />} />
            <Route path="/ingresos/:id" element={<VerIngreso />} />
            <Route path="/ingresos/:id/productos" element={<AgregarProductosIngreso />} />
            <Route path="/facturas" element={<Ventas />} />
            <Route path="/facturas/nueva" element={<CrearVenta />} />
            <Route path="/facturas/cobrar" element={<CobrarDeuda />} />
            <Route path="/ventas/venta-tarjeta" element={<VentasTarjetaPage />} />
            <Route path="/ventas/venta-tarjeta/:id" element={<VentaTarjetaDetalle />} />
            <Route path="/ventas-tarjeta" element={<Navigate to="/ventas/venta-tarjeta" replace />} />
            <Route path="/ventas-tarjeta/:id" element={<VentaTarjetaDetalle />} />
            <Route path="/facturas/:id" element={<VerFactura />} />
            <Route path="/caja-chica" element={<CajaChicaPage />} />
            <Route path="/caja-chica/:id" element={<CajaChicaDetalle />} />
            <Route path="/caja-banco" element={<CajaBancoPage />} />
            <Route path="/caja-banco/:id" element={<CajaBancoDetalle />} />
            <Route path="/cuentas-pagar" element={<CuentasPagarPage />} />
            <Route path="/cuentas-cobrar" element={<CuentasCobrarPage />} />
            <Route path="/reportes/inventario/kardex" element={<KardexPage />} />
            <Route path="/reportes/inventario/kardex-producto" element={<Navigate to="/reportes/inventario/kardex" replace />} />
            <Route path="/reportes/inventario/kardex-fecha" element={<Navigate to="/reportes/inventario/kardex" replace />} />
            <Route path="/reportes/inventario/inventario-actual" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/inventario/inventario-valorizado" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/inventario/productos-sin-stock" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/inventario/productos-stock-minimo" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/ventas/analisis-ventas" element={<AnalisisVentas />} />
            <Route path="/reportes/ventas/ventas-mas-vendidos" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/ventas/ventas-menos-vendidos" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/ventas/productos-mas-vendidos" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/ventas/productos-menos-vendidos" element={<Navigate to="/productos" replace />} />
            <Route path="/reportes/ventas/ventas-generales" element={<Navigate to="/reportes/ventas/analisis-ventas" replace />} />
            <Route path="/reportes/ventas/ventas-fecha" element={<Navigate to="/reportes/ventas/analisis-ventas" replace />} />
            <Route path="/reportes/ventas/ventas-sucursal" element={<Navigate to="/reportes/ventas/analisis-ventas" replace />} />
            <Route path="/reportes/ventas/ventas-usuario" element={<Navigate to="/reportes/ventas/analisis-ventas" replace />} />
            <Route path="/reportes/ventas/ventas-cliente" element={<Navigate to="/reportes/ventas/analisis-ventas" replace />} />
            <Route path="/reportes/ventas/utilidad-ventas" element={<Navigate to="/reportes/ventas/analisis-ventas" replace />} />
            <Route path="/reportes/ventas/cuentas-cobrar" element={<Navigate to="/cuentas-cobrar" replace />} />
            <Route path="/reportes/compras/compras-proveedor" element={<Navigate to="/proveedores" replace />} />
            <Route path="/reportes/compras/ingresos-mercaderia" element={<Navigate to="/ingresos" replace />} />
            <Route path="/reportes/:categoria/:reporte" element={<ReportPage />} />
            <Route path="/reportes/:categoria" element={<ReportCategory />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}


