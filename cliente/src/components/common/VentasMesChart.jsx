// cliente/src/components/common/VentasMesChart.jsx
// Gráfico de líneas "Ventas del mes" — SVG nativo, sin dependencias de charting.
// Diseño: línea suave (Catmull-Rom → Bézier), área sombreada debajo, tooltip al hover.
import { useMemo, useState } from 'react';

const fmt = v => '$' + Number(v || 0).toFixed(2);
const fmtCorto = v => Number(v || 0).toLocaleString('es-EC', { maximumFractionDigits: 0 });

function construirPathSuave(puntos) {
  if (puntos.length < 2) return '';
  let d = `M ${puntos[0].x} ${puntos[0].y}`;
  for (let i = 0; i < puntos.length - 1; i++) {
    const p0 = puntos[i - 1] || puntos[i];
    const p1 = puntos[i];
    const p2 = puntos[i + 1];
    const p3 = puntos[i + 2] || p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

export default function VentasMesChart({ data = [], loading = false, altura = 260 }) {
  const [hover, setHover] = useState(null);

  const { puntos, areaPath, lineaPath, max, dims, ticksY } = useMemo(() => {
    const ancho = 1000;
    const alto = altura;
    const padL = 40, padR = 10, padT = 16, padB = 28;
    const w = ancho - padL - padR;
    const h = alto - padT - padB;

    if (!data.length) {
      return { puntos: [], areaPath: '', lineaPath: '', max: 0, dims: { ancho, w, h, padL, padR, padT, padB }, ticksY: [] };
    }

    const max = Math.max(...data.map(d => Number(d.monto) || 0), 1);
    // Escala “amable”: redondea el máximo hacia arriba al siguiente múltiplo de 10/100/1000
    const escala = Math.pow(10, Math.floor(Math.log10(max)));
    const maxAmable = Math.max(escala, Math.ceil(max / escala) * escala);

    const pasoX = data.length > 1 ? w / (data.length - 1) : 0;
    const puntos = data.map((d, i) => ({
      x: padL + i * pasoX,
      y: padT + h - (Number(d.monto) || 0) / maxAmable * h,
      dia: d.dia,
      fecha: d.fecha,
      monto: Number(d.monto) || 0,
    }));

    const lineaPath = construirPathSuave(puntos);
    const areaPath = puntos.length
      ? `${lineaPath} L ${puntos[puntos.length - 1].x} ${padT + h} L ${puntos[0].x} ${padT + h} Z`
      : '';

    const ticksY = [0, 0.25, 0.5, 0.75, 1].map(p => ({
      y: padT + h - p * h,
      valor: p * maxAmable,
    }));

    return { puntos, areaPath, lineaPath, max: maxAmable, dims: { ancho, w, h, padL, padR, padT, padB }, ticksY };
  }, [data, altura]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: altura, color: '#6c757d', fontSize: 13 }}>
        <div className="spinner" style={{ marginRight: 10 }} /> Cargando gráfico...
      </div>
    );
  }

  if (!data.length) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: altura, color: '#adb5bd', fontSize: 13 }}>
        Sin ventas registradas este mes.
      </div>
    );
  }

  const { w, h, padL, padT, padB, ancho } = dims;
  
  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${ancho} ${altura}`}
        preserveAspectRatio="xMidYMid meet"
        style={{
          width: '100%',
          height: altura,
          display: 'block'
        }}
      >
        <defs>
          <linearGradient id="areaVentas" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#3498db" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#3498db" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid horizontal + etiquetas eje Y */}
        {ticksY.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={t.y} x2={padL + w} y2={t.y}
              stroke="#e9ecef" strokeDasharray="3 3" strokeWidth="1" />
            <text x={padL - 8} y={t.y + 3} textAnchor="end"
              fill="#6c757d" fontSize="9" fontFamily="monospace">
              {fmtCorto(t.valor)}
            </text>
          </g>
        ))}

        {/* Etiquetas eje X (día) — una cada ~5 días para evitar saturación */}
        {puntos.map((p, i) => (
          (p.dia === 1 || p.dia % 5 === 0 || i === puntos.length - 1) && (
            <text key={p.dia} x={p.x} y={padT + h + 16} textAnchor="middle"
              fill="#6c757d" fontSize="9" fontFamily="monospace">
              {p.dia}
            </text>
          )
        ))}

        {/* Área sombreada + línea suave */}
        {areaPath && <path d={areaPath} fill="url(#areaVentas)" stroke="none" />}
        {lineaPath && <path d={lineaPath} fill="none" stroke="#3498db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />}

        {/* Puntos + área de hover invisible */}
        {puntos.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={hover === i ? 4.5 : 2.5}
              fill="#3498db" stroke="#fff" strokeWidth="1.5" />
            <rect
              x={p.x - (puntos.length > 1 ? (w / (puntos.length - 1)) / 2 : w / 2)}
              y={padT} width={puntos.length > 1 ? w / (puntos.length - 1) : w} height={h}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
            />
          </g>
        ))}

        {/* Línea vertical guía en hover */}
        {hover != null && puntos[hover] && (
          <line
            x1={puntos[hover].x} y1={padT}
            x2={puntos[hover].x} y2={padT + h}
            stroke="#3498db" strokeDasharray="3 3" strokeWidth="1" opacity="0.5"
          />
        )}
      </svg>

      {/* Tooltip */}
      {hover != null && puntos[hover] && (
        <div style={{
          position: 'absolute',
          left: `${(puntos[hover].x / 600) * 100}%`,
          top: Math.max(puntos[hover].y - 50, 8),
          transform: 'translateX(-50%)',
          background: '#fff',
          border: '1px solid #dee2e6',
          borderRadius: 8,
          padding: '6px 10px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
          fontSize: 11,
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
          zIndex: 2,
        }}>
          <div style={{ color: '#6c757d', fontWeight: 600 }}>Día {puntos[hover].dia}</div>
          <div style={{ color: '#3498db', fontWeight: 700, fontSize: 13 }}>{fmt(puntos[hover].monto)}</div>
        </div>
      )}
    </div>
  );
}
