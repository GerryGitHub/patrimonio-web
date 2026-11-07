import { Link, useParams } from 'react-router-dom';
import { EmptyState } from '../components/EmptyState';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconoAcciones,
  IconoCripto,
  IconoInmueble,
  IconoOtros,
  IconoRentaFija,
  IconoVehiculo,
  IconoVolver,
} from '../components/icons';

const CATEGORIAS = {
  'renta-fija': {
    titulo: 'Renta fija',
    descripcion:
      'Instrumentos de deuda, tasas pactadas, cupones y vencimientos.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de posiciones y valuaciones de renta fija.',
    Icono: IconoRentaFija,
  },
  'acciones-etfs': {
    titulo: 'Acciones y ETFs',
    descripcion: 'Posiciones de renta variable y fondos cotizados.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de posiciones, precios de mercado y valuaciones.',
    Icono: IconoAcciones,
  },
  criptomonedas: {
    titulo: 'Criptomonedas',
    descripcion: 'Activos digitales y saldos mantenidos en exchanges.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de posiciones y precios de activos digitales.',
    Icono: IconoCripto,
  },
  inmuebles: {
    titulo: 'Inmuebles',
    descripcion: 'Propiedades y activos inmobiliarios.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de registro y valuación de inmuebles.',
    Icono: IconoInmueble,
  },
  vehiculos: {
    titulo: 'Vehículos',
    descripcion: 'Vehículos y otros bienes muebles.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de registro y valuación de vehículos.',
    Icono: IconoVehiculo,
  },
  otros: {
    titulo: 'Otros activos',
    descripcion: 'Bienes, colecciones y activos no clasificados.',
    detalle:
      'La categoría se habilitará cuando exista el contrato de registro y valuación de otros activos.',
    Icono: IconoOtros,
  },
} as const;

type ClaveCategoria = keyof typeof CATEGORIAS;

function esClaveCategoria(valor: string): valor is ClaveCategoria {
  return valor in CATEGORIAS;
}

export function AssetCategoryPage() {
  const { categoria = '' } = useParams();
  const config = esClaveCategoria(categoria) ? CATEGORIAS[categoria] : null;
  const Icono = config?.Icono ?? IconoOtros;

  return (
    <div className="page">
      <Link className="volver" to="/activos">
        <IconoVolver />
        Volver a Mis activos
      </Link>

      <PageHeader
        eyebrow="Mis activos"
        titulo={config?.titulo ?? 'Categoría de activos'}
        descripcion={
          config?.descripcion ??
          'Esta categoría todavía no está disponible en el contrato actual.'
        }
        meta={<StatusBadge estado="pendiente">Módulo pendiente</StatusBadge>}
      />

      <FinancialCard
        titulo="Preparada para la siguiente entrega"
        subtitulo="No se muestran posiciones, importes ni porcentajes simulados."
      >
        <EmptyState
          icono={<Icono />}
          titulo="Categoría no habilitada"
          descripcion={
            config?.detalle ??
            'La categoría se habilitará cuando exista el contrato correspondiente en el backend.'
          }
          accion={
            <Link className="btn btn--secundario" to="/activos">
              Volver a Mis activos
            </Link>
          }
        />
      </FinancialCard>
    </div>
  );
}
