import {
  Landmark,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
} from 'lucide-react';

export const REPORT_PERMISSIONS = {
  INVENTARIO: 'REPORTES_INVENTARIO',
  VENTAS: 'REPORTES_VENTAS',
  COMPRAS: 'REPORTES_COMPRAS',
  CAJA: 'REPORTES_CAJA',
  DASHBOARD: 'REPORTES_DASHBOARD',
};

export const categoriesConfig = [
  {
    id: 'inventario',
    title: 'Inventario',
    description: 'Movimientos y trazabilidad del inventario.',
    icon: Package,
    color: '#1abc9c',
    permission: REPORT_PERMISSIONS.INVENTARIO,
    order: 1,
    reports: ['kardex'],
  },
  {
    id: 'ventas',
    title: 'Ventas',
    description: 'Análisis comercial, utilidad y cuentas por cobrar.',
    icon: ShoppingCart,
    color: '#3498db',
    permission: REPORT_PERMISSIONS.VENTAS,
    order: 2,
    reports: [
      'ventas-mas-vendidos',
      'ventas-menos-vendidos',
      'ventas-generales',
      'ventas-fecha',
      'ventas-sucursal',
      'ventas-usuario',
      'ventas-cliente',
      'utilidad-ventas',
      'cuentas-cobrar',
    ],
  },
  {
    id: 'compras',
    title: 'Compras',
    description: 'Compras por proveedor e ingreso de mercadería.',
    icon: Truck,
    color: '#e67e22',
    permission: REPORT_PERMISSIONS.COMPRAS,
    order: 3,
    reports: [
      'compras-proveedor',
      'ingresos-mercaderia',
      'egresos-mercaderia',
    ],
  },
  {
    id: 'caja',
    title: 'Caja',
    description: 'Movimientos e indicadores del flujo de caja.',
    icon: Landmark,
    color: '#8e44ad',
    permission: REPORT_PERMISSIONS.CAJA,
    order: 4,
    reports: ['flujo-caja'],
  },
  {
    id: 'dashboard',
    title: 'Dashboard',
    description: 'Indicadores consolidados del negocio.',
    icon: LayoutDashboard,
    color: '#2c3e50',
    permission: REPORT_PERMISSIONS.DASHBOARD,
    order: 5,
    reports: ['dashboard-indicadores'],
  },
];

export default categoriesConfig;
