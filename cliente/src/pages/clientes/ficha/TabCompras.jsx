import { Eye, Printer, RotateCcw } from 'lucide-react';
import { dinero, fecha, BADGE_ESTADO_PAGO, badge, ESTILO_METODO_PAGO } from './fichaUtils';
import { Vacio } from './fichaUI';

// Compras del cliente. La columna Sucursal solo aparece en la vista consolidada:
// en una sucursal concreta sería una columna con el mismo valor en todas las filas.
export default function TabCompras({ compras, alcance, navigate }) {
  if (compras.length === 0) {
    return <Vacio mensaje={alcance.consolidado
      ? 'Este cliente no registra compras en ninguna sucursal.'
      : `Este cliente no registra compras en ${alcance.sucursalNombre || 'esta sucursal'}.`} />;
  }

  const mostrarSucursal = alcance.mostrarColumnaSucursal;

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Factura</th>
              <th>Fecha</th>
              {mostrarSucursal && <th>Sucursal</th>}
              <th>Empleado</th>
              <th>Método de pago</th>
              <th style={{ textAlign: 'right' }}>Total</th>
              <th style={{ textAlign: 'right' }}>Saldo</th>
              <th>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {compras.map((compra) => (
              <tr key={compra.id} style={{ opacity: compra.estadoPago === 'ANULADA' ? 0.55 : 1 }}>
                <td>
                  <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                    {compra.numero}
                  </code>
                </td>
                <td style={{ whiteSpace: 'nowrap' }}>{fecha(compra.fecha)}</td>
                {mostrarSucursal && <td>{compra.sucursalNombre || '—'}</td>}
                <td>{compra.usuarioNombre || (compra.usuarioId ? `Usuario #${compra.usuarioId}` : '—')}</td>
                <td>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {(() => {
                      const estilo = ESTILO_METODO_PAGO[compra.metodoPago] ?? { bg: '#e9ecef', color: '#495057' };
                      return <span style={badge(estilo.bg, estilo.color)}>{compra.metodoPago}</span>;
                    })()}
                    {compra.tipoVenta === 'CREDITO' && <span style={badge('#fef3c7', '#92400e')}>Crédito</span>}
                    {compra.tarjeta && <span style={badge('#fce8ff', '#7c3aed')}>{compra.tarjeta.estado}</span>}
                  </div>
                </td>
                <td style={{ textAlign: 'right', fontWeight: 700 }}>{dinero(compra.total)}</td>
                <td style={{ textAlign: 'right', color: compra.saldoPendiente > 0 ? '#92400e' : 'var(--text-muted)', fontWeight: compra.saldoPendiente > 0 ? 700 : 400 }}>
                  {dinero(compra.saldoPendiente)}
                </td>
                <td><span style={BADGE_ESTADO_PAGO[compra.estadoPago] || badge('#e9ecef', '#495057')}>{compra.estadoPago}</span></td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button className="btn-icon" title="Ver factura" style={{ color: '#1a56db' }}
                      onClick={() => navigate(`/facturas/${compra.id}`)}>
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon" title="Imprimir factura" style={{ color: '#16a085' }}
                      onClick={() => navigate(`/facturas/${compra.id}?imprimir=1`)}>
                      <Printer size={14} />
                    </button>
                    {/* Repetir venta queda preparado: el flujo se definirá aparte. */}
                    <button className="btn-icon" title="Repetir venta (próximamente)" disabled
                      style={{ color: '#adb5bd', cursor: 'not-allowed' }}>
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
