import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { LayoutDashboard, Stethoscope, ShoppingBag, Handshake, Activity, FileText, ShieldCheck, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import useFichaCliente from '../../hooks/useFichaCliente';
import HistorialFormModal from '../../components/historial/HistorialFormModal';
import ClienteFormModal from '../../components/clientes/ClienteFormModal';
import EncabezadoCliente from './ficha/EncabezadoCliente';
import TarjetasResumen from './ficha/TarjetasResumen';
import BarraAccionesRapidas from './ficha/BarraAccionesRapidas';
import TabResumen from './ficha/TabResumen';
import TabHistorialClinico from './ficha/TabHistorialClinico';
import TabCompras from './ficha/TabCompras';
import TabCuentasPorCobrar from './ficha/TabCuentasPorCobrar';
import TabActividad from './ficha/TabActividad';
import TabProximamente from './ficha/TabProximamente';

const PESTANAS = [
  { clave: 'resumen',    etiqueta: 'Resumen',           icono: LayoutDashboard },
  { clave: 'historial',  etiqueta: 'Historial Clínico', icono: Stethoscope },
  { clave: 'compras',    etiqueta: 'Compras',           icono: ShoppingBag },
  { clave: 'cuentas',    etiqueta: 'Cuentas por Cobrar', icono: Handshake },
  { clave: 'actividad',  etiqueta: 'Actividad',         icono: Activity },
  { clave: 'documentos', etiqueta: 'Documentos',        icono: FileText },
  { clave: 'garantias',  etiqueta: 'Garantías',         icono: ShieldCheck },
];

/**
 * Centro de Atención del Cliente.
 *
 * Toda la pantalla se alimenta de una única petición al agregador
 * (GET /clientes/:id/ficha). Los modales de creación y edición son mutaciones:
 * al guardar se recarga esa misma petición, nunca endpoints sueltos.
 */
export default function FichaCliente() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { ficha, cargando, error, recargar } = useFichaCliente(id);

  const [pestana, setPestana] = useState('resumen');
  const [modalHistorial, setModalHistorial] = useState(null);
  const [modalCliente, setModalCliente] = useState(false);

  if (cargando) {
    return <div className="page"><div className="spinner-wrapper"><div className="spinner" /></div></div>;
  }

  if (error || !ficha) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || 'No se encontró el cliente'}</div>
        <button className="btn btn-ghost" style={{ marginTop: 12 }} onClick={() => navigate('/clientes')}>
          <ArrowLeft size={15} /> Volver a clientes
        </button>
      </div>
    );
  }

  const { cliente, alcance, resumen, estadisticas, accionesDisponibles } = ficha;

  const cerrarYRecargar = () => { setModalHistorial(null); setModalCliente(false); recargar(); };

  return (
    <div className="page">
      

      <BarraAccionesRapidas
        cliente={cliente}
        acciones={accionesDisponibles}
        navigate={navigate}
        onNuevoHistorial={() => setModalHistorial({ editando: false, historial: null })}
        onEditarCliente={() => setModalCliente(true)}
        onImprimir={() => window.print()}
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
        <EncabezadoCliente cliente={cliente} alcance={alcance} esAdmin={isAdmin} estados={ficha.estados} />
        <TarjetasResumen resumen={resumen} estadisticas={estadisticas} alcance={alcance} esAdmin={isAdmin} />
      </div>

      <div style={{ display: 'flex', gap: 4, borderBottom: '1px solid var(--border-color, #e9ecef)', marginBottom: 18, overflowX: 'auto' }}>
        {PESTANAS.map(({ clave, etiqueta, icono: Icono }) => (
          <button key={clave} onClick={() => setPestana(clave)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 13, fontWeight: pestana === clave ? 700 : 500, whiteSpace: 'nowrap',
            color: pestana === clave ? 'var(--primary-color)' : 'var(--text-secondary)',
            borderBottom: pestana === clave ? '2px solid var(--primary-color)' : '2px solid transparent',
          }}>
            <Icono size={15} /> {etiqueta}
          </button>
        ))}
      </div>

      {pestana === 'resumen' && <TabResumen ficha={ficha} navigate={navigate} />}

      {pestana === 'historial' && (
        <TabHistorialClinico
          historiales={ficha.historialClinico}
          estadisticas={estadisticas}
          esAdmin={isAdmin}
          onVer={(historial) => setModalHistorial({ editando: false, historial, soloLectura: true })}
          onEditar={(historial) => setModalHistorial({ editando: true, historial })}
          onNuevo={() => setModalHistorial({ editando: false, historial: null })}
        />
      )}

      {pestana === 'compras' && (
        <TabCompras compras={ficha.compras} alcance={alcance} navigate={navigate} />
      )}

      {pestana === 'cuentas' && (
        <TabCuentasPorCobrar
          cuentas={ficha.cuentasPorCobrar}
          actividad={ficha.actividad}
          alcance={alcance}
          clienteId={cliente.id}
          navigate={navigate}
        />
      )}

      {pestana === 'actividad' && <TabActividad actividad={ficha.actividad} alcance={alcance} />}

      {pestana === 'documentos' && (
        <TabProximamente
          titulo="Documentos del cliente"
          descripcion="Aquí se archivarán recetas, contratos de garantía y comprobantes escaneados asociados al cliente."
          estado={accionesDisponibles.documentos}
        />
      )}

      {pestana === 'garantias' && (
        <TabProximamente
          titulo="Garantías"
          descripcion="Registro y seguimiento de las garantías de armazones y lunas adquiridas por el cliente."
          estado={accionesDisponibles.garantias}
        />
      )}

      {modalHistorial && (
        <HistorialFormModal
          abierto
          editando={modalHistorial.editando}
          historialInicial={modalHistorial.historial}
          cliente={cliente}
          soloLectura={modalHistorial.soloLectura ?? false}
          onCerrar={() => setModalHistorial(null)}
          onGuardado={cerrarYRecargar}
        />
      )}

      {modalCliente && (
        <ClienteFormModal
          abierto
          editando
          clienteInicial={cliente}
          onCerrar={() => setModalCliente(false)}
          onGuardado={cerrarYRecargar}
        />
      )}
    </div>
  );
}
