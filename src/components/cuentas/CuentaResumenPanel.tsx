import type {
  CuentaFinanciera,
  Institucion,
  Moneda,
  TipoCuenta,
} from '../../api/types';
import type { ResumenCuenta } from '../../lib/cuentas';
import { etiquetaTipoInstitucion } from '../../lib/catalogos';
import { formatearFecha } from '../../lib/format';
import { CostosMoneda } from '../CostosMoneda';
import { StatusBadge } from '../StatusBadge';
import { Boton, Esqueleto } from '../ui';

interface CuentaResumenPanelProps {
  cuenta: CuentaFinanciera;
  institucion: Institucion | undefined;
  tipoCuenta: TipoCuenta | undefined;
  moneda: Moneda | undefined;
  resumen: ResumenCuenta;
  cargandoPosiciones: boolean;
  errorPosiciones: string | null;
  onVerPosiciones: () => void;
  onReintentarPosiciones: () => void;
}

/**
 * Resumen de la cuenta seleccionada.
 *
 * <p>Presenta identificación, fechas, estado y el costo registrado de sus
 * posiciones agrupado por moneda. El efectivo se declara no disponible: el
 * costo de las posiciones no es un saldo y no se usa como sustituto.</p>
 */
export function CuentaResumenPanel({
  cuenta,
  institucion,
  tipoCuenta,
  moneda,
  resumen,
  cargandoPosiciones,
  errorPosiciones,
  onVerPosiciones,
  onReintentarPosiciones,
}: CuentaResumenPanelProps) {
  return (
    <div className="cuenta-panel__resumen">
      <section
        className="cuenta-panel__bloque"
        aria-label="Efectivo de la cuenta"
      >
        <div className="cuenta-panel__bloque-cabecera">
          <h3>Efectivo de la cuenta</h3>
          <StatusBadge estado="pendiente">NO_DISPONIBLE</StatusBadge>
        </div>
        <p className="cuenta-panel__texto">
          La API actual no expone saldos de efectivo por cuenta. No se muestra
          un importe estimado ni se usa el costo de las posiciones como saldo
          disponible.
        </p>
      </section>

      <dl className="detalle__datos">
        <div>
          <dt>Institución</dt>
          <dd>
            {institucion
              ? `${institucion.nombre} · ${etiquetaTipoInstitucion(
                  institucion.tipo,
                )}`
              : 'No disponible'}
          </dd>
        </div>
        <div>
          <dt>Tipo de cuenta</dt>
          <dd>{tipoCuenta?.nombre ?? 'No disponible'}</dd>
        </div>
        <div>
          <dt>Moneda</dt>
          <dd>
            {moneda ? `${moneda.codigo} · ${moneda.nombre}` : 'No disponible'}
          </dd>
        </div>
        <div>
          <dt>Referencia</dt>
          <dd className="dato-enmascarado">
            {cuenta.numeroCuenta ?? 'Sin referencia'}
          </dd>
        </div>
        <div>
          <dt>Fecha de apertura</dt>
          <dd>{formatearFecha(cuenta.fechaApertura)}</dd>
        </div>
        <div>
          <dt>Fecha de cierre</dt>
          <dd>{formatearFecha(cuenta.fechaCierre)}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>{cuenta.activo ? 'Activa' : 'Inactiva'}</dd>
        </div>
        <div>
          <dt>Identificador</dt>
          <dd className="dato-id">{cuenta.id}</dd>
        </div>
      </dl>

      <section
        className="cuenta-panel__bloque"
        aria-label="Resumen de posiciones de la cuenta"
      >
        <div className="cuenta-panel__bloque-cabecera">
          <h3>Posiciones de la cuenta</h3>
          <Boton variante="fantasma" onClick={onVerPosiciones}>
            Ver posiciones
          </Boton>
        </div>

        {cargandoPosiciones ? (
          <div className="section-stack" aria-hidden="true">
            <Esqueleto className="esqueleto--linea" />
            <Esqueleto className="esqueleto--linea" />
          </div>
        ) : errorPosiciones ? (
          <div className="cuenta-panel__aviso">
            <p className="cuenta-panel__texto">
              El resumen de posiciones no está disponible en este momento.
            </p>
            <Boton variante="secundario" onClick={onReintentarPosiciones}>
              Reintentar
            </Boton>
          </div>
        ) : resumen.total === 0 ? (
          <p className="cuenta-panel__texto">
            Esta cuenta no tiene posiciones registradas.
          </p>
        ) : (
          <div className="cuenta-panel__metricas">
            <div className="cuenta-panel__metrica">
              <strong>{resumen.total}</strong>
              <span>Posiciones</span>
            </div>
            <div className="cuenta-panel__metrica">
              <strong>{resumen.activas}</strong>
              <span>Activas</span>
            </div>
            <div className="cuenta-panel__metrica">
              <strong>{resumen.inactivas}</strong>
              <span>Inactivas</span>
            </div>
            <div className="cuenta-panel__metrica cuenta-panel__metrica--ancha">
              <span>Costo por moneda</span>
              <CostosMoneda
                costos={resumen.costoPorMoneda}
                compacto
                vacio="Sin costo"
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
