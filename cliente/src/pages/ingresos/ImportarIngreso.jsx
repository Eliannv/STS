import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ProveedorFormModal from '../../components/proveedores/ProveedorFormModal';
import { PartyPopper, SquareCheck, TriangleAlert} from 'lucide-react';

const HOY = new Date().toISOString().split('T')[0];

const GRUPOS = [
  'ARMAZONES', 'LENTES DE CONTACTO', 'LIQUIDO DE LENTES DE CONTACTO',
  'LIQUIDO DESEMPAÑANTE', 'GAFAS', 'LUNAS', 'SERVICIOS', 'VARIOS',
];

function parsearNumero(val) {
  if (!val && val !== 0) return 0;
  const n = parseFloat(String(val).replace(/[$,]/g, '').trim());
  return isNaN(n) ? 0 : n;
}

function parsearFecha(val) {
  if (!val) return HOY;
  if (val instanceof Date) return val.toISOString().split('T')[0];
  if (typeof val === 'number') {
    const d = new Date(Math.round((val - 25569) * 86400 * 1000));
    return d.toISOString().split('T')[0];
  }
  const m = String(val).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (m) return `${m[3]}-${m[2]}-${m[1]}`;
  const d = new Date(val);
  if (!isNaN(d)) return d.toISOString().split('T')[0];
  return HOY;
}

function leerExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const wb = XLSX.read(data, { type: 'array', cellDates: true });
        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) throw new Error('El archivo no contiene hojas');

        const get = (col, row) => {
          const cell = ws[`${col}${row}`];
          return cell ? cell.v : '';
        };

        const proveedor     = String(get('C', 3) || '').trim();
        const numeroFactura = String(get('E', 3) || '').trim();
        const fechaRaw      = get('C', 4);
        const fecha         = parsearFecha(fechaRaw);

        if (!proveedor)     throw new Error('No se encontró el proveedor en C3');
        if (!numeroFactura) throw new Error('No se encontró el N° de factura en E3');

        const productos = [];
        let row = 6;
        while (true) {
          const nombre = String(get('C', row) || '').trim();
          const codigo = String(get('B', row) || '').trim();
          if (!nombre && !codigo) break;

          const cantidad = parsearNumero(get('A', row)) || 1;
          const modelo   = String(get('D', row) || '').trim();
          const color    = String(get('E', row) || '').trim();
          const grupoRaw = String(get('F', row) || '').trim().toUpperCase();
          const grupo    = GRUPOS.includes(grupoRaw) ? grupoRaw : 'VARIOS';
          const costo    = parsearNumero(get('G', row));
          const pvp1     = parsearNumero(get('H', row));

          productos.push({ cantidad, codigo, nombre, modelo, color, grupo, costo, pvp1 });
          row++;
        }

        if (productos.length === 0) throw new Error('No se encontraron productos en el archivo (desde fila 6)');

        resolve({ proveedor, numeroFactura, fecha, productos });
      } catch (err) {
        reject(err);
      }
    };
    reader.readAsArrayBuffer(file);
  });
}

function descargarPlantilla() {
  const a = document.createElement('a');
  a.href = '/plantilla_importacion_productos.xlsx';
  a.download = 'plantilla_importacion_productos.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function SectionHeader({ num, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%',
        background: 'var(--primary-color, #3498db)', color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, flexShrink: 0,
      }}>
        {num}
      </div>
      <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)' }}>{label}</span>
    </div>
  );
}

