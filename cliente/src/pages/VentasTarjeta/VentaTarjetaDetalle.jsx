// cliente/src/pages/VentasTarjeta/VentaTarjetaDetalle.jsx
import { ArrowLeft, CreditCard, Printer } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/api';
import TableCard from '../../components/common/TableCard';
import BarraProgreso from '../../components/shared/BarraProgreso';
import EstadoBadge from '../../components/shared/EstadoBadge';
import '../../components/shared/FinanceModule.css';
import { notificarError } from '../../utils/confirmaciones';
import { FECHAHORA, FMT, NUMERO, PORCENTAJE, RESULTADO_LISTA } from '../../utils/formato';
import VentaTarjetaModal from './VentaTarjetaModal';

function InfoFila({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 18, padding: '9px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13 }}>
      <span style={{ color: '#6c757d' }}>{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  );
}

export default function VentaTarjetaDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [venta, setVenta] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    const [ventaResultado, historialResultado] = await Promise.allSettled([
      api.get(`/venta-tarjeta/${id}`),
      api.get(`/venta-tarjeta/${id}/historial`),
    ]);
    setLoading(false);
    if (ventaResultado.status !== 'fulfilled' || !ventaResultado.value.ok) {
      await notificarError(ventaResultado.value, 'No se pudo cargar la venta con tarjeta.');
      navigate('/ventas/venta-tarjeta');
      return;
    }
    setVenta(ventaResultado.value.data.resultado);
    setHistorial(
      historialResultado.status === 'fulfilled' && historialResultado.value.ok
        ? RESULTADO_LISTA(historialResultado.value)
        : [],
    );
  }, [id, navigate]);

  useEffect(() => { cargar(); }, [cargar]);

  const ultimoAbono = historial[0] || {};
  const puedeRegistrar = venta
    && ['PENDIENTE', 'PARCIALMENTE_ACREDITADA'].includes(venta.estado)
    && NUMERO(venta.saldo_pendiente) > 0;
  const progreso = PORCENTAJE(venta?.monto_bruto_acreditado, venta?.monto_total);
  const costos = useMemo(
    () => NUMERO(venta?.comision_acumulada) + NUMERO(venta?.retencion_acumulada),
    [venta],
  );

  if (loading) return <div className="page"><div className="spinner-wrapper"><div className="spinner" /></div></div>;
  if (!venta) return <div className="page"><div className="empty-state">Venta con tarjeta no encontrada.</div></div>;

  return (
    <div className="page finance-page">
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 className="page-title">Factura #{venta.factura_id_personalizado || venta.factura_id}</h1>
            <EstadoBadge estado={venta.estado} />
          </div>
          <p className="page-subtitle">{venta.cliente_nombre || 'Cliente sin nombre'}</p>
        </div>
        <div className="finance-actions no-print">
          <button className="btn btn-ghost" onClick={() => window.print()}><Printer size={16} /> Imprimir</button>
          {puedeRegistrar && <button className="btn btn-primary" onClick={() => setModal(true)}>Registrar ingreso</button>}
          <button className="btn btn-ghost" onClick={() => navigate('/ventas/venta-tarjeta')}><ArrowLeft size={16} /> Volver</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(380px, 1.25fr)', gap: 18 }}>
        <section className="finance-section">
          <div className="finance-section__header"><h3>Información de la venta</h3></div>
          <div className="finance-section__body">
            <InfoFila label="Fecha" value={FECHAHORA(venta.fecha_venta)} />
            <InfoFila label="Cliente" value={venta.cliente_nombre_completo || venta.cliente_nombre || '—'} />
            <InfoFila label="Banco" value={venta.banco || ultimoAbono.banco || '—'} />
            <InfoFila label="Número de lote" value={ultimoAbono.numero_lote || '—'} />
            <InfoFila label="Última acreditación" value={FECHAHORA(venta.fecha_ultima_acreditacion)} />
            <InfoFila label="Comisión acumulada" value={FMT(venta.comision_acumulada)} />
            <InfoFila label="Retención acumulada" value={FMT(venta.retencion_acumulada)} />
            <InfoFila label="Estado" value={<EstadoBadge estado={venta.estado} />} />
          </div>
        </section>

        <section className="finance-section">
          <div className="finance-section__header"><h3>Resumen financiero</h3></div>
          <div className="finance-section__body">
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div className="finance-info__label">Monto esperado</div>
              <strong style={{ fontSize: 34 }}>{FMT(venta.monto_total)}</strong>
            </div>
            <BarraProgreso completado={progreso} />
            <div className="finance-kpi-grid" style={{ marginTop: 18 }}>
              <div><div className="finance-info__label">Bruto acreditado</div><div className="finance-info__value">{FMT(venta.monto_bruto_acreditado)}</div></div>
              <div><div className="finance-info__label">Neto recibido</div><div className="finance-info__value" style={{ color: '#27ae60' }}>{FMT(venta.monto_neto_acreditado)}</div></div>
              <div><div className="finance-info__label">Saldo pendiente</div><div className="finance-info__value" style={{ color: '#e74c3c' }}>{FMT(venta.saldo_pendiente)}</div></div>
              <div><div className="finance-info__label">Costos bancarios</div><div className="finance-info__value" style={{ color: '#e74c3c' }}>{FMT(costos)}</div></div>
            </div>
          </div>
        </section>
      </div>

      <TableCard
        header={<strong>Historial de acreditaciones</strong>}
        empty={historial.length === 0}
        emptyIcon={<CreditCard size={34} />}
        emptyText="Esta venta todavía no registra acreditaciones bancarias."
        hidePagination
      >
        <table className="finance-table">
          <thead>
            <tr>
              <th>Fecha</th><th>Monto Bruto</th><th>Comisión</th><th>Retención</th><th>Neto</th>
              <th>Banco</th><th>Lote</th><th>Autorización</th><th>Caja Banco destino</th><th>Registrado por</th><th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {historial.map((abono) => (
              <tr key={abono.id}>
                <td>{FECHAHORA(abono.fecha_acreditacion || abono.created_at)}</td>
                <td className="finance-amount">{FMT(abono.monto_bruto)}</td>
                <td className="finance-amount finance-amount--negative">{FMT(abono.comision)}</td>
                <td className="finance-amount finance-amount--negative">{FMT(abono.retencion)}</td>
                <td className="finance-amount finance-amount--positive">{FMT(abono.monto_neto)}</td>
                <td>{abono.banco || '—'}</td>
                <td>{abono.numero_lote || '—'}</td>
                <td>{abono.numero_autorizacion || '—'}</td>
                <td>#{abono.cuenta_banco_id || '—'}</td>
                <td>{abono.usuario_nombre || '—'}</td>
                <td><EstadoBadge estado={abono.estado} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <VentaTarjetaModal
        abierto={modal}
        venta={venta}
        onCerrar={() => setModal(false)}
        onRegistrada={cargar}
      />
    </div>
  );
}
