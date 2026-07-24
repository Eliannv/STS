// cliente/src/components/shared/CuentaHistorialDrawer.jsx
import { FileClock } from 'lucide-react';
import BarraProgreso from './BarraProgreso';
import DrawerDetalle from './DrawerDetalle';
import EstadoBadge from './EstadoBadge';
import { CAMPO, FECHA, FECHAHORA, FMT, PORCENTAJE } from '../../utils/formato';

export default function CuentaHistorialDrawer({
  open,
  onClose,
  cuenta,
  movimientos,
  loading,
  titulo = 'Historial de la cuenta',
  extra,
}) {
  const montoTotal = CAMPO(cuenta, 'montoTotal', 'monto_total', 0);
  const montoAbonado = CAMPO(cuenta, 'montoAbonado', 'monto_abonado', 0);
  const referencia = CAMPO(cuenta, 'referenciaCodigo', 'referencia_codigo', '—');

  return (
    <DrawerDetalle
      open={open}
      onClose={onClose}
      title={titulo}
      subtitle={cuenta ? `${CAMPO(cuenta, 'terceroNombre', 'tercero_nombre', 'Sin tercero')} · ${FMT(CAMPO(cuenta, 'saldo', 'saldo', 0))} pendiente` : ''}
      width={860}
    >
      {cuenta && (
        <>
          <div className="finance-info-grid" style={{ marginBottom: 18 }}>
            <div>
              <div className="finance-info__label">Fecha</div>
              <div className="finance-info__value">{FECHA(CAMPO(cuenta, 'fechaEmision', 'fecha_emision', cuenta.fecha))}</div>
            </div>
            <div>
              <div className="finance-info__label">Tipo</div>
              <div className="finance-info__value">{CAMPO(cuenta, 'tipoCuentaPorPagar', 'tipo_cuenta_por_pagar', cuenta.tipo)}</div>
            </div>
            <div>
              <div className="finance-info__label">Referencia</div>
              <div className="finance-info__value">{referencia}</div>
            </div>
            <div>
              <div className="finance-info__label">Vencimiento</div>
              <div className="finance-info__value">{FECHA(CAMPO(cuenta, 'fechaVencimiento', 'fecha_vencimiento'))}</div>
            </div>
            <div>
              <div className="finance-info__label">Monto total</div>
              <div className="finance-info__value">{FMT(montoTotal)}</div>
            </div>
            <div>
              <div className="finance-info__label">Estado</div>
              <div className="finance-info__value"><EstadoBadge estado={cuenta.estado} /></div>
            </div>
          </div>

          <div className="finance-global-progress" style={{ marginBottom: 18 }}>
            <div className="finance-global-progress__labels">
              <span>Aplicado {FMT(montoAbonado)}</span>
              <span>Pendiente {FMT(CAMPO(cuenta, 'saldo', 'saldo', 0))}</span>
            </div>
            <BarraProgreso completado={PORCENTAJE(montoAbonado, montoTotal)} />
          </div>

          {extra}

          <div className="finance-section">
            <div className="finance-section__header">
              <h3>Movimientos</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              {loading ? (
                <div className="empty-state">Cargando historial...</div>
              ) : movimientos.length === 0 ? (
                <div className="empty-state">
                  <FileClock size={34} />
                  <span>Esta cuenta todavía no registra movimientos.</span>
                </div>
              ) : (
                <table className="finance-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Monto</th>
                      <th>Saldo anterior</th>
                      <th>Saldo nuevo</th>
                      <th>Método</th>
                      <th>Caja</th>
                      <th>Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((movimiento) => (
                      <tr key={movimiento.id}>
                        <td>{FECHAHORA(CAMPO(movimiento, 'createdAt', 'created_at'))}</td>
                        <td>{CAMPO(movimiento, 'tipoMovimiento', 'tipo_movimiento', '—')}</td>
                        <td className="finance-amount">{FMT(movimiento.monto)}</td>
                        <td>{FMT(CAMPO(movimiento, 'saldoAnterior', 'saldo_anterior', 0))}</td>
                        <td>{FMT(CAMPO(movimiento, 'saldoNuevo', 'saldo_nuevo', 0))}</td>
                        <td>{CAMPO(movimiento, 'metodoPago', 'metodo_pago', '—')}</td>
                        <td>
                          {CAMPO(movimiento, 'cajaTipo', 'caja_tipo', '—')}
                          {CAMPO(movimiento, 'cajaId', 'caja_id') ? ` #${CAMPO(movimiento, 'cajaId', 'caja_id')}` : ''}
                        </td>
                        <td>{CAMPO(movimiento, 'usuarioNombre', 'usuario_nombre', '—')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </DrawerDetalle>
  );
}
