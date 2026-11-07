import { Link } from 'react-router-dom';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconoAcciones,
  IconoCripto,
  IconoFlecha,
  IconoInmueble,
  IconoInstitucion,
  IconoLiquidez,
  IconoMas,
  IconoOtros,
  IconoPortafolio,
  IconoRentaFija,
  IconoVehiculo,
} from '../components/icons';
import { usePortafolios } from '../portfolio/PortfolioContext';

const CATEGORIAS = [
  {
    ruta: '/activos/renta-fija',
    titulo: 'Renta fija',
    descripcion: 'Instrumentos de deuda, tasas pactadas y cupones.',
    Icono: IconoRentaFija,
  },
  {
    ruta: '/activos/acciones-etfs',
    titulo: 'Acciones y ETFs',
    descripcion: 'Renta variable y fondos cotizados.',
    Icono: IconoAcciones,
  },
  {
    ruta: '/activos/criptomonedas',
    titulo: 'Criptomonedas',
    descripcion: 'Activos digitales y saldos en exchanges.',
    Icono: IconoCripto,
  },
  {
    ruta: '/activos/inmuebles',
    titulo: 'Inmuebles',
    descripcion: 'Propiedades y activos inmobiliarios.',
    Icono: IconoInmueble,
  },
  {
    ruta: '/activos/vehiculos',
    titulo: 'Vehículos',
    descripcion: 'Vehículos y bienes muebles.',
    Icono: IconoVehiculo,
  },
  {
    ruta: '/activos/otros',
    titulo: 'Otros activos',
    descripcion: 'Bienes, colecciones y activos no clasificados.',
    Icono: IconoOtros,
  },
] as const;

export function AssetsPage() {
  const { portafolios } = usePortafolios();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Patrimonio"
        titulo="Mis activos"
        descripcion="Organiza tus activos por categoría. Las cuentas financieras y sus catálogos están disponibles; las demás categorías se habilitarán en las siguientes entregas."
        acciones={
          <Link className="btn btn--primario" to="/activos/liquidez">
            <IconoMas />
            Gestionar cuentas
          </Link>
        }
      />

      <FinancialCard
        titulo="Categorías de activos"
        subtitulo="Cada categoría tendrá su propio detalle cuando exista el contrato de valuación correspondiente."
      >
        <div className="asset-grid">
          <Link className="asset-card" to="/activos/liquidez">
            <div className="asset-card__top">
              <span className="asset-card__icon" aria-hidden="true">
                <IconoLiquidez />
              </span>
              <StatusBadge estado="activo">Disponible</StatusBadge>
            </div>
            <span className="asset-card__title">Liquidez y cuentas</span>
            <span className="asset-card__description">
              Cuentas financieras, saldos y referencias enmascaradas.
            </span>
            <span className="asset-card__meta">
              {portafolios.length === 1
                ? '1 portafolio'
                : `${portafolios.length} portafolios`}
              <IconoFlecha />
            </span>
          </Link>

          {CATEGORIAS.map(({ ruta, titulo, descripcion, Icono }) => (
            <Link
              className="asset-card asset-card--pendiente"
              to={ruta}
              key={ruta}
            >
              <div className="asset-card__top">
                <span className="asset-card__icon" aria-hidden="true">
                  <Icono />
                </span>
                <StatusBadge estado="pendiente">Pendiente</StatusBadge>
              </div>
              <span className="asset-card__title">{titulo}</span>
              <span className="asset-card__description">{descripcion}</span>
              <span className="asset-card__meta">
                Sin datos disponibles
                <IconoFlecha />
              </span>
            </Link>
          ))}
        </div>
      </FinancialCard>

      <FinancialCard
        titulo="Catálogos de apoyo"
        subtitulo="Datos reutilizables por las cuentas y los próximos módulos patrimoniales."
      >
        <div className="asset-grid">
          <Link className="asset-card" to="/activos/liquidez">
            <div className="asset-card__top">
              <span className="asset-card__icon" aria-hidden="true">
                <IconoPortafolio />
              </span>
              <StatusBadge estado="info">Cuentas</StatusBadge>
            </div>
            <span className="asset-card__title">Portafolios y cuentas</span>
            <span className="asset-card__description">
              Crea portafolios y registra cuentas financieras con su institución,
              tipo y moneda.
            </span>
            <span className="asset-card__meta">
              Ir a Liquidez y cuentas
              <IconoFlecha />
            </span>
          </Link>

          <Link className="asset-card" to="/configuracion/instituciones">
            <div className="asset-card__top">
              <span className="asset-card__icon" aria-hidden="true">
                <IconoInstitucion />
              </span>
              <StatusBadge estado="lavanda">Catálogo</StatusBadge>
            </div>
            <span className="asset-card__title">Instituciones financieras</span>
            <span className="asset-card__description">
              Bancos, SOFIPOs, casas de bolsa, exchanges y otras instituciones.
            </span>
            <span className="asset-card__meta">
              Gestionar instituciones
              <IconoFlecha />
            </span>
          </Link>
        </div>
      </FinancialCard>
    </div>
  );
}
