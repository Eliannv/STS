import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import HistorialFormModal from './HistorialFormModal';
import { exportarHistorialExcel } from '../../utils/exportarExcel';

export default function HistorialListModal({ abierto, cliente, onCerrar, onSeleccionar, modoCompacto = true, soloLectura = false, modal: enModal = true }) {
  const { isAdmin } = useAuth();

  const [historiales, setHistoriales] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [historialSeleccionado, setHistorialSeleccionado] = useState(null);

  const [extendido, setExtendido] = useState(!modoCompacto);
  const [viendo, setViendo] = useState(null);

  useEffect(() => {
    if (abierto && cliente) cargar();
    if (!abierto) setHistoriales([]);
  }, [abierto, cliente]);

  async function cargar() {
    setLoading(true);
    const res = await api.get(`/historial-clinico/cliente/${cliente.id}`);
    if (res.ok) setHistoriales(res.data.resultado || []);
    setLoading(false);
  }

  function abrirNuevo() {
    setHistorialSeleccionado(null);
    setEditandoId(null);
    setFormAbierto(true);
  }

  function abrirEditar(h) {
    setHistorialSeleccionado(h);
    setEditandoId(h.id);
    setFormAbierto(true);
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este historial clínico?')) return;
    const res = await api.delete('/historial-clinico/eliminar', { id });
    if (res.ok) cargar();
  }

  function fmtGrad(v) {
    if (v === '' || v === null || v === undefined) return '\u2014';
    const n = parseFloat(v);
    return isNaN(n) ? String(v) : (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
  }
  function fmtFecha(f) { return f ? new Date(f).toLocaleDateString('es-EC') : '\u2014'; }

  if (!abierto && enModal) return null;

  const columnas = extendido
    ? [
        { key: 'Fecha', width: '100px', align: 'left' },
        { key: 'OD Esf.', width: '72px', align: 'center' },
        { key: 'OD Cil.', width: '72px', align: 'center' },
        { key: 'OD Eje', width: '60px', align: 'center' },
        { key: 'OD AVSC', width: '66px', align: 'center' },
        { key: 'OD AVCC', width: '66px', align: 'center' },
        { key: 'OI Esf.', width: '72px', align: 'center' },
        { key: 'OI Cil.', width: '72px', align: 'center' },
        { key: 'OI Eje', width: '60px', align: 'center' },
        { key: 'OI AVSC', width: '66px', align: 'center' },
        { key: 'OI AVCC', width: '66px', align: 'center' },
        { key: 'ADD', width: '60px', align: 'center' },
        { key: 'DP', width: '50px', align: 'center' },
        { key: 'Altura (mm)', width: '72px', align: 'center' },
        { key: 'H', width: '42px', align: 'center' },
        { key: 'V', width: '42px', align: 'center' },
        { key: 'DBL', width: '48px', align: 'center' },
        { key: 'DM', width: '48px', align: 'center' },
        { key: 'Tipo Armaz\u00f3n', width: '90px', align: 'center' },
        { key: 'De', width: '72px', align: 'center' },
        { key: 'Color', width: '72px', align: 'center' },
        { key: 'Acciones', width: null, align: 'center' },
      ]
    : [
        { key: 'Fecha', width: '100px', align: 'left' },
        { key: 'OD Esf.', width: '72px', align: 'center' },
        { key: 'OD Cil.', width: '72px', align: 'center' },
        { key: 'OD Eje', width: '60px', align: 'center' },
        { key: 'AVSC', width: '60px', align: 'center' },
        { key: 'AVCC', width: '60px', align: 'center' },
        { key: 'OI Esf.', width: '72px', align: 'center' },
        { key: 'OI Cil.', width: '72px', align: 'center' },
        { key: 'OI Eje', width: '60px', align: 'center' },
        { key: 'DP', width: '50px', align: 'center' },
        { key: 'Acciones', width: null, align: 'center' },
      ];

  const celdasAccion = (h) => (
    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', padding: '4px 6px' }}>
      <button className="btn-icon" title="Ver" onClick={() => setViendo(h)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      {onSeleccionar && (
        <button
          className="btn btn-primary btn-sm"
          style={{ padding: '3px 8px', fontSize: 11 }}
          title="Usar este historial en la venta"
          onClick={() => { onSeleccionar(h); onCerrar(); }}
        >
          Seleccionar
        </button>
      )}
      {!onSeleccionar && (
        <button
          className="btn-icon"
          title="Exportar a Excel"
          onClick={() => exportarHistorialExcel(h, cliente).catch(e => alert('Error al exportar: ' + e.message))}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
        </button>
      )}
      {!onSeleccionar && !soloLectura && (
        <button className="btn-icon" title="Editar" onClick={() => abrirEditar(h)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        </button>
      )}
      {!onSeleccionar && !soloLectura && isAdmin && (
        <button className="btn-icon danger" title="Eliminar" onClick={() => eliminar(h.id)}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
        </button>
      )}
    </div>
  );

  const tablas = (
    <table>
      <thead>
        <tr>
          {columnas.map(c => (
            <th key={c.key} style={{ textAlign: c.align, width: c.width || undefined, fontSize: 12, whiteSpace: 'nowrap' }}>{c.key}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {historiales.length === 0
          ? <tr><td colSpan={columnas.length} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No hay historiales cl\u00ednicos para este paciente</td></tr>
          : historiales.map(h => {
            const celdas = extendido
              ? [
                  <td key="Fecha" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtFecha(h.created_at)}</td>,
                  <td key="OD Esf." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_esfera)}</td>,
                  <td key="OD Cil." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_cilindro)}</td>,
                  <td key="OD Eje" style={{ textAlign: 'center', fontSize: 13 }}>{h.od_eje ? `${h.od_eje}\u00b0` : '\u2014'}</td>,
                  <td key="OD AVSC" style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avsc || '\u2014'}</td>,
                  <td key="OD AVCC" style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avcc || '\u2014'}</td>,
                  <td key="OI Esf." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_esfera)}</td>,
                  <td key="OI Cil." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_cilindro)}</td>,
                  <td key="OI Eje" style={{ textAlign: 'center', fontSize: 13 }}>{h.oi_eje ? `${h.oi_eje}\u00b0` : '\u2014'}</td>,
                  <td key="OI AVSC" style={{ textAlign: 'center', fontSize: 13 }}>{h.oi_avsc || '\u2014'}</td>,
                  <td key="OI AVCC" style={{ textAlign: 'center', fontSize: 13 }}>{h.oi_avcc || '\u2014'}</td>,
                  <td key="ADD" style={{ textAlign: 'center', fontSize: 13 }}>{h.add || '\u2014'}</td>,
                  <td key="DP" style={{ textAlign: 'center', fontSize: 13 }}>{h.dp || '\u2014'}</td>,
                  <td key="Altura (mm)" style={{ textAlign: 'center', fontSize: 13 }}>{h.altura || '\u2014'}</td>,
                  <td key="H" style={{ textAlign: 'center', fontSize: 13 }}>{h.armazon_h || '\u2014'}</td>,
                  <td key="V" style={{ textAlign: 'center', fontSize: 13 }}>{h.armazon_v || '\u2014'}</td>,
                  <td key="DBL" style={{ textAlign: 'center', fontSize: 13 }}>{h.armazon_dbl || '\u2014'}</td>,
                  <td key="DM" style={{ textAlign: 'center', fontSize: 13 }}>{h.armazon_dm || '\u2014'}</td>,
                  <td key="Tipo Armaz\u00f3n" style={{ textAlign: 'center', fontSize: 13 }}>{h.armazon_tipo || '\u2014'}</td>,
                  <td key="De" style={{ textAlign: 'center', fontSize: 13 }}>{h.de || '\u2014'}</td>,
                  <td key="Color" style={{ textAlign: 'center', fontSize: 13 }}>{h.color || '\u2014'}</td>,
                  <td key="Acciones" style={{ padding: 0 }}>{celdasAccion(h)}</td>,
                ]
              : [
                  <td key="Fecha" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtFecha(h.created_at)}</td>,
                  <td key="OD Esf." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_esfera)}</td>,
                  <td key="OD Cil." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_cilindro)}</td>,
                  <td key="OD Eje" style={{ textAlign: 'center', fontSize: 13 }}>{h.od_eje ? `${h.od_eje}\u00b0` : '\u2014'}</td>,
                  <td key="AVSC" style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avsc || '\u2014'}</td>,
                  <td key="AVCC" style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avcc || '\u2014'}</td>,
                  <td key="OI Esf." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_esfera)}</td>,
                  <td key="OI Cil." style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_cilindro)}</td>,
                  <td key="OI Eje" style={{ textAlign: 'center', fontSize: 13 }}>{h.oi_eje ? `${h.oi_eje}\u00b0` : '\u2014'}</td>,
                  <td key="DP" style={{ textAlign: 'center', fontSize: 13 }}>{h.dp || '\u2014'}</td>,
                  <td key="Acciones" style={{ padding: 0 }}>{celdasAccion(h)}</td>,
                ];
            return <tr key={h.id}>{celdas}</tr>;
          })
        }
      </tbody>
    </table>
  );

  const encabezado = (
    <div style={{ padding: enModal ? '20px 24px' : 0, borderBottom: enModal ? '1px solid var(--border-color)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Historiales cl\u00ednicos</h2>
        {cliente && (
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
            {cliente.nombres} {cliente.apellidos}
            {cliente.cedula ? ` \u2014 ${cliente.cedula}` : ''}
          </p>
        )}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => setExtendido(v => !v)}
          title={extendido ? 'Vista compacta' : 'Vista extendida'}
          style={{ fontSize: 12, padding: '4px 10px' }}
        >
          {extendido ? 'Compacto' : 'Extendido'}
        </button>
        {enModal && <button className="btn-icon" onClick={onCerrar}>\u2715</button>}
      </div>
    </div>
  );

  const contenido = (
    <>
      {encabezado}
      {loading
        ? <div className="spinner-wrapper" style={{ padding: 40 }}><div className="spinner" /></div>
        : <div className="table-container" style={{ maxHeight: enModal ? 400 : 'none' }}>{tablas}</div>
      }
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: enModal ? '14px 24px' : '16px 0 0', borderTop: enModal ? '1px solid var(--border-color)' : 'none' }}>
        {enModal && <button className="btn btn-ghost" onClick={onCerrar}>Cerrar</button>}
        {!soloLectura && (
          <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo historial</button>
        )}
      </div>
    </>
  );

  const formModal = (
    <HistorialFormModal
      abierto={formAbierto || !!viendo}
      editando={viendo ? viendo.id : editandoId}
      historialInicial={viendo || historialSeleccionado}
      cliente={cliente}
      soloLectura={!!viendo}
      onCerrar={() => { setFormAbierto(false); setViendo(null); }}
      onGuardado={cargar}
    />
  );

  if (enModal) {
    return (
      <>
        <div className="modal-overlay" onClick={onCerrar}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: extendido ? 1400 : 920, width: '97vw' }}>
            {contenido}
          </div>
        </div>
        {formModal}
      </>
    );
  }

  return (
    <>
      {contenido}
      {formModal}
    </>
  );
}
