import { Handshake } from 'lucide-react';
import { dinero, fecha, BADGE_ESTADO_CUENTA, badge } from './fichaUtils';
import { Vacio } from './fichaUI';

// Cuentas por cobrar del cliente. La gestión del cobro vive en su propio módulo:
// aquí solo se consulta y se navega hacia él.
export default function TabCuentasPorCobrar({ cuentas, actividad, alcance, clienteId, navigate }) {
  if (cuentas.length === 0) {
    return <Vacio mensaje={alcance.consolidado
      ? 'Este cliente no tiene cuentas por cobrar.'
      : `Este cliente no tiene cuentas por cobrar en ${alcance.sucursalNombre || 'esta sucursal'}.`} />;
  }

  // El último abono se deduce de la actividad ya cargada; no requiere otra consulta.
  const ultimoAbono = actividad.find((evento) => evento.tipo === 'ABONO') ?? null;
  const saldoTotal = cuentas.reduce((suma, cuenta) => suma + Number(cuenta.saldo || 0), 0);
  const mostrarSucursal = alcance.mostrarColumnaSucursal;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap',
        padding: '14px 18px', background: '#fff8e1', border: '1px solid #ffc107', borderRadius: 8,
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#7b4700' }}>{dinero(saldoTotal)}</div>
          <div style={{ fontSize: 12, color: '#7b4700' }}>
            Saldo total en {cuentas.length} {cuentas.length === 1 ? 'cuenta' : 'cuentas'}
            {ultimoAbono && ` · Último abono: ${fecha(ultimoAbono.fecha)} (${dinero(ultimoAbono.monto)})`}
          </div>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          onClick={() => navigate(`/cuentas-cobrar?clienteId=${clienteId}`)}>
          <Handshake size={15} /> Ir a Cuentas por Cobrar
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Documento</th>
                <th>Fecha</th>
                <th>Vencimiento</th>
                {mostrarSucursal && <th>Sucursal</th>}
                <th style={{ textAlign: 'right' }}>Monto</th>
                <th style={{ textAlign: 'right' }}>Abonado</th>
                <th style={{ textAlign: 'right' }}>Saldo</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td>
                    <code style={{ background: '#f0f4ff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                      {cuenta.referenciaCodigo || `#${cuenta.id}`}
                    </code>
                  </td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fecha(cuenta.fecha)}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>{fecha(cuenta.fechaVencimiento)}</td>
                  {mostrarSucursal && <td>{cuenta.sucursalNombre || '—'}</td>}
                  <td style={{ textAlign: 'right' }}>{dinero(cuenta.montoTotal)}</td>
                  <td style={{ textAlign: 'right' }}>{dinero(cuenta.montoAbonado)}</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, color: '#92400e' }}>{dinero(cuenta.saldo)}</td>
                  <td><span style={BADGE_ESTADO_CUENTA[cuenta.estado] || badge('#e9ecef', '#495057')}>{cuenta.estado}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
