import { useState, useMemo } from 'react';
import { Eye, Pencil, GitCompare, TrendingUp, TrendingDown, Minus, CalendarClock, Activity, ListChecks } from 'lucide-react';
import { fecha } from './fichaUtils';
import { Tarjeta, Vacio } from './fichaUI';

// Parámetros que definen la graduación y permiten comparar dos exámenes.
const PARAMETROS = [
  { clave: 'od_esfera',   etiqueta: 'OD Esfera' },
  { clave: 'od_cilindro', etiqueta: 'OD Cilindro' },
  { clave: 'od_eje',      etiqueta: 'OD Eje',      sinSigno: true },
  { clave: 'oi_esfera',   etiqueta: 'OI Esfera' },
  { clave: 'oi_cilindro', etiqueta: 'OI Cilindro' },
  { clave: 'oi_eje',      etiqueta: 'OI Eje',      sinSigno: true },
  { clave: 'add',         etiqueta: 'Adición' },
  { clave: 'dp',          etiqueta: 'DP',          sinSigno: true },
];

const valor = (historial, clave) => {
  const bruto = historial?.[clave];
  return bruto == null || bruto === '' ? null : Number(bruto);
};

const conSigno = (numero, sinSigno) => {
  if (numero == null) return '—';
  return sinSigno ? String(numero) : `${numero > 0 ? '+' : ''}${numero.toFixed(2)}`;
};

// Un cambio de graduación es clínicamente relevante a partir de 0.25 dioptrías.
const CAMBIO_SIGNIFICATIVO = 0.25;

function IndicadorClinico({ icono: Icono, color, etiqueta, valor: dato, nota }) {
  return (
    <div className="card" style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 9, flexShrink: 0,
        background: `${color}1a`, color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icono size={18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5, color: 'var(--text-muted)' }}>{etiqueta}</div>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{dato}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{nota}</div>
      </div>
    </div>
  );
}

// En óptica, acercarse a cero es mejorar: menos dioptrías de corrección. El
// algoritmo de comparación no cambia, solo se interpreta el signo del cambio.
function Diferencia({ anterior, actual, sinSigno }) {
  if (anterior == null || actual == null) return <Minus size={13} color="#adb5bd" />;
  const delta = Number((actual - anterior).toFixed(2));
  if (Math.abs(delta) < CAMBIO_SIGNIFICATIVO) {
    return <span style={{ fontSize: 11, color: '#6c757d', display: 'flex', alignItems: 'center', gap: 3 }}><Minus size={12} /> Sin cambio</span>;
  }
  // El eje y la DP no "mejoran" ni "empeoran": solo cambian.
  const mejora = sinSigno ? null : Math.abs(actual) < Math.abs(anterior);
  const color = mejora === null ? '#6c757d' : (mejora ? '#27ae60' : '#e74c3c');
  const Icono = mejora === null ? Minus : (mejora ? TrendingDown : TrendingUp);
  const texto = mejora === null ? 'Cambió' : (mejora ? 'Mejoró' : 'Empeoró');
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, color, display: 'inline-flex', alignItems: 'center', gap: 4,
      background: `${color}14`, padding: '2px 8px', borderRadius: 20,
    }}>
      <Icono size={12} /> {texto} ({conSigno(delta, sinSigno)})
    </span>
  );
}

