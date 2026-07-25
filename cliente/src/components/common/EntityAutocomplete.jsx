// cliente/src/components/common/EntityAutocomplete.jsx
import { Search, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '../../api/api';

/**
 * Autocomplete genérico reutilizable.
 *
 * @param {object}  seleccion          Item actualmente seleccionado (o null).
 * @param {(item)=>void}  onSelect    Callback al elegir un item del dropdown.
 * @param {()=>void}      [onClear]    Callback al limpiar la selección.
 * @param {(q:string)=>string} endpoint  Función que recibe el query y retorna el path a llamar via api.get.
 * @param {(item)=>string}  getLabel   Retorna el texto a mostrar en el input cuando el item está seleccionado.
 * @param {(item)=>ReactNode} [renderIcon]  Icono a mostrar a la izquierda de cada resultado.
 * @param {(item)=>ReactNode} [renderMeta]  Subtexto bajo el título en cada resultado (ya envuelto en <small>).
 * @param {string}  [placeholder]      Placeholder del input.
 * @param {string}  [ariaLabel]        Aria-label del input.
 * @param {string}  [emptyText]        Mensaje cuando no hay resultados.
 * @param {boolean} [disabled]
 */
export default function EntityAutocomplete({
  seleccion,
  onSelect,
  onClear,
  endpoint,
  getLabel,
  renderIcon,
  renderMeta,
  placeholder = 'Buscar...',
  ariaLabel = 'Buscar',
  emptyText = 'No se encontraron resultados.',
  disabled = false,
}) {
  const [texto, setTexto] = useState(getLabel?.(seleccion) || '');
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
    if (disabled || !consulta || consulta === getLabel?.(seleccion)) return undefined;

    let activo = true;
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      const respuesta = await api.get(endpoint(consulta));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disabled, seleccion, texto]);

  function cambiarTexto(event) {
    const valor = event.target.value;
    setTexto(valor);
    if (seleccion && valor !== getLabel(seleccion)) onClear?.();
  }

  function elegir(item) {
    setTexto(getLabel(item) || '');
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
      <div className={`entity-autocomplete__input ${seleccion ? 'is-selected' : ''}`}>
        <Search size={16} />
        <input
          value={texto}
          onChange={cambiarTexto}
          onFocus={() => resultados.length > 0 && setAbierto(true)}
          placeholder={placeholder}
          autoComplete="off"
          disabled={disabled}
          aria-label={ariaLabel}
        />
        {buscando && <span className="spinner entity-autocomplete__spinner" />}
        {!buscando && seleccion && <Check size={16} className="entity-autocomplete__check" />}
        {!disabled && texto && (
          <button type="button" onClick={limpiar} aria-label="Limpiar">
            <X size={15} />
          </button>
        )}
      </div>

      {abierto && (
        <div className="entity-autocomplete__results">
          {resultados.length > 0 ? resultados.map((item) => (
            <button key={item.id} type="button" onMouseDown={() => elegir(item)}>
              {renderIcon && <span className="entity-autocomplete__icon">{renderIcon(item)}</span>}
              <span className="entity-autocomplete__content">
                <strong>{getLabel(item) || 'Sin nombre'}</strong>
                {renderMeta && <small>{renderMeta(item)}</small>}
              </span>
            </button>
          )) : !buscando && texto.trim() ? (
            <div className="entity-autocomplete__empty">{emptyText}</div>
          ) : null}
        </div>
      )}
    </div>
  );
}
