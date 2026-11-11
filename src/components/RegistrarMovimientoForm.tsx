import { useMemo, useState, type FormEvent } from 'react';
import type { RegistrarMovimientoDatos, TipoMovimiento } from '../api/types';
import {
  compararDecimales,
  formatearCantidad,
  formatearImporte,
  multiplicarDecimales,
  restarDecimales,
  sumarDecimales,
} from '../lib/decimales';
import { fechaHoyIso } from '../lib/format';
import {
  TIPOS_MOVIMIENTO_OPERABLES,
  esTipoAjuste,
  esTipoConPrecio,
  etiquetaTipoMovimiento,
  nuevaClaveIdempotencia,
} from '../lib/movimientos';
import {
  tieneErrores,
  validarMovimiento,
  type ErroresMovimiento,
} from '../lib/validation';
import { Alerta, Boton, Campo, CampoSelect, CampoTextarea } from './ui';
import { IconoCheck } from './icons';

interface RegistrarMovimientoFormProps {
  monedaCodigo: string;
  monedaDecimales: number;
  cantidadActual: string;
  costoUnitarioActual: string;
  costoTotalActual: string;
  activa: boolean;
  enviando: boolean;
  errorServidor: string | null;
  onCancelar: () => void;
  onRegistrar: (datos: RegistrarMovimientoDatos) => Promise<boolean>;
}

function claveIdempotencia(): string {
  return nuevaClaveIdempotencia();
}

interface VistaPreviaMovimiento {
  bruto: string;
  neto: string;
  costoAplicado?: string;
  resultado?: string;
  costoResultante?: string;
}

/**
 * Formulario de alta de movimientos.
 *
 * <p>El importe bruto, el neto y el resultado son solo una vista previa: el
 * motor del backend vuelve a calcularlos con precisión decimal y es la fuente
 * de verdad. Los ajustes usan un costo total explícito.</p>
 */
