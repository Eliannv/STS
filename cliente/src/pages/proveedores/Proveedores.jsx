import { useState, useEffect, useCallback } from 'react';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import Swal from 'sweetalert2';
import ProveedorFormModal from '../../components/proveedores/ProveedorFormModal';

export default function Proveedores() {
  const { isAdmin } = useAuth();
  const [lista, setLista] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const url = buscar ? `/proveedor/lista?buscar=${encodeURIComponent(buscar)}` : '/proveedor/lista';
    const res = await api.get(url);
    if (res.ok) setLista(res.data.resultado || []);
    setLoading(false);
  }, [buscar]);

  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  function abrirNuevo() { setProveedorSeleccionado(null); setEditandoId(null); setModal(true); }
  function abrirEditar(p) { setProveedorSeleccionado(p); setEditandoId(p.id); setModal(true); }

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

      <div className="card">
        <div className="card-header">
          <span className="card-title">{lista.length} proveedores</span>
          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por nombre, RUC..." value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Nombre</th>
                  <th>RUC</th>
                  <th>Representante</th>
                  <th>Teléfono</th>
                  <th>Fecha Ingreso</th>
                  <th style={{ textAlign: 'center' }}>Estado</th>
                  {isAdmin && <th style={{ textAlign: 'center' }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {lista.length === 0
                  ? <tr><td colSpan={8} className="empty-state">Sin resultados</td></tr>
                  : lista.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.codigo || '—'}</td>
                      <td><strong>{p.nombre}</strong></td>
                      <td>{p.ruc || '—'}</td>
                      <td>{p.representante || '—'}</td>
                      <td>{p.telefono_principal || '—'}</td>
                      <td>{fmtFecha(p.fecha_ingreso)}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`chip ${p.activo ? 'chip-active' : 'chip-inactive'}`}>
                          {p.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                            <button className="btn-icon" onClick={() => abrirEditar(p)} title="Editar">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button className="btn-icon danger" onClick={() => eliminar(p.id)} title="Eliminar">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
      </div>

      <ProveedorFormModal
        abierto={modal}
        editando={editandoId}
        proveedorInicial={proveedorSeleccionado}
        onCerrar={() => setModal(false)}
        onGuardado={cargar}
      />
    </div>
  );
}

