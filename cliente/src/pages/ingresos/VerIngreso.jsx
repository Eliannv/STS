import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/api';

const FMT = v => `$${parseFloat(v || 0).toFixed(2)}`;
const FMT_FECHA = s =>
  s ? new Date(s + 'T00:00:00').toLocaleDateString('es-EC', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  }) : '—';

const BADGE = (bg, color) => ({
  display: 'inline-block', padding: '3px 10px', borderRadius: 99,
  fontSize: 11, fontWeight: 600, background: bg, color,
});

export default function VerIngreso() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [ingreso,  setIngreso]  = useState(null);
  const [detalles, setDetalles] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');

  const cargar = useCallback(async () => {
    setLoading(true);
    const res = await api.get(`/ingreso/buscar/${id}`);
    if (res.ok) {
      const data = res.data.resultado;
      setIngreso(data);
      setDetalles(data.detalles || []);
    } else {
      setError('Ingreso no encontrado');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => { cargar(); }, [cargar]);

  function imprimir() { window.print(); }

  const totalUnidades = detalles.reduce((s, d) => s + parseInt(d.stock_ingresado || 0), 0);
  const totalCosto    = detalles.reduce((s, d) => s + parseFloat(d.subtotal || 0), 0);

  /* ── render states ──────────────────────────────────────── */
  if (loading) return (
    <div className="page">
      <div className="spinner-wrapper"><div className="spinner" /></div>
    </div>
  );

  if (error || !ingreso) return (
    <div className="page">
      <div className="alert alert-error">{error || 'No se pudo cargar el ingreso.'}</div>
      <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/ingresos')}>← Volver</button>
    </div>
  );

  const esFinalizado = ingreso.estado === 'FINALIZADO';
  const tieneAjustes = ingreso.descuento > 0 || ingreso.flete > 0 || ingreso.iva > 0 || ingreso.total > 0;

  return (
    <div className="page">

      {/* ═══ HEADER ═══ */}
      <div style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
        borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        color: '#fff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
              <polyline points="10 9 9 9 8 9"/>
            </svg>
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>
              Ingreso de Inventario
            </h2>
            <span style={{ fontSize: 12, opacity: 0.75, letterSpacing: '0.04em' }}>
              {ingreso.id_personalizado || `#${ingreso.id}`}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={imprimir} style={{
            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
            color: '#fff', borderRadius: 6, padding: '7px 16px', cursor: 'pointer',
            fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500,
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
              <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6"/>
              <rect x="6" y="14" width="12" height="8" rx="1"/>
            </svg>
            Imprimir
          </button>
          <button onClick={() => navigate('/ingresos')} style={{
            background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.25)',
            color: '#fff', borderRadius: 6, padding: '7px 16px', cursor: 'pointer', fontSize: 13, fontWeight: 500,
          }}>
            ← Volver
          </button>
        </div>
      </div>

      {/* ═══ CUERPO ═══ */}
      <div style={{
        background: '#fff', border: '1px solid var(--border-color)',
        borderTop: 'none', borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
        padding: '24px',
      }}>

        {/* Fila superior: Info General + Panel lateral */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: tieneAjustes ? '1fr 280px' : '1fr',
          gap: 24,
          marginBottom: 28,
        }}>

          {/* ── Columna izquierda ────────────────────────── */}
          <div>
            <SectionTitle>Información General</SectionTitle>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px 24px',
              marginBottom: ingreso.observacion ? 20 : 0,
            }}>
              <InfoItem label="ID Ingreso">
                <code style={{ background: '#f0f4ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                  {ingreso.id_personalizado || `#${ingreso.id}`}
                </code>
              </InfoItem>
              <InfoItem label="Proveedor">
                <strong style={{ fontSize: 14 }}>
                  {ingreso.proveedor_nombre || <em style={{ color: 'var(--text-muted)', fontWeight: 400 }}>Sin proveedor</em>}
                </strong>
              </InfoItem>
              <InfoItem label="Nro. Factura">
                <code style={{ background: '#f0f4ff', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                  {ingreso.numero_factura || '—'}
                </code>
              </InfoItem>
              <InfoItem label="Tipo de Compra">
                <span style={BADGE(
                  ingreso.tipo_compra === 'CONTADO' ? '#e8f5e9' : '#fce4ec',
                  ingreso.tipo_compra === 'CONTADO' ? '#2e7d32' : '#880e4f',
                )}>
                  {ingreso.tipo_compra}
                </span>
              </InfoItem>
              <InfoItem label="Estado">
                <span style={BADGE(
                  esFinalizado ? '#d4edda' : '#fff3cd',
                  esFinalizado ? '#155724' : '#856404',
                )}>
                  {esFinalizado ? 'Finalizado' : 'Borrador'}
                </span>
              </InfoItem>
              <InfoItem label="Fecha de Ingreso">
                <span style={{ fontSize: 14 }}>{FMT_FECHA(ingreso.fecha)}</span>
              </InfoItem>
            </div>

            {ingreso.observacion && (
              <div>
                <SectionTitle>Observación</SectionTitle>
                <p style={{
                  margin: 0, fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6,
                  background: '#fafbfc', border: '1px solid var(--border-light)',
                  borderRadius: 6, padding: '10px 14px',
                }}>
                  {ingreso.observacion}
                </p>
              </div>
            )}
          </div>

          {/* ── Columna derecha ──────────────────────────── */}
          {tieneAjustes && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              <div style={{
                background: '#f8fafc', border: '1px solid var(--border-color)',
                borderRadius: 8, padding: '16px',
              }}>
                <SectionTitle>Ajustes de Factura</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {ingreso.descuento > 0 && (
                    <AjusteRow label="Descuento">
                      <span style={{ color: '#e53935', fontWeight: 600 }}>-{FMT(ingreso.descuento)}</span>
                    </AjusteRow>
                  )}
                  {ingreso.flete > 0 && (
                    <AjusteRow label="Flete">
                      <span style={{ fontWeight: 600 }}>{FMT(ingreso.flete)}</span>
                    </AjusteRow>
                  )}
                  {ingreso.iva > 0 && (
                    <AjusteRow label="IVA">
                      <span style={{ fontWeight: 600 }}>{FMT(ingreso.iva)}</span>
                    </AjusteRow>
                  )}
                  <div style={{
                    borderTop: '2px solid var(--border-color)', paddingTop: 10, marginTop: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Total Factura</span>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#1565c0' }}>{FMT(ingreso.total)}</span>
                  </div>
                </div>
              </div>

              <div style={{
                background: 'linear-gradient(135deg, #f0f7ff, #e8f0fe)',
                border: '1px solid #c5d8f8', borderRadius: 8, padding: '16px',
              }}>
                <SectionTitle>Resumen</SectionTitle>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <AjusteRow label="Líneas de producto">
                    <strong>{detalles.length}</strong>
                  </AjusteRow>
                  <AjusteRow label="Unidades totales">
                    <strong>{totalUnidades}</strong>
                  </AjusteRow>
                  <div style={{
                    borderTop: '1px solid #c5d8f8', paddingTop: 9, marginTop: 2,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Costo total</span>
                    <span style={{ fontSize: 16, fontWeight: 700, color: '#1565c0' }}>{FMT(totalCosto)}</span>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ── Tabla de Productos (ancho completo) ──────── */}
        <div>
          <SectionTitle>
            Productos Ingresados{' '}
            <span style={{
              marginLeft: 6, fontSize: 11, fontWeight: 600,
              background: '#e8f0fe', color: '#1565c0',
              padding: '1px 8px', borderRadius: 99,
            }}>
              {detalles.length}
            </span>
          </SectionTitle>

          {detalles.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ color: 'var(--text-muted)', marginBottom: 8 }}>
                <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
              </svg>
              <p>No hay productos en este ingreso</p>
            </div>
          ) : (
            <>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: 8, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: '#f1f5f9', borderBottom: '2px solid var(--border-color)' }}>
                      {[
                        { label: '#',           w: 44,   align: 'center' },
                        { label: 'Nombre',      w: null, align: 'left'   },
                        { label: 'Modelo',      w: 110,  align: 'left'   },
                        { label: 'Color',       w: 100,  align: 'left'   },
                        { label: 'Grupo',       w: null, align: 'left'   },
                        { label: 'Tipo',        w: 90,   align: 'center' },
                        { label: 'Cant.',       w: 60,   align: 'center' },
                        { label: 'Costo Unit.', w: 110,  align: 'right'  },
                        { label: 'Subtotal',    w: 110,  align: 'right'  },
                      ].map(h => (
                        <th key={h.label} style={{
                          padding: '10px 14px', textAlign: h.align, fontWeight: 600,
                          fontSize: 11, color: 'var(--text-secondary)', whiteSpace: 'nowrap',
                          ...(h.w ? { width: h.w } : {}),
                        }}>
                          {h.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {detalles.map((d, i) => (
                      <tr key={d.id} style={{
                        borderBottom: i < detalles.length - 1 ? '1px solid var(--border-light)' : 'none',
                        background: i % 2 === 0 ? '#fff' : '#fafbfc',
                      }}>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <code style={{
                            background: '#f0f4ff', padding: '2px 7px',
                            borderRadius: 4, fontSize: 11, color: '#3b5bdb',
                          }}>
                            {i + 1}
                          </code>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <strong>{d.nombre || '—'}</strong>
                          {d.codigo && (
                            <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 6 }}>
                              ({d.codigo})
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{d.modelo || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{d.color  || '—'}</td>
                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{d.grupo  || '—'}</td>
                        <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                          <span style={BADGE(
                            d.tipo === 'NUEVO' ? '#e3f2fd' : '#f3e5f5',
                            d.tipo === 'NUEVO' ? '#1565c0' : '#6a1b9a',
                          )}>
                            {d.tipo === 'NUEVO' ? 'Nuevo' : 'Existente'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 700, fontSize: 14 }}>
                          {d.stock_ingresado}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                          {FMT(d.costo_unitario)}
                        </td>
                        <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: '#1565c0' }}>
                          {FMT(d.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totales (solo cuando no hay panel lateral) */}
              {!tieneAjustes && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 14 }}>
                  <div style={{
                    background: '#f8fafc', border: '1px solid var(--border-color)',
                    borderRadius: 8, padding: '14px 20px', minWidth: 260,
                    display: 'flex', flexDirection: 'column', gap: 6,
                  }}>
                    <TotalRow label="Total de productos"      value={detalles.length} />
                    <TotalRow label="Unidades totales"        value={totalUnidades} />
                    <TotalRow label="Costo total del ingreso" value={FMT(totalCosto)} highlight />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

/* ── Sub-componentes ────────────────────────────────────── */

function SectionTitle({ children }) {
  return (
    <div style={{
      fontSize: 11, fontWeight: 700, color: 'var(--text-secondary)',
      textTransform: 'uppercase', letterSpacing: '0.06em',
      marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4,
    }}>
      {children}
    </div>
  );
}

function InfoItem({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 14, color: 'var(--text-primary)' }}>
        {children}
      </div>
    </div>
  );
}

function AjusteRow({ label, children }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{ fontSize: 13 }}>{children}</span>
    </div>
  );
}

function TotalRow({ label, value, highlight }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderTop: highlight ? '1px solid var(--border-color)' : 'none',
      paddingTop: highlight ? 8 : 0, marginTop: highlight ? 4 : 0,
    }}>
      <span style={{
        fontSize: 12,
        color: highlight ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontWeight: highlight ? 600 : 400,
      }}>
        {label}
      </span>
      <strong style={{ fontSize: highlight ? 15 : 13, color: highlight ? '#1565c0' : 'var(--text-primary)' }}>
        {value}
      </strong>
    </div>
  );
}
