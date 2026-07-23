import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, X } from 'lucide-react';
import { api } from '../../api/api';
import { generarReporte } from '../../api/reportesApi';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import ProveedorFormModal from '../../components/proveedores/ProveedorFormModal';
import TableCard from '../../components/common/TableCard';

export default function Proveedores() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [lista, setLista] = useState([]);
  const [comprasPorProveedor, setComprasPorProveedor] = useState(new Map());
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [historialLoading, setHistorialLoading] = useState(false);
  const [historialProveedor, setHistorialProveedor] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (buscar) params.set('buscar', buscar);
    params.set('limit',  '21');
    params.set('offset', String(page * 20));
    const [res, compras] = await Promise.all([
      api.get(`/proveedor/lista?${params}`),
      generarReporte({
        endpoint: 'compras/proveedor',
        paginacion: { page: 1, pageSize: 5000 },
      }).catch(() => null),
    ]);
    if (res.ok) {
      const data = res.data.resultado || [];
      setHasNext(data.length > 20);
      setLista(data.slice(0, 20));
    }
    setComprasPorProveedor(new Map(
      (compras?.report?.rows || []).map(item => [Number(item.proveedor_id), item]),
    ));
    setLoading(false);
  }, [buscar, page]);

  useEffect(() => {
    const timeout = setTimeout(() => setPage(0), 0);
    return () => clearTimeout(timeout);
  }, [buscar]);
  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  function abrirNuevo() { setProveedorSeleccionado(null); setEditandoId(null); setModal(true); }
  function abrirEditar(p) { setProveedorSeleccionado(p); setEditandoId(p.id); setModal(true); }

  async function abrirHistorial(proveedor) {
    setHistorialProveedor(proveedor);
    setHistorial([]);
    setHistorialLoading(true);
    const response = await generarReporte({
      endpoint: 'ingresos/mercaderia',
      filtros: { proveedorId: proveedor.id },
      paginacion: { page: 1, pageSize: 5000 },
    }).catch(() => null);
    setHistorial(response?.report?.rows || []);
    setHistorialLoading(false);
  }

  async function eliminar(id) {

    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'No podrás revertir esta acción',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    try {

      const res = await api.delete('/proveedor/eliminar', { id });

      if (res.ok || res.status === 200) {

        cargar();

        await Swal.fire({
          title: 'Eliminado',
          text: 'El proveedor fue eliminado correctamente',
          icon: 'success',
          timer: 3000,
          toast: true,
            position: 'top-end',
          showConfirmButton: false
        });
        
      } else {

        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el proveedor',
          icon: 'error',
          timer: 3000,
          toast: true,
            position: 'top-end',
          showConfirmButton: false
        });

      }

    } catch (error) {

      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un problema al eliminar',
        icon: 'error',
        timer: 3000,
          toast: true,
            position: 'top-end',
        showConfirmButton: false
      });

      console.error(error);

    }
  }

  function fmtFecha(f) { return f ? new Date(f).toLocaleDateString('es-EC') : '—'; }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Proveedores</h1>
          <p className="page-subtitle">Gestión de proveedores</p>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo proveedor</button>}
      </div>

      <TableCard scrollY
        loading={loading}
        empty={lista.length === 0}
        emptyText="Sin resultados"
        page={page}
        hasNext={hasNext}
        onPrevPage={() => setPage(p => p - 1)}
        onNextPage={() => setPage(p => p + 1)}
        header={
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por nombre, RUC..." value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
        }
      >
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nombre</th>
              <th>RUC</th>
              <th>Representante</th>
              <th>Teléfono</th>
              <th>Fecha Ingreso</th>
              <th>Compras realizadas</th>
              <th>Total comprado</th>
              <th style={{ textAlign: 'center' }}>Estado</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id}>
                <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.codigo || '—'}</td>
                <td><strong>{p.nombre}</strong></td>
                <td>{p.ruc || '—'}</td>
                <td>{p.representante || '—'}</td>
                <td>{p.telefono_principal || '—'}</td>
                <td>{fmtFecha(p.fecha_ingreso)}</td>
                <td>{Number(comprasPorProveedor.get(Number(p.id))?.compras || 0).toLocaleString('es-EC')}</td>
                <td>{Number(comprasPorProveedor.get(Number(p.id))?.total_comprado || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</td>
                <td style={{ textAlign: 'center' }}>
                  <span className={`chip ${p.activo ? 'chip-active' : 'chip-inactive'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button className="btn-icon" onClick={() => abrirHistorial(p)} title="Ver historial de ingresos">
                      <History size={15} />
                    </button>
                    {isAdmin && (
                      <>
                      <button className="btn-icon" onClick={() => abrirEditar(p)} title="Editar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button className="btn-icon danger" onClick={() => eliminar(p.id)} title="Eliminar">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                      </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableCard>

      <ProveedorFormModal
        abierto={modal}
        editando={editandoId}
        proveedorInicial={proveedorSeleccionado}
        onCerrar={() => setModal(false)}
        onGuardado={cargar}
      />

      {historialProveedor && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(15, 23, 42, 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 'min(100%, 980px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid #e9ecef' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18 }}>Historial de ingresos</h2>
                <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>{historialProveedor.nombre}</p>
              </div>
              <button className="btn-icon" onClick={() => setHistorialProveedor(null)} title="Cerrar"><X size={18} /></button>
            </div>
            <div style={{ padding: 20, overflow: 'auto' }}>
              <TableCard noCard loading={historialLoading} empty={!historialLoading && historial.length === 0} emptyText="Este proveedor no registra ingresos.">
                <table>
                  <thead><tr><th>Código</th><th>Factura</th><th>Fecha</th><th>Estado</th><th>Total</th><th>Acción</th></tr></thead>
                  <tbody>
                    {historial.map(ingreso => (
                      <tr key={ingreso.id}>
                        <td>{ingreso.id_personalizado || ingreso.id}</td>
                        <td>{ingreso.numero_factura || '—'}</td>
                        <td>{fmtFecha(ingreso.fecha)}</td>
                        <td>{ingreso.estado || '—'}</td>
                        <td>{Number(ingreso.total || 0).toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</td>
                        <td><button className="btn btn-ghost btn-sm" onClick={() => navigate(`/ingresos/${ingreso.id}`)}>Ver ingreso</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableCard>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

