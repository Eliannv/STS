// cliente/src/components/common/ProveedorAutocomplete.jsx
import { Truck } from 'lucide-react';
import EntityAutocomplete from './EntityAutocomplete';

export default function ProveedorAutocomplete({
  proveedor,
  onSelect,
  onClear,
  disabled = false,
  placeholder = 'Buscar proveedor por nombre o RUC...',
}) {
  return (
    <EntityAutocomplete
      seleccion={proveedor}
      onSelect={onSelect}
      onClear={onClear}
      disabled={disabled}
      placeholder={placeholder}
      ariaLabel="Buscar proveedor"
      emptyText="No se encontraron proveedores."
      endpoint={(q) => `/proveedores?buscar=${encodeURIComponent(q)}&limit=12&offset=0`}
      getLabel={(item) => item?.nombre || ''}
      renderIcon={() => <Truck size={17} />}
      renderMeta={(item) => (
        <>
          {item?.ruc && <span>RUC {item.ruc}</span>}
          {item?.codigo && <span>Cód. {item.codigo}</span>}
        </>
      )}
    />
  );
}