export default function TabHistorialClinico({ historiales, estadisticas, onVer, onEditar, onNuevo, esAdmin }) {
  const [comparando, setComparando] = useState(false);
  const [izquierda, setIzquierda] = useState('');
  const [derecha, setDerecha] = useState('');

  // El comparador solo tiene sentido con dos o más exámenes.
  const puedeComparar = historiales.length > 1;

  const ordenados = useMemo(
    () => [...historiales].sort((a, b) => new Date(b.fecha_chequeo ?? b.created_at) - new Date(a.fecha_chequeo ?? a.created_at)),
    [historiales],
  );

  const parA = ordenados.find((h) => String(h.id) === izquierda) ?? ordenados[1] ?? null;
  const parB = ordenados.find((h) => String(h.id) === derecha) ?? ordenados[0] ?? null;

  // Cuántos parámetros cambiaron de forma relevante entre los dos últimos exámenes.
  const cambiosDetectados = useMemo(() => {
    const [actual, anterior] = ordenados;
    if (!actual || !anterior) return 0;
    return PARAMETROS.filter((parametro) => {
      const a = valor(anterior, parametro.clave);
      const b = valor(actual, parametro.clave);
      return a != null && b != null && Math.abs(b - a) >= CAMBIO_SIGNIFICATIVO;
    }).length;
  }, [ordenados]);

  if (historiales.length === 0) {
    return (
      <div className="card" style={{ padding: 0 }}>
        <Vacio mensaje="Este cliente aún no tiene historiales clínicos." />
        <div style={{ textAlign: 'center', paddingBottom: 24 }}>
          <button className="btn btn-primary" onClick={onNuevo}>+ Nuevo historial</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
        <IndicadorClinico icono={CalendarClock} color="#9b59b6" etiqueta="Último examen"
          valor={fecha(estadisticas.ultimoExamen)}
          nota={estadisticas.diasDesdeUltimoExamen != null ? `Hace ${estadisticas.diasDesdeUltimoExamen} días` : 'Sin registros'} />
        <IndicadorClinico icono={ListChecks} color="#3498db" etiqueta="Controles realizados"
          valor={estadisticas.totalHistoriales}
          nota={historiales.length > 1 ? 'Permite comparar evolución' : 'Se necesita otro para comparar'} />
        <IndicadorClinico icono={Activity} color={cambiosDetectados > 0 ? '#e67e22' : '#27ae60'} etiqueta="Cambios de graduación"
          valor={cambiosDetectados}
          nota={historiales.length > 1 ? 'Entre los dos últimos exámenes' : 'Requiere dos exámenes'} />
        <IndicadorClinico icono={CalendarClock} color={estadisticas.controlVencido ? '#e74c3c' : '#27ae60'} etiqueta="Próxima revisión"
          valor={fecha(estadisticas.proximoControlRecomendado)}
          nota={estadisticas.controlVencido ? 'Vencida' : `Cada ${estadisticas.diasRevisionRecomendada} días`} />
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {puedeComparar && (
          <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            onClick={() => setComparando((estado) => !estado)}>
            <GitCompare size={15} /> {comparando ? 'Ocultar comparador' : 'Comparar historiales'}
          </button>
        )}
        <button className="btn btn-primary" onClick={onNuevo}>+ Nuevo historial</button>
      </div>

      {comparando && puedeComparar && (
        <Tarjeta titulo="Evolución de la graduación">
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Examen anterior</label>
              <select className="form-control" value={izquierda || parA?.id || ''} onChange={(e) => setIzquierda(e.target.value)}>
                {ordenados.map((h) => <option key={h.id} value={h.id}>{fecha(h.fecha_chequeo ?? h.created_at)}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label" style={{ fontSize: 11 }}>Examen actual</label>
              <select className="form-control" value={derecha || parB?.id || ''} onChange={(e) => setDerecha(e.target.value)}>
                {ordenados.map((h) => <option key={h.id} value={h.id}>{fecha(h.fecha_chequeo ?? h.created_at)}</option>)}
              </select>
            </div>
          </div>

          {parA && parB && parA.id === parB.id ? (
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Seleccione dos exámenes distintos para comparar.</div>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Parámetro</th>
                    <th style={{ textAlign: 'center' }}>{fecha(parA?.fecha_chequeo ?? parA?.created_at)}</th>
                    <th style={{ textAlign: 'center' }}>{fecha(parB?.fecha_chequeo ?? parB?.created_at)}</th>
                    <th style={{ textAlign: 'center' }}>Cambio</th>
                  </tr>
                </thead>
                <tbody>
                  {PARAMETROS.map((parametro) => {
                    const anterior = valor(parA, parametro.clave);
                    const actual = valor(parB, parametro.clave);
                    return (
                      <tr key={parametro.clave}>
                        <td style={{ fontWeight: 600 }}>{parametro.etiqueta}</td>
                        <td style={{ textAlign: 'center' }}>{conSigno(anterior, parametro.sinSigno)}</td>
                        <td style={{ textAlign: 'center', fontWeight: 700 }}>{conSigno(actual, parametro.sinSigno)}</td>
                        <td>
                          <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Diferencia anterior={anterior} actual={actual} sinSigno={parametro.sinSigno} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      )}

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Fecha</th><th>OD (Esf/Cil/Eje)</th><th>OI (Esf/Cil/Eje)</th>
                <th>Adición</th><th>DP</th><th>Observación</th>
                <th style={{ textAlign: 'center' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.map((historial) => (
                <tr key={historial.id}>
                  <td style={{ whiteSpace: 'nowrap', fontWeight: 600 }}>{fecha(historial.fecha_chequeo ?? historial.created_at)}</td>
                  <td>{conSigno(valor(historial, 'od_esfera'))} / {conSigno(valor(historial, 'od_cilindro'))} / {historial.od_eje ?? '—'}</td>
                  <td>{conSigno(valor(historial, 'oi_esfera'))} / {conSigno(valor(historial, 'oi_cilindro'))} / {historial.oi_eje ?? '—'}</td>
                  <td>{conSigno(valor(historial, 'add'))}</td>
                  <td>{historial.dp ?? '—'}</td>
                  <td style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {historial.observacion || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                      <button className="btn-icon" title="Ver" style={{ color: '#1a56db' }} onClick={() => onVer(historial)}>
                        <Eye size={14} />
                      </button>
                      {esAdmin && (
                        <button className="btn-icon" title="Editar" style={{ color: '#6c757d' }} onClick={() => onEditar(historial)}>
                          <Pencil size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
