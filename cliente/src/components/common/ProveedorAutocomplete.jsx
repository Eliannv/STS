// cliente/src/components/common/ProveedorAutocomplete.jsx
import { Check, Search, Truck, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/api';

export default function ProveedorAutocomplete({
  proveedor,
  onSelect,
  onClear,
  disabled = false,
  placeholder = 'Buscar proveedor por nombre o RUC...',
}) {
  const [texto, setTexto] = useState(proveedor?.nombre || '');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    function cerrar(event) {
      if (!contenedorRef.current?.contains(event.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  useEffect(() => {
    const consulta = texto.trim();
    if (disabled || !consulta || consulta === proveedor?.nombre) return undefined;

    let activo = true;
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      const respuesta = await api.get(`/proveedores?buscar=${encodeURIComponent(consulta)}&limit=12&offset=0`);
      if (activo) {
        const lista = respuesta.data?.resultado;
        setResultados(respuesta.ok && Array.isArray(lista) ? lista : []);
        setAbierto(true);
        setBuscando(false);
      }
    }, 300);

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [disabled, proveedor, texto]);

  function cambiarTexto(event) {
    const valor = event.target.value;
    setTexto(valor);
    if (proveedor && valor !== proveedor.nombre) onClear?.();
  }

  function seleccionar(item) {
    setTexto(item.nombre || item.ruc || '');
    setResultados([]);
    setAbierto(false);
    onSelect?.(item);
  }

  function limpiar() {
    setTexto('');
    setResultados([]);
    setAbierto(false);
    onClear?.();
  }

  return (
    <div className="entity-autocomplete" ref={contenedorRef}>
      <div className={`entity-autocomplete__input ${proveedor ? 'is-selected' : ''}`}>
        <Search size={16} />
        <input
          value={texto}
          onChange={cambiarTexto}
          onFocus={() => resultados.length > 0 && setAbierto(true)}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          aria-label="Buscar proveedor"
        />
        {buscando && <span className="spinner entity-autocomplete__spinner" />}
        {!buscando && proveedor && <Check size={16} className="entity-autocomplete__check" />}
        {!disabled && texto && (
          <button type="button" onClick={limpiar} aria-label="Limpiar proveedor">
            <X size={15} />
          </button>
        )}
      </div>

      {abierto && (
        <div className="entity-autocomplete__results">
          {resultados.length > 0 ? resultados.map((item) => (
            <button key={item.id} type="button" onMouseDown={() => seleccionar(item)}>
              <span className="entity-autocomplete__icon"><Truck size={17} /></span>
              <span className="entity-autocomplete__content">
                <strong>{item.nombre || 'Proveedor sin nombre'}</strong>
                <small>
                  {item.ruc && <span>RUC {item.ruc}</span>}
                  {item.codigo && <span>Cód. {item.codigo}</span>}
                </small>
              </span>
            </button>
          )) : !buscando && texto.trim() ? (
            <div className="entity-autocomplete__empty">No se encontraron proveedores.</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
