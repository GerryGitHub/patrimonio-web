import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Portafolio } from '../api/types';
import { Alerta, Boton, Esqueleto } from '../components/ui';
import { CrearPortafolioForm } from '../components/CrearPortafolioForm';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { FinancialCard } from '../components/FinancialCard';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import {
  IconoFlecha,
  IconoInstitucion,
  IconoMas,
  IconoPortafolio,
  IconoRecargar,
  IconoVacio,
} from '../components/icons';
import { usePortafolios } from '../portfolio/PortfolioContext';

export function LiquidezPage() {
  const {
    portafolios,
    cargando,
    error,
    seleccionadoId,
    seleccionar,
    recargar,
  } = usePortafolios();

  const [mostrandoFormulario, setMostrandoFormulario] = useState(false);
  const [confirmacion, setConfirmacion] = useState<Portafolio | null>(null);

  function alCrear(creado: Portafolio) {
    setConfirmacion(creado);
    setMostrandoFormulario(false);
    seleccionar(creado.id);
    recargar();
  }

  const puedeCrear = !cargando && !error;

  return (
    <div className="page">
      <PageHeader
        eyebrow="Mis activos"
        titulo="Liquidez y cuentas"
        descripcion="Portafolios, cuentas financieras e instituciones. Los números de cuenta se muestran siempre enmascarados."
        acciones={
          <>
            {puedeCrear && !mostrandoFormulario ? (
              <Boton onClick={() => setMostrandoFormulario(true)}>
                <IconoMas />
                Nuevo portafolio
              </Boton>
            ) : null}
            <Link
              className="btn btn--secundario"
              to="/configuracion/instituciones"
            >
              <IconoInstitucion />
              Instituciones
            </Link>
            <Boton
              variante="secundario"
              onClick={recargar}
              aria-label="Actualizar portafolios"
            >
              <IconoRecargar />
              Actualizar
            </Boton>
          </>
        }
        meta={
          cargando ? null : (
            <span className="dato-chip">
              <strong>{portafolios.length}</strong>
              {portafolios.length === 1 ? 'portafolio' : 'portafolios'}
            </span>
          )
        }
      />

      {confirmacion ? (
        <Alerta variante="exito">
          <div className="alerta__accion">
            <span>
              Portafolio «{confirmacion.nombre}» creado correctamente.
            </span>
            <Link
              className="btn btn--secundario btn--sm"
              to={`/activos/liquidez/${encodeURIComponent(confirmacion.id)}`}
            >
              Abrir portafolio
            </Link>
          </div>
        </Alerta>
      ) : null}

      {mostrandoFormulario ? (
        <CrearPortafolioForm
          onCreado={alCrear}
          onCancelar={() => setMostrandoFormulario(false)}
        />
      ) : null}

      <FinancialCard
        titulo="Tus portafolios"
        subtitulo="Selecciona un portafolio para consultar su información general y sus cuentas financieras."
        sinRelleno
      >
        {cargando ? (
          <div className="portafolios" aria-hidden="true" style={{ padding: '1rem' }}>
            {[0, 1, 2].map((indice) => (
              <div className="portafolio portafolio--esqueleto" key={indice}>
                <Esqueleto className="esqueleto--icono" />
                <Esqueleto className="esqueleto--titulo" />
                <Esqueleto className="esqueleto--linea" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: '1rem' }}>
            <ErrorState
              mensaje={error}
              titulo="No se pudieron consultar los portafolios"
              onReintentar={recargar}
            />
          </div>
        ) : portafolios.length === 0 ? (
          <EmptyState
            icono={<IconoVacio />}
            titulo="Todavía no hay portafolios"
            descripcion="Crea tu primer portafolio para empezar a organizar tus cuentas financieras."
            accion={
              <Boton onClick={() => setMostrandoFormulario(true)}>
                <IconoMas />
                Crear portafolio
              </Boton>
            }
          />
        ) : (
          <div className="portafolios" style={{ padding: '1rem' }}>
            {portafolios.map((portafolio) => {
              const esSeleccionado = portafolio.id === seleccionadoId;
              return (
                <Link
                  className={`portafolio ${
                    esSeleccionado ? 'portafolio--seleccionado' : ''
                  }`.trim()}
                  key={portafolio.id}
                  to={`/activos/liquidez/${encodeURIComponent(portafolio.id)}`}
                  onClick={() => seleccionar(portafolio.id)}
                  aria-label={`Abrir el portafolio ${portafolio.nombre}`}
                >
                  <span className="portafolio__icono" aria-hidden="true">
                    <IconoPortafolio />
                  </span>
                  <span className="portafolio__cuerpo">
                    <span className="portafolio__encabezado">
                      <span className="portafolio__nombre">
                        {portafolio.nombre}
                      </span>
                      {esSeleccionado ? (
                        <StatusBadge estado="info">Seleccionado</StatusBadge>
                      ) : null}
                    </span>
                    <span className="portafolio__descripcion">
                      {portafolio.descripcion ?? 'Sin descripción.'}
                    </span>
                    <span className="portafolio__detalle">
                      <span className="moneda-chip">
                        {portafolio.monedaBase.codigo}
                      </span>
                      {portafolio.monedaBase.nombre}
                    </span>
                  </span>
                  <span className="portafolio__flecha" aria-hidden="true">
                    <IconoFlecha />
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </FinancialCard>
    </div>
  );
}
