// cliente/src/components/common/ProductoAutocomplete.jsx
import { Package } from 'lucide-react';
import EntityAutocomplete from './EntityAutocomplete';

export default function ProductoAutocomplete({
  producto,
  onSelect,
  onClear,
  disabled = false,
  mostrarStock = true,
  placeholder = 'Buscar producto por nombre, código o modelo...',
}) {
  return (
    <EntityAutocomplete
      seleccion={producto}
      onSelect={onSelect}
      onClear={onClear}
      disabled={disabled}
      placeholder={placeholder}
      ariaLabel="Buscar producto"
      emptyText="No se encontraron productos."
      endpoint={(q) => `/productos?buscar=${encodeURIComponent(q)}&limit=12`}
      getLabel={(item) => item?.nombre || ''}
      renderIcon={() => <Package size={17} />}
      renderMeta={(item) => (
        <>
          {item?.codigo && <span>Cód. {item.codigo}</span>}
          {mostrarStock && (
            <span style={{ color: Number(item?.stock) > 0 ? 'var(--success-color)' : '#b91c1c' }}>
              stock: {item?.stock ?? 0}
            </span>
          )}
        </>
      )}
    />
  );
}
