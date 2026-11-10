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

interface CategoriaActivo {
  ruta: string;
  titulo: string;
  descripcion: string;
  Icono: typeof IconoRentaFija;
  disponible: boolean;
}

const CATEGORIAS: CategoriaActivo[] = [
  {
    ruta: '/activos/renta-fija',
    titulo: 'Renta fija',
    descripcion: 'Instrumentos de deuda, tasas pactadas y cupones.',
    Icono: IconoRentaFija,
    disponible: true,
  },
  {
    ruta: '/activos/acciones-etfs',
    titulo: 'Acciones y ETFs',
    descripcion: 'Renta variable y fondos cotizados.',
    Icono: IconoAcciones,
    disponible: true,
  },
  {
    ruta: '/activos/criptomonedas',
    titulo: 'Criptomonedas',
    descripcion: 'Activos digitales y saldos en exchanges.',
    Icono: IconoCripto,
    disponible: true,
  },
  {
    ruta: '/activos/inmuebles',
    titulo: 'Inmuebles',
    descripcion: 'Propiedades y activos inmobiliarios.',
    Icono: IconoInmueble,
    disponible: false,
  },
  {
    ruta: '/activos/vehiculos',
    titulo: 'Vehículos',
    descripcion: 'Vehículos y bienes muebles.',
    Icono: IconoVehiculo,
    disponible: false,
  },
  {
    ruta: '/activos/otros',
    titulo: 'Otros activos',
    descripcion: 'Bienes, colecciones y activos no clasificados.',
    Icono: IconoOtros,
    disponible: false,
  },
];

export function AssetsPage() {
  const { portafolios } = usePortafolios();

  return (
    <div className="page">
      <PageHeader
        eyebrow="Patrimonio"
        titulo="Mis activos"
        descripcion="Organiza tus activos por categoría. Las cuentas financieras, los instrumentos y sus posiciones ya están disponibles; las demás categorías se habilitarán en las siguientes entregas."
        acciones={
          <Link className="btn btn--primario" to="/activos/liquidez">
            <IconoMas />
            Gestionar cuentas
          </Link>
        }
      />

      <FinancialCard
        titulo="Categorías de activos"
        subtitulo="Cada categoría muestra posiciones reales cuando existe el contrato correspondiente en el backend."
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

          {CATEGORIAS.map(({ ruta, titulo, descripcion, Icono, disponible }) => (
            <Link
              className={`asset-card ${
                disponible ? '' : 'asset-card--pendiente'
              }`.trim()}
              to={ruta}
              key={ruta}
            >
              <div className="asset-card__top">
                <span className="asset-card__icon" aria-hidden="true">
                  <Icono />
                </span>
                <StatusBadge estado={disponible ? 'activo' : 'pendiente'}>
                  {disponible ? 'Disponible' : 'Pendiente'}
                </StatusBadge>
              </div>
              <span className="asset-card__title">{titulo}</span>
              <span className="asset-card__description">{descripcion}</span>
              <span className="asset-card__meta">
                {disponible ? 'Ver posiciones' : 'Sin datos disponibles'}
                <IconoFlecha />
              </span>
            </Link>
          ))}
        </div>
      </FinancialCard>

      <FinancialCard
        titulo="Catálogos de apoyo"
        subtitulo="Datos reutilizables por las cuentas, las posiciones y los próximos módulos patrimoniales."
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

          <Link className="asset-card" to="/instrumentos">
            <div className="asset-card__top">
              <span className="asset-card__icon" aria-hidden="true">
                <IconoRentaFija />
              </span>
              <StatusBadge estado="lavanda">Catálogo</StatusBadge>
            </div>
            <span className="asset-card__title">Instrumentos financieros</span>
            <span className="asset-card__description">
              Renta variable, renta fija y activos digitales disponibles para
              registrar posiciones.
            </span>
            <span className="asset-card__meta">
              Gestionar instrumentos
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
