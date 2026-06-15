import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/api';
import HistorialFormModal from './HistorialFormModal';

/**
 * Modal reutilizable que muestra el listado de historiales clínicos de un cliente.
 *
 * Props:
 *   abierto      {boolean}
 *   cliente      {object}      — cliente cuyo historial se gestiona
 *   onCerrar     {() => void}
 *   onSeleccionar{(h) => void} — opcional; si se pasa muestra botón "Seleccionar"
 *   modoCompacto {boolean}     — si true (default), muestra vista resumida; false = vista completa
 */
export default function HistorialListModal({ abierto, cliente, onCerrar, onSeleccionar, modoCompacto = true, soloLectura = false }) {
  const { isAdmin } = useAuth();

  const [historiales, setHistoriales] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estado del formulario interno
  const [formAbierto, setFormAbierto] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [historialSeleccionado, setHistorialSeleccionado] = useState(null);

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
    if (v === '' || v === null || v === undefined) return '—';
    const n = parseFloat(v);
    return isNaN(n) ? String(v) : (n >= 0 ? `+${n.toFixed(2)}` : n.toFixed(2));
  }
  function fmtFecha(f) { return f ? new Date(f).toLocaleDateString('es-EC') : '—'; }

  if (!abierto) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onCerrar}>
        <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 920, width: '96vw' }}>
          {/* Header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Historiales clínicos</h2>
              {cliente && (
                <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 3 }}>
                  {cliente.nombres} {cliente.apellidos}
                  {cliente.cedula ? ` — ${cliente.cedula}` : ''}
                </p>
              )}
            </div>
            <button className="btn-icon" onClick={onCerrar}>✕</button>
          </div>

          {/* Body */}
          {loading
            ? <div className="spinner-wrapper" style={{ padding: 40 }}><div className="spinner" /></div>
            : (
              <div className="table-container" style={{ maxHeight: 400 }}>
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th style={{ textAlign: 'center' }}>OD Esf.</th>
                      <th style={{ textAlign: 'center' }}>OD Cil.</th>
                      <th style={{ textAlign: 'center' }}>OD Eje</th>
                      <th style={{ textAlign: 'center' }}>AVSC</th>
                      <th style={{ textAlign: 'center' }}>AVCC</th>
                      <th style={{ textAlign: 'center' }}>OI Esf.</th>
                      <th style={{ textAlign: 'center' }}>OI Cil.</th>
                      <th style={{ textAlign: 'center' }}>OI Eje</th>
                      <th style={{ textAlign: 'center' }}>DP</th>
                      <th style={{ textAlign: 'center' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historiales.length === 0
                      ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>No hay historiales clínicos para este paciente</td></tr>
                      : historiales.map(h => (
                        <tr key={h.id}>
                          <td style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtFecha(h.created_at)}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_esfera)}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.od_cilindro)}</td>
                          <td style={{ textAlign: 'center', fontSize: 13 }}>{h.od_eje ? `${h.od_eje}°` : '—'}</td>
                          <td style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avsc || '—'}</td>
                          <td style={{ textAlign: 'center', fontSize: 13 }}>{h.od_avcc || '—'}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_esfera)}</td>
                          <td style={{ textAlign: 'center', fontFamily: 'monospace', fontSize: 13 }}>{fmtGrad(h.oi_cilindro)}</td>
                          <td style={{ textAlign: 'center', fontSize: 13 }}>{h.oi_eje ? `${h.oi_eje}°` : '—'}</td>
                          <td style={{ textAlign: 'center', fontSize: 13 }}>{h.dp || '—'}</td>
                          <td>
                            <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                              {onSeleccionar && (
                                <button
                                  className="btn btn-primary btn-sm"
                                  style={{ padding: '3px 9px', fontSize: 11 }}
                                  title="Usar este historial en la venta"
                                  onClick={() => { onSeleccionar(h); onCerrar(); }}
                                >
                                  Seleccionar
                                </button>
                              )}
                              {soloLectura && (
                                <button className="btn-icon" title="Editar" onClick={() => abrirEditar(h)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                </button>
                              )}
                              {!soloLectura && isAdmin && (
                                <button className="btn-icon danger" title="Eliminar" onClick={() => eliminar(h.id)}>
                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            )
          }

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, padding: '14px 24px', borderTop: '1px solid var(--border-color)' }}>
            <button className="btn btn-ghost" onClick={onCerrar}>Cerrar</button>
            {!soloLectura && (
              <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo historial</button>
            )}
          </div>
        </div>
      </div>

      <HistorialFormModal
        abierto={formAbierto}
        editando={editandoId}
        historialInicial={historialSeleccionado}
        cliente={cliente}
        onCerrar={() => setFormAbierto(false)}
        onGuardado={cargar}
      />
    </>
  );
}
