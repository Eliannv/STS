import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import ClienteFormModal from '../../components/clientes/ClienteFormModal';
import HistorialListModal from '../../components/historial/HistorialListModal';
import Swal from 'sweetalert2';

export default function Clientes() {
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [lista, setLista] = useState([]);
  const [hasNext, setHasNext] = useState(false);
  const [page, setPage] = useState(0);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal cliente
  const [modalCliente, setModalCliente] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Modal historial
  const [modalHistorial, setModalHistorial] = useState(false);
  const [clienteHistorial, setClienteHistorial] = useState(null);

  const cargar = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (buscar) params.set('buscar', buscar);
    params.set('limit',  '21');
    params.set('offset', String(page * 20));
    const res = await api.get(`/cliente/lista?${params}`);
    if (res.ok) {
      const data = res.data.resultado || [];
      setHasNext(data.length > 20);
      setLista(data.slice(0, 20));
    }
    setLoading(false);
  }, [buscar, page]);

  useEffect(() => { setPage(0); }, [buscar]);
  useEffect(() => { const t = setTimeout(cargar, 300); return () => clearTimeout(t); }, [cargar]);

  function abrirNuevo() { setClienteSeleccionado(null); setEditandoId(null); setModalCliente(true); }
  function abrirEditar(c) { setClienteSeleccionado(c); setEditandoId(c.id); setModalCliente(true); }
  function abrirHistorial(c) { setClienteHistorial(c); setModalHistorial(true); }

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

      const res = await api.delete('/cliente/eliminar', { id });

      if (res.ok || res.status === 200) {

        cargar();

        await Swal.fire({
          title: 'Eliminado',
          text: 'El cliente fue eliminado correctamente',
          icon: 'success',
          timer: 3000,
          toast: true,
            position: 'top-end',
          showConfirmButton: false
        });

      } else {

        Swal.fire({
          title: 'Error',
          text: 'No se pudo eliminar el cliente',
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

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">Gestión de clientes de la óptica</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>+ Nuevo cliente</button>
      </div>

      <div className="card">
        <div className="card-header">

          <div className="search-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input placeholder="Buscar por nombre, cédula..." value={buscar} onChange={e => setBuscar(e.target.value)} />
          </div>
        </div>
        <div className="table-container">
          {loading ? <div className="spinner-wrapper"><div className="spinner" /></div> : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th><th>Cédula</th><th>Teléfono</th><th>Email</th>
                  <th style={{ textAlign: 'center' }}>Historial</th>
                  <th style={{ textAlign: 'center' }}>Deuda</th>
                  <th style={{ textAlign: 'center' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.length === 0
                  ? <tr><td colSpan={7} className="empty-state">Sin resultados</td></tr>
                  : lista.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.nombres} {c.apellidos}</strong></td>
                      <td>{c.cedula || '—'}</td>
                      <td>{c.telefono || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          onClick={() => abrirHistorial(c)}
                          title="Ver historiales clínicos"
                        >
                          <span className={`chip ${c.tiene_historial_clinico ? 'chip-active' : 'chip-inactive'}`}>
                            {c.tiene_historial_clinico ? 'Sí' : 'No'}
                          </span>
                          Ver historial
                        </button>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {c.tiene_deuda
                          ? <button
                              className="btn btn-sm"
                              style={{ background: '#fff3cd', color: '#856404', border: '1px solid #ffc107', fontSize: 12, padding: '3px 10px', borderRadius: 20, fontWeight: 700, cursor: 'pointer' }}
                              title="Ver deuda del cliente"
                              onClick={() => navigate(`/facturas/cobrar?clienteId=${c.id}`)}
                            >
                              Cobrar deuda
                            </button>
                          : <span style={{ fontSize: 12, color: '#adb5bd' }}>—</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                          <button
                            className="btn-icon"
                            title="Ficha clínica"
                            onClick={() => navigate(`/clientes/${c.id}/ficha`)}
                            style={{ color: '#2980b9' }}
                          >
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                              <polyline points="14 2 14 8 20 8"/>
                              <path d="M10 13h4"/><path d="M10 17h4"/>
                            </svg>
                          </button>
                          <button className="btn-icon" onClick={() => abrirEditar(c)} title="Editar">
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          {isAdmin && (
                            <button className="btn-icon danger" onClick={() => eliminar(c.id)} title="Eliminar">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                }
              </tbody>
            </table>
          )}
        </div>
        {/* Paginación */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '10px 20px', borderTop: '1px solid #e9ecef' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>← Anterior</button>
            <button className="btn btn-ghost btn-sm" onClick={() => setPage(p => p + 1)} disabled={!hasNext}>Siguiente →</button>
          </div>
        </div>
      </div>

      <ClienteFormModal
        abierto={modalCliente}
        editando={editandoId}
        clienteInicial={clienteSeleccionado}
        onCerrar={() => setModalCliente(false)}
        onGuardado={cargar}
      />

      <HistorialListModal
        abierto={modalHistorial}
        cliente={clienteHistorial}
        onCerrar={() => setModalHistorial(false)}
      />
    </div>
  );
}
