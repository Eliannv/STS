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

export const categoriesConfig = [{
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
        reports: ['analisis-ventas'],
    },
    /*
        {
            id: 'compras',
            title: 'Compras',
            description: 'Consultas analíticas de movimientos de mercadería.',
            icon: Truck,
            color: '#e67e22',
            permission: REPORT_PERMISSIONS.COMPRAS,
            order: 3,
            reports: ['egresos-mercaderia'],
        } */
];

export default categoriesConfig;