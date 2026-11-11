import type { LiquidezPatrimonio as LiquidezDatos } from '../../api/types';
import { formatearImporte } from '../../lib/decimales';
import { EmptyState } from '../EmptyState';
import { StatusBadge } from '../StatusBadge';
import { IconoLiquidez } from '../icons';
import { EstadoIndicador, ValorIndicador } from './EstadoIndicador';

interface LiquidezPatrimonioProps {
  liquidez: LiquidezDatos;
}

/**
 * Liquidez y capital comprometido.
 *
 * <p>Las cuentas se listan con su moneda, pero sus saldos permanecen sin
 * información porque el esquema aún no registra efectivo. No se presenta el
 * costo de las inversiones como si fuera efectivo disponible.</p>
 */
export function LiquidezPatrimonio({ liquidez }: LiquidezPatrimonioProps) {
  const cuentas = liquidez.efectivoPorCuenta.cuentas;

  return (
    <div className="liquidez-patrimonio">
      <div className="liquidez-patrimonio__indicadores">
        <div className="rendimiento-item">
          <div className="rendimiento-item__cabecera">
            <span className="rendimiento-item__etiqueta">
              {liquidez.disponibilidadInmediata.etiqueta}
            </span>
            <EstadoIndicador estado={liquidez.disponibilidadInmediata.estado} />
          </div>
          <p className="rendimiento-item__valor">
            <ValorIndicador
              indicador={liquidez.disponibilidadInmediata}
              vacio="No disponible"
            />
          </p>
          {liquidez.disponibilidadInmediata.motivo ? (
            <p className="rendimiento-item__motivo">
              {liquidez.disponibilidadInmediata.motivo}
            </p>
          ) : null}
        </div>

        <div className="rendimiento-item">
          <div className="rendimiento-item__cabecera">
            <span className="rendimiento-item__etiqueta">
              {liquidez.capitalComprometido.etiqueta}
            </span>
            <EstadoIndicador estado={liquidez.capitalComprometido.estado} />
          </div>
          <p className="rendimiento-item__valor">
            <ValorIndicador
              indicador={liquidez.capitalComprometido}
              vacio="Sin capital comprometido"
            />
          </p>
          {liquidez.capitalComprometido.motivo ? (
            <p className="rendimiento-item__motivo">
              {liquidez.capitalComprometido.motivo}
            </p>
          ) : null}
        </div>
      </div>

      <div className="liquidez-patrimonio__efectivo">
        <div className="liquidez-patrimonio__cabecera">
          <span className="section-subtitle">
            {liquidez.efectivoPorCuenta.estado === 'NO_DISPONIBLE'
              ? 'Efectivo por cuenta'
              : 'Saldos por cuenta'}
          </span>
          <EstadoIndicador estado={liquidez.efectivoPorCuenta.estado} />
        </div>
        {liquidez.efectivoPorCuenta.motivo ? (
          <p className="card-note">{liquidez.efectivoPorCuenta.motivo}</p>
        ) : null}

        {cuentas.length === 0 ? (
          <EmptyState
            compacta
            icono={<IconoLiquidez />}
            titulo="Sin cuentas registradas"
            descripcion="Las cuentas aparecerán aquí cuando estén asociadas al portafolio."
          />
        ) : (
          <ul className="liquidez-cuentas">
            {cuentas.map((cuenta) => (
              <li className="liquidez-cuenta" key={cuenta.cuentaId}>
                <span className="liquidez-cuenta__icono" aria-hidden="true">
                  <IconoLiquidez />
                </span>
                <span className="liquidez-cuenta__datos">
                  <strong>{cuenta.nombre}</strong>
                  <small>
                    {cuenta.institucionNombre} · {cuenta.moneda.codigo}
                  </small>
                </span>
                <span className="liquidez-cuenta__saldo">
                  {cuenta.saldo ? (
                    <strong>
                      {formatearImporte(
                        cuenta.saldo,
                        cuenta.moneda.decimales,
                      )}
                    </strong>
                  ) : (
                    <StatusBadge estado="neutral">
                      Sin saldo registrado
                    </StatusBadge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {liquidez.efectivoPorInstitucion.estado === 'NO_DISPONIBLE' ? (
        <p className="card-note">
          <strong>Efectivo por institución:</strong>{' '}
          {liquidez.efectivoPorInstitucion.motivo ??
            'No hay saldos de efectivo para agrupar.'}
        </p>
      ) : null}
    </div>
  );
}
