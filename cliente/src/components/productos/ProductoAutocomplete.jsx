import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Check, PackageSearch, Search, X } from 'lucide-react';
import { api } from '../../api/api';

const ProductoAutocomplete = forwardRef(function ProductoAutocomplete({ producto, onSelect, onClear }, ref) {
  const [texto, setTexto] = useState(producto?.nombre || '');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);
  const inputRef = useRef(null);

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  useEffect(() => {
    function cerrar(event) {
      if (!contenedorRef.current?.contains(event.target)) setAbierto(false);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  useEffect(() => {
    const consulta = texto.trim();
    if (!consulta || consulta === producto?.nombre) return undefined;

    let activo = true;
    const temporizador = setTimeout(async () => {
      setBuscando(true);
      const respuesta = await api.get(`/producto/lista?buscar=${encodeURIComponent(consulta)}&limit=12`);
      if (activo) {
        setResultados(respuesta.ok ? (respuesta.data?.resultado || []) : []);
        setAbierto(true);
        setBuscando(false);
      }
    }, 300);

    return () => {
      activo = false;
      clearTimeout(temporizador);
    };
  }, [texto, producto]);

  function cambiarTexto(event) {
    const valor = event.target.value;
    setTexto(valor);
    if (producto && valor !== producto.nombre) onClear?.();
  }

  function seleccionar(seleccion) {
    setTexto(seleccion.nombre || seleccion.codigo || '');
    setResultados([]);
    setAbierto(false);
    onSelect(seleccion);
  }

  function limpiar() {
    setTexto('');
    setResultados([]);
    setAbierto(false);
    onClear?.();
    requestAnimationFrame(() => inputRef.current?.focus());
  }

  return (
    <div className="product-autocomplete" ref={contenedorRef}>
      <div className={`product-autocomplete__input ${producto ? 'is-selected' : ''}`}>
        <Search size={16} />
        <input
          ref={inputRef}
          value={texto}
          onChange={cambiarTexto}
          onFocus={() => resultados.length && setAbierto(true)}
          placeholder="Buscar por código, nombre, modelo, color o grupo..."
          autoComplete="off"
          aria-label="Buscar producto"
        />
        {buscando && <span className="spinner product-autocomplete__spinner" />}
        {!buscando && producto && <Check size={16} className="product-autocomplete__check" />}
        {texto && (
          <button type="button" onClick={limpiar} aria-label="Limpiar producto">
            <X size={15} />
          </button>
        )}
      </div>

      {abierto && (
        <div className="product-autocomplete__results">
          {resultados.length > 0 ? resultados.map(item => (
            <button key={item.id} type="button" onMouseDown={() => seleccionar(item)}>
              <span className="product-autocomplete__icon"><PackageSearch size={17} /></span>
              <span className="product-autocomplete__content">
                <strong>{item.nombre || item.descripcion || item.codigo}</strong>
                <small>
                  {item.codigo && <span>Cód. {item.codigo}</span>}
                  {item.modelo && <span>Modelo {item.modelo}</span>}
                  {item.color && <span>{item.color}</span>}
                  {item.grupo && <span>{item.grupo}</span>}
                </small>
              </span>
              <span className="product-autocomplete__stock">Stock {item.stock ?? 0}</span>
            </button>
          )) : !buscando && texto.trim() ? (
            <div className="product-autocomplete__empty">No se encontraron productos.</div>
          ) : null}
        </div>
      )}
    </div>
  );
});

export default ProductoAutocomplete;
