import { useEffect, useState, type FormEvent } from 'react';
import { crearPortafolio, listarMonedas } from '../api/portafolios';
import type { Moneda, Portafolio } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { Alerta, Boton, Campo, CampoSelect, CampoTextarea } from './ui';
import { IconoMas } from './icons';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import {
  tieneErrores,
  validarPortafolio,
  type ErroresPortafolio,
} from '../lib/validation';

interface CrearPortafolioFormProps {
  onCreado: (portafolio: Portafolio) => void;
  onCancelar: () => void;
}

/**
 * Formulario de alta de portafolios.
 *
 * <p>Las monedas se leen del catálogo real del backend; no hay una lista
 * duplicada en el cliente. Tras crear el portafolio, el componente padre
 * actualiza el listado y muestra la confirmación.</p>
 */
export function CrearPortafolioForm({
  onCreado,
  onCancelar,
}: CrearPortafolioFormProps) {
  const { marcarSesionExpirada } = useAuth();

  const [monedas, setMonedas] = useState<Moneda[]>([]);
  const [cargandoMonedas, setCargandoMonedas] = useState(true);
  const [errorMonedas, setErrorMonedas] = useState<string | null>(null);

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [monedaBaseId, setMonedaBaseId] = useState('');
  const [errores, setErrores] = useState<ErroresPortafolio>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    listarMonedas()
      .then((catalogo) => {
        if (cancelado) {
          return;
        }
        setMonedas(catalogo);
        setMonedaBaseId((actual) => actual || catalogo[0]?.id || '');
      })
      .catch((fallo: unknown) => {
        if (cancelado) {
          return;
        }
        if (esNoAutenticado(fallo)) {
          marcarSesionExpirada();
          return;
        }
        setErrorMonedas(
          mensajeDeError(fallo, 'portafolio'),
        );
      })
      .finally(() => {
        if (!cancelado) {
          setCargandoMonedas(false);
        }
      });

    return () => {
      cancelado = true;
    };
  }, [marcarSesionExpirada]);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorEnvio(null);

    const validacion = validarPortafolio({
      nombre,
      descripcion,
      monedaBaseId,
    });
    setErrores(validacion);
    if (tieneErrores(validacion)) {
      return;
    }

    setEnviando(true);
    try {
      const creado = await crearPortafolio({
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        monedaBaseId,
      });
      onCreado(creado);
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEnvio(mensajeDeError(fallo, 'portafolio'));
    } finally {
      setEnviando(false);
    }
  }

  const sinMonedas = !cargandoMonedas && !errorMonedas && monedas.length === 0;

  return (
    <section
      className="panel-formulario"
      aria-labelledby="titulo-nuevo-portafolio"
    >
      <div className="panel-formulario__cabecera">
        <div>
          <p className="eyebrow">Nuevo portafolio</p>
          <h2 id="titulo-nuevo-portafolio">Crea un portafolio</h2>
          <p>
            Elige un nombre, una descripción opcional y la moneda base con la
            que se valorará el patrimonio.
          </p>
        </div>
        <Boton
          type="button"
          variante="fantasma"
          onClick={onCancelar}
          disabled={enviando}
        >
          Cancelar
        </Boton>
      </div>

      {errorEnvio ? <Alerta variante="error">{errorEnvio}</Alerta> : null}

      {errorMonedas ? (
        <Alerta variante="error">{errorMonedas}</Alerta>
      ) : sinMonedas ? (
        <Alerta variante="info">
          El catálogo de monedas está vacío. Contacta con el administrador
          antes de crear un portafolio.
        </Alerta>
      ) : null}

      <form className="formulario formulario--portafolio" onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Nombre"
          name="nombre"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          error={errores.nombre}
          ayuda="Máximo 150 caracteres."
          maxLength={150}
          autoComplete="off"
          autoFocus
          required
        />

        <CampoTextarea
          etiqueta="Descripción (opcional)"
          name="descripcion"
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
          error={errores.descripcion}
          ayuda={`${descripcion.trim().length}/500 caracteres.`}
          maxLength={500}
          rows={3}
          placeholder="Para qué sirve este portafolio, objetivos, notas…"
        />

        <CampoSelect
          etiqueta="Moneda base"
          name="monedaBaseId"
          value={monedaBaseId}
          onChange={(evento) => setMonedaBaseId(evento.target.value)}
          error={errores.monedaBaseId}
          ayuda="La moneda base define la valoración consolidada del portafolio."
          disabled={cargandoMonedas || Boolean(errorMonedas) || sinMonedas}
          required
        >
          {cargandoMonedas ? (
            <option value="">Cargando monedas…</option>
          ) : (
            <>
              <option value="">Selecciona una moneda</option>
              {monedas.map((moneda) => (
                <option key={moneda.id} value={moneda.id}>
                  {moneda.codigo} · {moneda.nombre}
                </option>
              ))}
            </>
          )}
        </CampoSelect>

        <div className="formulario__acciones">
          <Boton
            type="submit"
            cargando={enviando}
            disabled={
              cargandoMonedas ||
              Boolean(errorMonedas) ||
              sinMonedas ||
              !monedaBaseId
            }
          >
            <IconoMas />
            Crear portafolio
          </Boton>
        </div>
      </form>
    </section>
  );
}
