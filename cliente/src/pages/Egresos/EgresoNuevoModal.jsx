// cliente/src/pages/Egresos/EgresoNuevoModal.jsx
import Swal from 'sweetalert2';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  crearEgreso,
  extraerDatosEgreso,
  listarIngresosFinalizadosProveedor,
} from '../../api/egresosApi';
import FormModal from '../../components/common/FormModal';
import ProveedorAutocomplete from '../../components/common/ProveedorAutocomplete';
import { TIPOS_EGRESO } from '../../components/common/tipoEgreso';
import { useAuth } from '../../context/AuthContext';
import { extraerMensajeError, notificarError } from '../../utils/confirmaciones';
import { FECHA, HOY } from '../../utils/formato';

const FORMULARIO_INICIAL = {
  tipoEgreso: '',
  descripcion: '',
  motivo: '',
  observacion: '',
  fecha: HOY,
  ingresoOrigenId: '',
};

export default function EgresoNuevoModal({
  abierto,
  onCerrar,
  onCreado,
}) {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [formulario, setFormulario] = useState(FORMULARIO_INICIAL);
  const [proveedor, setProveedor] = useState(null);
  const [ingresos, setIngresos] = useState([]);
  const [loadingIngresos, setLoadingIngresos] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const esDevolucion = formulario.tipoEgreso === 'DEVOLUCION_PROVEEDOR';
  const sucursalNombre = usuario?.sucursal_nombre
    || usuario?.sucursalNombre
    || usuario?.sucursal?.nombre
    || (usuario?.sucursal_id || usuario?.sucursalId
      ? `Sucursal #${usuario.sucursal_id || usuario.sucursalId}`
      : 'Sucursal del usuario');

  function limpiarFormulario() {
    setFormulario(FORMULARIO_INICIAL);
    setProveedor(null);
    setIngresos([]);
    setError('');
  }

  function cerrar() {
    limpiarFormulario();
    onCerrar();
  }

  useEffect(() => {
    if (!abierto || !esDevolucion || !proveedor?.id) {
      return;
    }
    let activo = true;
    listarIngresosFinalizadosProveedor(proveedor.id).then((resultado) => {
      if (!activo) return;
      setIngresos(resultado.rows);
      setLoadingIngresos(false);
    });
    return () => { activo = false; };
  }, [abierto, esDevolucion, proveedor]);

  function cambiar(campo) {
    return (event) => {
      setFormulario((actual) => ({ ...actual, [campo]: event.target.value }));
      setError('');
    };
  }

  async function guardar(event) {
    event.preventDefault();
    if (!formulario.tipoEgreso) {
      setError('Seleccione el tipo de egreso.');
      return;
    }
    if (!formulario.descripcion.trim()) {
      setError('La descripción es obligatoria.');
      return;
    }
    if (formulario.tipoEgreso === 'OTRO' && !formulario.motivo.trim()) {
      setError('El motivo es obligatorio para el tipo Otro.');
      return;
    }
    if (esDevolucion && (!proveedor?.id || !formulario.ingresoOrigenId)) {
      setError('Seleccione el proveedor y el ingreso de origen.');
      return;
    }

    const ingresoOrigen = ingresos.find(
      (ingreso) => Number(ingreso.id) === Number(formulario.ingresoOrigenId),
    );
    setSaving(true);
    const respuesta = await crearEgreso({
      tipo_egreso: formulario.tipoEgreso,
      descripcion: formulario.descripcion.trim(),
      motivo: formulario.motivo.trim() || null,
      observacion: formulario.observacion.trim() || null,
      fecha: formulario.fecha,
      proveedor_id: esDevolucion ? proveedor.id : null,
      proveedor_nombre: esDevolucion ? proveedor.nombre : null,
      ingreso_origen_id: esDevolucion ? Number(formulario.ingresoOrigenId) : null,
      documento_referencia: ingresoOrigen?.id_personalizado
        || ingresoOrigen?.numero_factura
        || null,
      sucursal_id: usuario?.sucursal_id ?? usuario?.sucursalId ?? null,
      sucursal_nombre: sucursalNombre,
    });
    setSaving(false);

    if (!respuesta.ok) {
      const mensaje = extraerMensajeError(respuesta, 'No se pudo crear el egreso.');
      setError(mensaje);
      await notificarError(mensaje);
      return;
    }

    const egreso = extraerDatosEgreso(respuesta);
    limpiarFormulario();
    onCreado?.(egreso);
    const resultado = await Swal.fire({
      icon: 'success',
      title: 'Borrador creado',
      text: 'El egreso fue creado correctamente. ¿Desea agregar productos ahora?',
      showDenyButton: true,
      confirmButtonColor: '#2980b9',
      denyButtonColor: '#6c757d',
      confirmButtonText: 'Agregar productos ahora',
      denyButtonText: 'Más tarde',
    });
    if (resultado.isConfirmed && egreso?.id) navigate(`/egresos/${egreso.id}`);
  }

  return (
    <FormModal
      abierto={abierto}
      titulo="Nuevo Egreso de Mercadería"
      subtitulo="El documento se guardará inicialmente como borrador."
      onCerrar={cerrar}
      onSubmit={guardar}
      saving={saving}
      saveLabel="Crear Borrador"
      error={error}
      maxWidth={780}
      scrollable
    >
      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Tipo de Egreso *</label>
          <select
            className="form-control"
            value={formulario.tipoEgreso}
            onChange={(event) => {
              const tipoEgreso = event.target.value;
              setFormulario((actual) => ({
                ...actual,
                tipoEgreso,
                ingresoOrigenId: tipoEgreso === 'DEVOLUCION_PROVEEDOR'
                  ? actual.ingresoOrigenId
                  : '',
              }));
              if (tipoEgreso !== 'DEVOLUCION_PROVEEDOR') setProveedor(null);
              setError('');
            }}
            required
          >
            <option value="">Seleccione...</option>
            {TIPOS_EGRESO.map((tipo) => <option key={tipo.value} value={tipo.value}>{tipo.label}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Fecha del documento *</label>
          <input
            className="form-control"
            type="date"
            value={formulario.fecha}
            onChange={cambiar('fecha')}
            required
          />
        </div>

        {esDevolucion && (
          <>
            <div className="form-group full">
              <label className="form-label">Proveedor *</label>
              <ProveedorAutocomplete
                key={proveedor?.id || 'sin-proveedor'}
                proveedor={proveedor}
                onSelect={(seleccion) => {
                  setProveedor(seleccion);
                  setLoadingIngresos(true);
                  setIngresos([]);
                  setFormulario((actual) => ({ ...actual, ingresoOrigenId: '' }));
                }}
                onClear={() => {
                  setProveedor(null);
                  setIngresos([]);
                  setFormulario((actual) => ({ ...actual, ingresoOrigenId: '' }));
                }}
              />
            </div>
            <div className="form-group full">
              <label className="form-label">Ingreso origen *</label>
              <select
                className="form-control"
                value={formulario.ingresoOrigenId}
                onChange={cambiar('ingresoOrigenId')}
                disabled={!proveedor || loadingIngresos}
                required
              >
                <option value="">
                  {loadingIngresos
                    ? 'Cargando ingresos...'
                    : proveedor
                      ? 'Seleccione un ingreso finalizado'
                      : 'Seleccione primero un proveedor'}
                </option>
                {ingresos.map((ingreso) => (
                  <option key={ingreso.id} value={ingreso.id}>
                    {ingreso.id_personalizado || `#${ingreso.id}`}
                    {' · '}
                    {ingreso.numero_factura || 'Sin factura'}
                    {' · '}
                    {FECHA(ingreso.fecha)}
                  </option>
                ))}
              </select>
              {proveedor && !loadingIngresos && ingresos.length === 0 && (
                <small style={{ color: '#e67e22' }}>
                  Este proveedor no tiene ingresos finalizados disponibles.
                </small>
              )}
            </div>
          </>
        )}

        <div className="form-group full">
          <label className="form-label">Sucursal</label>
          <input className="form-control" value={sucursalNombre} disabled />
          <small>La sucursal corresponde al usuario autenticado.</small>
        </div>
        <div className="form-group full">
          <label className="form-label">Descripción *</label>
          <textarea
            className="form-control"
            rows={3}
            value={formulario.descripcion}
            onChange={cambiar('descripcion')}
            placeholder="Describa el propósito del egreso..."
            required
          />
        </div>
        <div className="form-group full">
          <label className="form-label">
            Motivo {formulario.tipoEgreso === 'OTRO' ? '*' : ''}
          </label>
          <input
            className="form-control"
            value={formulario.motivo}
            onChange={cambiar('motivo')}
            placeholder="Motivo o justificación"
          />
        </div>
        <div className="form-group full">
          <label className="form-label">Observación</label>
          <textarea
            className="form-control"
            rows={3}
            value={formulario.observacion}
            onChange={cambiar('observacion')}
            placeholder="Información adicional opcional"
          />
        </div>
      </div>
    </FormModal>
  );
}
