import { TrendingUp, CalendarCheck, AlertTriangle, Star, Receipt } from 'lucide-react';
import { dinero, fecha, badge } from './fichaUtils';
import { Tarjeta, Dato } from './fichaUI';

// Vista de un vistazo: lo que el empleado necesita saber en los primeros
// segundos de atención, sin tablas largas.
const CLIENTE_FRECUENTE_DESDE = 3;

export default function TabResumen({ ficha, navigate }) {
  const { resumen, estadisticas, cliente, alcance } = ficha;
  const ultimaCompra = (ficha.compras ?? [])[0] ?? null;
  const esFrecuente = resumen.comprasEmpresa >= CLIENTE_FRECUENTE_DESDE;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 14 }}>

      <Tarjeta titulo="Estado financiero">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8,
            background: resumen.tieneDeuda ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${resumen.tieneDeuda ? '#fecaca' : '#bbf7d0'}`,
          }}>
            <AlertTriangle size={20} color={resumen.tieneDeuda ? '#e74c3c' : '#27ae60'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700, color: resumen.tieneDeuda ? '#991b1b' : '#166534' }}>
                {dinero(resumen.deudaEnCuentas || resumen.deudaSucursal)}
              </div>
              <div style={{ fontSize: 11, color: resumen.tieneDeuda ? '#991b1b' : '#166534' }}>
                {resumen.tieneDeuda ? 'Saldo pendiente de cobro' : 'Sin deuda pendiente'}
              </div>
            </div>
            {resumen.tieneDeuda && (
              <button className="btn btn-primary" style={{ fontSize: 12 }}
                onClick={() => navigate(`/cuentas-cobrar?clienteId=${cliente.id}`)}>
                Ir a Cuenta
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 14 }}>
            <Dato label={alcance.consolidado ? 'Comprado (todas)' : 'Comprado (sucursal)'}>
              <strong>{dinero(resumen.totalCompradoSucursal)}</strong>
            </Dato>
            <Dato label="Total abonado"><strong>{dinero(estadisticas.totalAbonado)}</strong></Dato>
            <Dato label="Total pendiente">
              <strong style={{ color: resumen.tieneDeuda ? '#991b1b' : undefined }}>
                {dinero(resumen.deudaEnCuentas || resumen.deudaSucursal)}
              </strong>
            </Dato>
            <Dato label="Ticket promedio">{dinero(estadisticas.ticketPromedio)}</Dato>
            <Dato label="Compra más grande">{dinero(estadisticas.compraMayor)}</Dato>
            <Dato label="Última compra">{fecha(estadisticas.ultimaCompra)}</Dato>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Seguimiento clínico">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 8,
            background: estadisticas.controlVencido ? '#fffbeb' : '#f0fdf4',
            border: `1px solid ${estadisticas.controlVencido ? '#fde68a' : '#bbf7d0'}`,
          }}>
            <CalendarCheck size={20} color={estadisticas.controlVencido ? '#e67e22' : '#27ae60'} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: estadisticas.controlVencido ? '#92400e' : '#166534' }}>
                {estadisticas.proximoControlRecomendado
                  ? `Próxima revisión sugerida: ${fecha(estadisticas.proximoControlRecomendado)}`
                  : 'Sin exámenes registrados'}
              </div>
              <div style={{ fontSize: 11, color: estadisticas.controlVencido ? '#92400e' : '#166534' }}>
                {estadisticas.controlVencido ? 'El control anual está vencido' : 'Control al día'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Dato label="Último examen">{fecha(estadisticas.ultimoExamen)}</Dato>
            <Dato label="Historiales">{estadisticas.totalHistoriales}</Dato>
            <Dato label="Cliente desde">{fecha(estadisticas.clienteDesde)}</Dato>
          </div>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Última compra">
        {ultimaCompra ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Receipt size={18} color="#3498db" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{ultimaCompra.numero}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{fecha(ultimaCompra.fecha)}</div>
              </div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{dinero(ultimaCompra.total)}</div>
            </div>
            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <Dato label="Estado"><span style={badge('#e3f0ff', '#1a56db')}>{ultimaCompra.estadoPago}</span></Dato>
              <Dato label="Método">{ultimaCompra.metodoPago}</Dato>
              {alcance.consolidado && <Dato label="Sucursal">{ultimaCompra.sucursalNombre || '—'}</Dato>}
            </div>
            <button className="btn btn-ghost" style={{ fontSize: 12, alignSelf: 'flex-start' }}
              onClick={() => navigate(`/facturas/${ultimaCompra.id}`)}>
              Ver factura
            </button>
          </div>
        ) : (
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Este cliente aún no registra compras aquí.</div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Perfil comercial">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Star size={18} color={esFrecuente ? '#f39c12' : '#adb5bd'} fill={esFrecuente ? '#f39c12' : 'none'} />
            <span style={{ fontSize: 13, fontWeight: 600 }}>
              {esFrecuente ? 'Cliente frecuente' : 'Cliente ocasional'}
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              ({resumen.comprasEmpresa} {resumen.comprasEmpresa === 1 ? 'compra' : 'compras'} en total)
            </span>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
            <Dato label="Ocupación">{cliente.ocupacion}</Dato>
            <Dato label="Contacto preferido">{cliente.preferencia_contacto}</Dato>
            <Dato label="Compras con tarjeta">{estadisticas.comprasConTarjeta}</Dato>
            <Dato label="Abonos registrados">{estadisticas.totalPagosRegistrados}</Dato>
          </div>
          {cliente.notas_internas && (
            <div style={{ padding: '8px 12px', background: '#f8f9fa', borderRadius: 6, fontSize: 12, color: 'var(--text-secondary)' }}>
              <strong style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 3 }}>
                <TrendingUp size={12} /> Nota interna
              </strong>
              {cliente.notas_internas}
            </div>
          )}
        </div>
      </Tarjeta>
    </div>
  );
}