export default function ImportarIngreso() {
  const navigate = useNavigate();
  const { usuario } = useAuth();

  const [paso, setPaso]             = useState(1);
  const [archivo, setArchivo]       = useState(null);
  const [leyendo, setLeyendo]       = useState(false);
  const [errorPaso1, setErrorPaso1] = useState('');

  const [datos, setDatos]               = useState(null);
  const [proveedores, setProveedores]   = useState([]);
  const [proveedorId, setProveedorId]   = useState(null);
  const [provExiste, setProvExiste]     = useState(false);
  const [validandoFac, setValidandoFac] = useState(false);
  const [facturaDup, setFacturaDup]     = useState(false);
  const [descuento, setDescuento]       = useState('0');
  const [flete, setFlete]               = useState('0');
  const [iva, setIva]                   = useState('0');
  const [tipoCompra, setTipoCompra]     = useState('CONTADO');
  const [productos, setProductos]       = useState([]);
  const [errorPaso2, setErrorPaso2]     = useState('');

  const [guardando, setGuardando] = useState(false);
  const [resultado, setResultado] = useState(null);

  // Modal crear proveedor
  const [modalProv, setModalProv] = useState(false);

  useEffect(() => {
    api.get('/proveedor/lista').then(r => {
      if (r.ok) setProveedores(r.data.resultado || []);
    });
  }, []);

  async function procesarArchivo() {
    if (!archivo) return;
    setLeyendo(true);
    setErrorPaso1('');
    try {
      const leido = await leerExcel(archivo);

      // Búsqueda exacta primero, luego fuzzy como fallback
      const nombreExcel = leido.proveedor.toLowerCase().trim();
      let prov = proveedores.find(p => p.nombre.toLowerCase().trim() === nombreExcel);
      if (!prov) prov = proveedores.find(p => p.nombre.toLowerCase().trim().includes(nombreExcel));
      setProveedorId(prov?.id || null);
      setProvExiste(!!prov);

      setValidandoFac(true);
      const resCheck = await api.get(`/ingreso/lista?buscar=${encodeURIComponent(leido.numeroFactura)}`);
      const dup = (resCheck.data?.resultado || []).some(i => i.numero_factura === leido.numeroFactura);
      setFacturaDup(dup);
      setValidandoFac(false);

      const enriquecidos = await Promise.all(leido.productos.map(async (p) => {
        if (!p.codigo) return { ...p, estado: 'NUEVO', productoId: null };
        const res = await api.get(`/producto/lista?buscar=${encodeURIComponent(p.codigo)}`);
        const encontrado = (res.data?.resultado || []).find(
          prod => (prod.codigo || '').toLowerCase() === p.codigo.toLowerCase()
        );
        return { ...p, estado: encontrado ? 'EXISTENTE' : 'NUEVO', productoId: encontrado?.id || null };
      }));

      setDatos(leido);
      setDescuento('0');
      setFlete('0');
      setIva('0');
      setProductos(enriquecidos);
      setPaso(2);
    } catch (err) {
      setErrorPaso1(err.message || 'Error al leer el archivo');
    } finally {
      setLeyendo(false);
    }
  }

  async function confirmarImportacion() {
    if (!provExiste || facturaDup || validandoFac) return;
    setGuardando(true);
    setErrorPaso2('');
    setPaso(3);

    try {
      const detalles = productos.map(p => ({
        productoId:     p.estado === 'EXISTENTE' ? p.productoId : null,
        tipo:           p.estado,
        codigo:         p.codigo  || '',
        nombre:         p.nombre,
        modelo:         p.modelo  || '',
        color:          p.color   || '',
        grupo:          p.grupo   || 'VARIOS',
        pvp1:           parseFloat(p.pvp1)  || 0,
        observacion:    p.observacion || null,
        stockIngresado: p.cantidad,
        costoUnitario:  parseFloat(p.costo) || 0,
        subtotal:       parseFloat(((p.costo || 0) * (p.cantidad || 0)).toFixed(2)),
      }));

      const resCrear = await api.post('/ingreso/crear', {
        proveedorId:     proveedorId || null,
        proveedorNombre: datos.proveedor,
        numeroFactura:   datos.numeroFactura,
        fecha:           datos.fecha,
        tipoCompra,
        descuento:       parseFloat(descuento) || 0,
        flete:           parseFloat(flete)     || 0,
        iva:             parseFloat(iva)       || 0,
        observacion:     'Importado desde Excel',
        detalles,
      });

      if (!resCrear.ok) {
        setErrorPaso2(resCrear.data?.resultado || 'Error al crear el ingreso');
        setGuardando(false);
        setPaso(2);
        return;
      }

      const ingresoId = resCrear.data.resultado.id;

      // Los detalles ya se guardaron en /ingreso/crear (el backend los procesa juntos)
      // Solo queda finalizar el ingreso para actualizar stock y estado

      const resFin = await api.put('/ingreso/finalizar', { id: ingresoId });
      if (!resFin.ok) {
        setErrorPaso2(resFin.data?.resultado || 'Error al finalizar el ingreso');
        setGuardando(false);
        setPaso(2);
        return;
      }

      setResultado(resFin.data.resultado);
    } catch (err) {
      setErrorPaso2(err.message || 'Error inesperado');
      setGuardando(false);
      setPaso(2);
    } finally {
      setGuardando(false);
    }
  }

  const productosNuevos     = productos.filter(p => p.estado === 'NUEVO').length;
  const productosExistentes = productos.filter(p => p.estado === 'EXISTENTE').length;

  // Recarga proveedores tras crear uno nuevo y auto-selecciona el que coincida con el Excel
  async function onProveedorGuardado() {
    const res = await api.get('/proveedor/lista');
    if (!res.ok) return;
    const lista = res.data.resultado || [];
    setProveedores(lista);
    if (datos) {
      const nombreExcel = datos.proveedor.toLowerCase().trim();
      const prov = lista.find(p => p.nombre.toLowerCase().trim() === nombreExcel)
                || lista.find(p => p.nombre.toLowerCase().trim().includes(nombreExcel));
      if (prov) {
        setProveedorId(prov.id);
        setProvExiste(true);
      }
    }
    setModalProv(false);
  }

  function actualizarProducto(idx, campo, valor) {
    setProductos(prev => prev.map((p, i) => i === idx ? { ...p, [campo]: valor } : p));
  }

  const puedeConfirmar = provExiste && !facturaDup && !validandoFac && !guardando && productos.length > 0;

  return (
    <div className="page">

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
        <button className="btn-icon" style={{ padding: 0 }} onClick={() => navigate('/ingresos')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ cursor: 'pointer', color: 'var(--primary-color)' }} onClick={() => navigate('/ingresos')}>
          Ingresos
        </span>
        <span>›</span>
        <span>Importar desde Excel</span>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
        {[
          { n: 1, label: 'Subir archivo' },
          { n: 2, label: 'Revisar datos' },
          { n: 3, label: 'Procesar' },
        ].map((s, i) => {
          const done   = paso > s.n;
          const active = paso === s.n;
          return (
            <div key={s.n} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700,
                  background: done ? '#22c55e' : active ? 'var(--primary-color, #3498db)' : '#e2e8f0',
                  color: (done || active) ? '#fff' : '#94a3b8',
                }}>
                  {done ? '✓' : s.n}
                </div>
                <span style={{
                  fontSize: 13, fontWeight: active ? 700 : 500,
                  color: done ? '#22c55e' : active ? 'var(--primary-color, #3498db)' : '#94a3b8',
                  whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && (
                <div style={{
                  flex: 1, height: 2, margin: '0 12px',
                  background: done ? '#22c55e' : 'var(--border-color, #e2e8f0)',
                }} />
              )}
            </div>
          );
        })}
      </div>

      {/* CARD PRINCIPAL */}
      <div className="card" style={{ overflow: 'visible' }}>

        {/* Header gradiente */}
        <div style={{
          background: 'linear-gradient(135deg, #2c3e50 0%, #3498db 100%)',
          padding: '22px 28px',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="18" x2="12" y2="12"/>
              <line x1="9" y1="15" x2="15" y2="15"/>
            </svg>
          </div>
          <div>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700 }}>
              {paso === 1 ? 'Importar desde Excel' : paso === 2 ? 'Revisar productos' : 'Procesando importación'}
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, marginTop: 2 }}>
              {paso === 1
                ? 'Paso 1 de 3 — Selecciona tu archivo Excel con la plantilla de Óptica Macías'
                : paso === 2
                  ? 'Paso 2 de 3 — Revisa y ajusta los datos antes de confirmar'
                  : 'Paso 3 de 3 — Creando ingreso y actualizando inventario'}
            </p>
          </div>
        </div>

        {/* PASO 1: Subir archivo */}
        {paso === 1 && (
          <>
            <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

              {errorPaso1 && (
                <div className="alert alert-error" style={{ width: '100%', maxWidth: 560 }}>{errorPaso1}</div>
              )}

              {/* Zona de carga — card pequeña centrada */}
              <div style={{ width: '100%', maxWidth: 520 }}>
                
                <label style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 10, border: `2px dashed ${archivo ? '#22c55e' : 'var(--border-color, #cbd5e1)'}`,
                  borderRadius: 12, padding: '40px 24px', cursor: 'pointer', marginTop: 12,
                  background: archivo ? '#f0fff4' : 'var(--bg-secondary, #f8fafc)',
                  transition: 'all 0.2s',
                }}>
                  <input
                    type="file" accept=".xlsx,.xls" style={{ display: 'none' }}
                    onChange={e => { if (e.target.files?.[0]) { setArchivo(e.target.files[0]); setErrorPaso1(''); } }}
                  />
                  {archivo ? (
                    <>
                      <SquareCheck size={48} style={{ color: '#16a34a', marginBottom: 12 }}/>
                      <div style={{ fontWeight: 700, color: '#15803d', fontSize: 15 }}>{archivo.name}</div>
                      <div style={{ fontSize: 12, color: '#64748b' }}>
                        {(archivo.size / 1024).toFixed(1)} KB · Haz clic para cambiar el archivo
                      </div>
                    </>
                  ) : (
                    <>
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <line x1="9" y1="15" x2="15" y2="15"/>
                      </svg>
                      <div style={{ fontWeight: 600, color: '#475569' }}>Haz clic para seleccionar</div>
                      <div style={{ fontSize: 12, color: '#94a3b8' }}>Formatos aceptados: .xlsx, .xls</div>
                    </>
                  )}
                </label>
              </div>

              

            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 28px', borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)',
            }}>
              <button type="button" className="btn btn-ghost" onClick={descargarPlantilla}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 6 }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                Descargar plantilla
              </button>
              <button
                type="button"
                className="btn btn-primary"
                disabled={!archivo || leyendo}
                onClick={procesarArchivo}
                style={{ minWidth: 140 }}
              >
                {leyendo
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Leyendo...</>
                  : <>Siguiente <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}><polyline points="9 18 15 12 9 6"/></svg></>
                }
              </button>
            </div>
          </>
        )}

        {/* PASO 2: Preview y edición */}
        {paso === 2 && datos && (
          <>
            <div style={{ padding: '16px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {errorPaso2 && <div className="alert alert-error">{errorPaso2}</div>}

              {/* Datos detectados — barra compacta */}
              <section>
                <SectionHeader num={1} label="Datos generales" />
                <div style={{
                  display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '6px 20px',
                  marginTop: 12,
                  background: 'var(--bg-secondary, #f8fafc)',
                  border: '1px solid var(--border-color, #e2e8f0)',
                  borderRadius: 10, padding: '10px 16px',
                }}>
                  {/* Proveedor */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Proveedor</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{datos.proveedor}</span>
                    {provExiste
                      ? <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>✓</span>
                      : <>
                          <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>✗</span>
                          <button
                            type="button"
                            onClick={() => setModalProv(true)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 4,
                              padding: '2px 10px', borderRadius: 99, border: 'none', cursor: 'pointer',
                              background: 'var(--primary-color, #3498db)', color: '#fff',
                              fontSize: 11, fontWeight: 700,
                            }}
                          >
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                            Crear proveedor
                          </button>
                        </>
                    }
                  </div>
                  <span style={{ color: 'var(--border-color, #e2e8f0)', fontSize: 18 }}>|</span>
                  {/* Factura */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>N° Fact.</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{datos.numeroFactura}</span>
                    {validandoFac
                      ? <span style={{ fontSize: 11, color: '#64748b' }}>...</span>
                      : facturaDup
                        ? <span style={{ fontSize: 10, background: '#fef2f2', color: '#dc2626', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}><TriangleAlert size={12} /></span>
                        : <span style={{ fontSize: 10, background: '#dcfce7', color: '#15803d', padding: '1px 7px', borderRadius: 99, fontWeight: 700 }}>✓</span>
                    }
                  </div>
                  <span style={{ color: 'var(--border-color, #e2e8f0)', fontSize: 18 }}>|</span>
                  {/* Fecha */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Fecha</span>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>{new Date(datos.fecha + 'T00:00:00').toLocaleDateString('es-EC')}</span>
                  </div>
                  <span style={{ color: 'var(--border-color, #e2e8f0)', fontSize: 18 }}>|</span>
                  {/* Productos */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Productos</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--primary-color, #3498db)' }}>{productos.length}</span>
                    <span style={{ fontSize: 11, color: '#64748b' }}>({productosNuevos} nuevos · {productosExistentes} exist.)</span>
                  </div>
                </div>
              </section>

              {/* Ajustes de la compra */}
              <section>
                <SectionHeader num={2} label="Ajustes" />
                <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'nowrap', alignItems: 'flex-end' }}>
                  {/* Toggle contado/crédito */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 185}}>
                    <label className="form-label" style={{ marginBottom: 0 }}> Tipo de compra </label>
                    <div style={{ display: 'flex', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 8, overflow: 'hidden' }} >
                      {['CONTADO', 'CREDITO'].map(tipo => (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => setTipoCompra(tipo)}
                          style={{
                            padding: '8px 20px', border: 'none',
                            background: tipoCompra === tipo ? 'var(--primary-color, #3498db)' : 'transparent',
                            color: tipoCompra === tipo ? '#fff' : 'var(--text-secondary)',
                            fontWeight: 600, fontSize: 13, cursor: 'pointer',
                            transition: 'all 0.15s',
                          }}
                        >
                          {tipo === 'CONTADO' ? '$ Contado' : 'Crédito'}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Descuento */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Descuento ($)</label>
                    <input type="number" className="form-control" min="0" step="0.01" value={descuento} onChange={e => setDescuento(e.target.value)} placeholder="0.00" style={{ padding: '7px 10px' }} />
                  </div>
                  {/* Flete */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>Flete ($)</label>
                    <input type="number" className="form-control" min="0" step="0.01" value={flete} onChange={e => setFlete(e.target.value)} placeholder="0.00" style={{ padding: '7px 10px' }} />
                  </div>
                  {/* IVA */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 110 }}>
                    <label className="form-label" style={{ marginBottom: 0 }}>IVA ($)</label>
                    <input type="number" className="form-control" min="0" step="0.01" value={iva} onChange={e => setIva(e.target.value)} placeholder="0.00" style={{ padding: '7px 10px' }} />
                  </div>
                </div>
              </section>

              {/* Tabla de productos */}
              <section>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <SectionHeader num={3} label="Productos a importar" />
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Edita grupo, costo y PVP antes de confirmar</span>
                </div>
                <div style={{ border: '1px solid var(--border-color, #e2e8f0)', borderRadius: 10, overflow: 'hidden' }}>
                  <div className="table-container" style={{ margin: 0, borderRadius: 0 }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Estado</th>
                          <th>Cant.</th>
                          <th>Código</th>
                          <th>Nombre</th>
                          <th>Modelo / Color</th>
                          <th style={{ minWidth: 160 }}>Grupo</th>
                          <th style={{ minWidth: 100 }}>Costo ($)</th>
                          <th style={{ minWidth: 100 }}>PVP ($)</th>
                          <th style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {productos.map((p, i) => (
                          <tr key={i}>
                            <td>
                              {p.estado === 'EXISTENTE'
                                ? <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#dcfce7', color: '#15803d' }}>EXISTE</span>
                                : <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#dbeafe', color: '#1d4ed8' }}>NUEVO</span>
                              }
                            </td>
                            <td style={{ textAlign: 'center', fontWeight: 700 }}>{p.cantidad}</td>
                            <td>
                              <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>
                                {p.codigo || '—'}
                              </code>
                            </td>
                            <td style={{ fontWeight: 500 }}>{p.nombre}</td>
                            <td style={{ color: 'var(--text-muted)', fontSize: 12 }}>
                              {[p.modelo, p.color].filter(Boolean).join(' · ') || '—'}
                            </td>
                            <td>
                              <select
                                className="form-control"
                                style={{ padding: '4px 8px', fontSize: 12 }}
                                value={p.grupo}
                                onChange={e => actualizarProducto(i, 'grupo', e.target.value)}
                              >
                                {GRUPOS.map(g => <option key={g} value={g}>{g}</option>)}
                              </select>
                            </td>
                            <td>
                              <input
                                type="number" min="0" step="0.01"
                                className="form-control"
                                style={{ padding: '4px 8px', fontSize: 12, width: 90 }}
                                value={p.costo}
                                onChange={e => actualizarProducto(i, 'costo', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number" min="0" step="0.01"
                                className="form-control"
                                style={{ padding: '4px 8px', fontSize: 12, width: 90 }}
                                value={p.pvp1}
                                onChange={e => actualizarProducto(i, 'pvp1', e.target.value)}
                              />
                            </td>
                            <td>
                              <button
                                title="Quitar este producto"
                                type="button"
                                onClick={() => setProductos(prev => prev.filter((_, idx) => idx !== i))}
                                style={{
                                  background: 'none', border: 'none', cursor: 'pointer',
                                  color: '#ef4444', padding: '4px 6px', borderRadius: 6,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="3 6 5 6 21 6"/>
                                  <path d="M19 6l-1 14H6L5 6"/>
                                  <path d="M10 11v6"/>
                                  <path d="M14 11v6"/>
                                  <path d="M9 6V4h6v2"/>
                                </svg>
                              </button>
                            </td>
                          </tr>
                        ))}
                        {productos.length === 0 && (
                          <tr>
                            <td colSpan={9} style={{ textAlign: 'center', padding: '28px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                              No hay productos. Vuelve y selecciona otro archivo.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '16px 28px', borderTop: '1px solid var(--border-color)',
              background: 'var(--bg-secondary)', flexWrap: 'wrap', gap: 10,
            }}>
              <button type="button" className="btn btn-ghost" onClick={() => setPaso(1)}>
                ← Volver
              </button>

              <button
                type="button"
                className="btn btn-primary"
                onClick={() => puedeConfirmar && confirmarImportacion()}
                style={{
                  minWidth: 220,
                  background: !provExiste
                    ? '#f97316'
                    : facturaDup
                      ? '#ef4444'
                      : productos.length === 0
                        ? '#94a3b8'
                        : undefined,
                  cursor: puedeConfirmar ? 'pointer' : 'default',
                  opacity: validandoFac ? 0.8 : 1,
                  justifyContent: 'center',
                }}
              >
                {validandoFac
                  ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Validando factura...</>
                  : !provExiste
                    ? 'Registra el proveedor primero'
                    : facturaDup
                      ? 'Factura duplicada'
                      : productos.length === 0
                        ? 'Sin productos para importar'
                        : <>Confirmar Importación <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}><polyline points="9 18 15 12 9 6"/></svg></>
                }
              </button>
            </div>
          </>
        )}

        {/* PASO 3: Procesando / Éxito */}
        {paso === 3 && (
          <div style={{ padding: '64px 28px', textAlign: 'center' }}>
            {!resultado ? (
              <>
                <div className="spinner" style={{ width: 52, height: 52, margin: '0 auto 20px', borderWidth: 4 }} />
                <h4 style={{ fontWeight: 700, fontSize: 20, marginBottom: 10 }}>Procesando importación...</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 360, margin: '0 auto' }}>
                  Creando el ingreso y actualizando el inventario. Por favor espera.
                </p>
              </>
            ) : (
              <>
                <PartyPopper size={48} style={{ color: '#16a34a', marginBottom: 12 }} />
                <h4 style={{ fontWeight: 700, fontSize: 22, marginBottom: 8, color: '#15803d' }}>¡Importación exitosa!</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 28, maxWidth: 400, margin: '0 auto 28px' }}>
                  Se creó el ingreso{' '}
                  <strong>{resultado.id_personalizado || `#${resultado.id}`}</strong>{' '}
                  con <strong>{productos.length}</strong> líneas de productos. El inventario ha sido actualizado.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button className="btn btn-ghost" onClick={() => navigate('/ingresos')}>
                    Ver todos los ingresos
                  </button>
                  <button className="btn btn-primary" onClick={() => navigate(`/ingresos/${resultado.id}`)}>
                    Ver detalle del ingreso
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 4 }}>
                      <polyline points="9 18 15 12 9 6"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        )}

      </div>

      {/* Modal crear proveedor — abre con nombre pre-cargado desde el Excel */}
      <ProveedorFormModal
        abierto={modalProv}
        editando={null}
        proveedorInicial={datos ? { nombre: datos.proveedor, codigo: '', representante: '', ruc: '', telefono_principal: '', telefono_secundario: '', codigo_lugar: '', direccion: '', fecha_ingreso: '', saldo: 0, activo: true } : null}
        onCerrar={() => setModalProv(false)}
        onGuardado={onProveedorGuardado}
      />
    </div>
  );
}