export function RegistrarMovimientoForm({
  monedaCodigo,
  monedaDecimales,
  cantidadActual,
  costoUnitarioActual,
  costoTotalActual,
  activa,
  enviando,
  errorServidor,
  onCancelar,
  onRegistrar,
}: RegistrarMovimientoFormProps) {
  const [tipo, setTipo] = useState<TipoMovimiento>('COMPRA');
  const [fechaOperacion, setFechaOperacion] = useState(fechaHoyIso());
  const [fechaLiquidacion, setFechaLiquidacion] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precioUnitario, setPrecioUnitario] = useState('');
  const [comisiones, setComisiones] = useState('0');
  const [impuestos, setImpuestos] = useState('0');
  const [tipoCambio, setTipoCambio] = useState('1');
  const [costoTotalAjuste, setCostoTotalAjuste] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [errores, setErrores] = useState<ErroresMovimiento>({});

  const conPrecio = esTipoConPrecio(tipo);
  const ajuste = esTipoAjuste(tipo);
  const esVenta = tipo === 'VENTA';

  const vistaPrevia = useMemo<VistaPreviaMovimiento | null>(() => {
    if (!cantidad || !conPrecio || !precioUnitario) {
      return null;
    }
    const bruto = multiplicarDecimales(cantidad, precioUnitario);
    const gastos = sumarDecimales(comisiones || '0', impuestos || '0');
    const neto = esVenta
      ? restarDecimales(bruto, gastos)
      : sumarDecimales(bruto, gastos);
    if (esVenta) {
      const costoAplicado = multiplicarDecimales(
        cantidad,
        costoUnitarioActual,
      );
      const resultado = restarDecimales(neto, costoAplicado);
      return { bruto, neto, costoAplicado, resultado };
    }
    return {
      bruto,
      neto,
      costoResultante: sumarDecimales(costoTotalActual, neto),
    };
  }, [
    cantidad,
    comisiones,
    conPrecio,
    costoTotalActual,
    costoUnitarioActual,
    esVenta,
    impuestos,
    precioUnitario,
  ]);

  const excedeDisponible =
    esVenta &&
    cantidad.trim() !== '' &&
    compararDecimales(cantidad.trim(), cantidadActual) > 0;

  async function enviar(evento: FormEvent) {
    evento.preventDefault();

    const validados = validarMovimiento(
      {
        tipo,
        cantidad,
        precioUnitario: conPrecio ? precioUnitario : '0',
        comisiones,
        impuestos,
        tipoCambio,
        costoTotalAjuste,
        fechaOperacion,
        fechaLiquidacion,
        observaciones,
      },
      { cantidadDisponible: cantidadActual },
    );
    setErrores(validados);
    if (tieneErrores(validados)) {
      return;
    }

    const datos: RegistrarMovimientoDatos = {
      tipo,
      fechaOperacion: fechaOperacion || undefined,
      fechaLiquidacion: fechaLiquidacion || undefined,
      cantidad: cantidad.trim(),
      precioUnitario: conPrecio ? precioUnitario.trim() : '0',
      tipoCambio: tipoCambio.trim() || undefined,
      observaciones: observaciones.trim() || undefined,
      claveIdempotencia: claveIdempotencia(),
    };
    if (conPrecio) {
      datos.comisiones = comisiones.trim() || '0';
      datos.impuestos = impuestos.trim() || '0';
    }
    if (ajuste) {
      datos.costoTotalAjuste = costoTotalAjuste.trim();
    }

    const creado = await onRegistrar(datos);
    if (creado) {
      setCantidad('');
      setPrecioUnitario('');
      setComisiones('0');
      setImpuestos('0');
      setCostoTotalAjuste('');
      setObservaciones('');
      setErrores({});
    }
  }

  return (
    <form className="formulario formulario--cuenta" onSubmit={enviar} noValidate>
      {!activa ? (
        <Alerta variante="error" className="campo--ancho">
          La posición está inactiva y no admite movimientos. Reactívala antes de
          registrar una compra, venta o ajuste.
        </Alerta>
      ) : null}

      {errorServidor ? (
        <Alerta variante="error" className="campo--ancho">
          {errorServidor}
        </Alerta>
      ) : null}

      <CampoSelect
        etiqueta="Tipo de movimiento"
        name="tipo"
        value={tipo}
        onChange={(evento) => {
          setTipo(evento.target.value as TipoMovimiento);
          setErrores({});
        }}
        error={errores.tipo}
        ayuda={
          ajuste
            ? 'Un ajuste corrige la cantidad con un costo total explícito.'
            : 'Los movimientos confirmados no se editan; se compensan con una reversión.'
        }
        disabled={!activa}
        required
      >
        {TIPOS_MOVIMIENTO_OPERABLES.map((opcion) => (
          <option key={opcion} value={opcion}>
            {etiquetaTipoMovimiento(opcion)}
          </option>
        ))}
      </CampoSelect>

      <Campo
        etiqueta="Fecha de operación"
        name="fechaOperacion"
        type="date"
        value={fechaOperacion}
        onChange={(evento) => setFechaOperacion(evento.target.value)}
        error={errores.fechaOperacion}
        ayuda="Si la omites, se usa la fecha de hoy."
        max={fechaHoyIso()}
        disabled={!activa}
      />

      <Campo
        etiqueta="Cantidad"
        name="cantidad"
        value={cantidad}
        onChange={(evento) => setCantidad(evento.target.value)}
        error={errores.cantidad}
        ayuda={
          esVenta
            ? `Disponible: ${formatearCantidad(cantidadActual)}.`
            : 'Admite hasta 10 decimales.'
        }
        inputMode="decimal"
        autoComplete="off"
        disabled={!activa}
        required
      />

      {conPrecio ? (
        <Campo
          etiqueta="Precio unitario"
          name="precioUnitario"
          value={precioUnitario}
          onChange={(evento) => setPrecioUnitario(evento.target.value)}
          error={errores.precioUnitario}
          ayuda={`Precio por unidad en ${monedaCodigo}.`}
          inputMode="decimal"
          autoComplete="off"
          disabled={!activa}
          required
        />
      ) : (
        <Campo
          etiqueta="Costo total del ajuste"
          name="costoTotalAjuste"
          value={costoTotalAjuste}
          onChange={(evento) => setCostoTotalAjuste(evento.target.value)}
          error={errores.costoTotalAjuste}
          ayuda={`Magnitud de costo que se agrega o retira, en ${monedaCodigo}.`}
          inputMode="decimal"
          autoComplete="off"
          disabled={!activa}
          required
        />
      )}

      {conPrecio ? (
        <>
          <Campo
            etiqueta="Comisiones"
            name="comisiones"
            value={comisiones}
            onChange={(evento) => setComisiones(evento.target.value)}
            error={errores.comisiones}
            ayuda={`Gastos de la operación en ${monedaCodigo}.`}
            inputMode="decimal"
            autoComplete="off"
            disabled={!activa}
          />
          <Campo
            etiqueta="Impuestos y gastos"
            name="impuestos"
            value={impuestos}
            onChange={(evento) => setImpuestos(evento.target.value)}
            error={errores.impuestos}
            ayuda="Se suman a una compra y se descuentan de una venta."
            inputMode="decimal"
            autoComplete="off"
            disabled={!activa}
          />
          <Campo
            etiqueta="Fecha de liquidación (opcional)"
            name="fechaLiquidacion"
            type="date"
            value={fechaLiquidacion}
            onChange={(evento) => setFechaLiquidacion(evento.target.value)}
            error={errores.fechaLiquidacion}
            ayuda="No puede ser anterior a la operación."
            max={fechaHoyIso()}
            disabled={!activa}
          />
        </>
      ) : null}

      <Campo
        etiqueta="Tipo de cambio (opcional)"
        name="tipoCambio"
        value={tipoCambio}
        onChange={(evento) => setTipoCambio(evento.target.value)}
        error={errores.tipoCambio}
        ayuda="Se conserva en el movimiento; por defecto es 1."
        inputMode="decimal"
        autoComplete="off"
        disabled={!activa}
      />

      <CampoTextarea
        etiqueta="Observaciones (opcional)"
        name="observaciones"
        value={observaciones}
        onChange={(evento) => setObservaciones(evento.target.value)}
        error={errores.observaciones}
        ayuda={`${observaciones.trim().length}/500 caracteres.`}
        maxLength={500}
        rows={3}
        placeholder="Motivo del movimiento, referencia de la operación o del ajuste."
        className="campo--ancho"
        disabled={!activa}
      />

      {vistaPrevia ? (
        <div className="movimiento-vista-previa campo--ancho">
          <div>
            <span>Importe bruto</span>
            <strong>
              {formatearImporte(vistaPrevia.bruto, monedaDecimales)}{' '}
              {monedaCodigo}
            </strong>
          </div>
          <div>
            <span>Importe neto</span>
            <strong>
              {formatearImporte(vistaPrevia.neto, monedaDecimales)}{' '}
              {monedaCodigo}
            </strong>
          </div>
          {esVenta ? (
            <>
              <div>
                <span>Costo aplicado estimado</span>
                <strong>
                  {formatearImporte(
                    vistaPrevia.costoAplicado ?? '0',
                    monedaDecimales,
                  )}{' '}
                  {monedaCodigo}
                </strong>
              </div>
              <div>
                <span>Resultado estimado</span>
                <strong>
                  {formatearImporte(
                    vistaPrevia.resultado ?? '0',
                    monedaDecimales,
                  )}{' '}
                  {monedaCodigo}
                </strong>
              </div>
            </>
          ) : (
            <div>
              <span>Costo de adquisición resultante</span>
              <strong>
                {formatearImporte(
                  vistaPrevia.costoResultante ?? '0',
                  monedaDecimales,
                )}{' '}
                {monedaCodigo}
              </strong>
            </div>
          )}
          <p className="card-note">
            Vista previa calculada en el navegador. El backend recalcula y
            confirma los importes con precisión decimal.
          </p>
        </div>
      ) : null}

      {excedeDisponible ? (
        <Alerta variante="error" className="campo--ancho">
          La cantidad supera las {formatearCantidad(cantidadActual)} unidades
          disponibles en la posición.
        </Alerta>
      ) : null}

      <div className="formulario__acciones campo--ancho">
        <Boton
          type="button"
          variante="fantasma"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </Boton>
        <Boton
          type="submit"
          cargando={enviando}
          disabled={!activa || excedeDisponible}
        >
          <IconoCheck />
          Registrar movimiento
        </Boton>
      </div>
    </form>
  );
}
