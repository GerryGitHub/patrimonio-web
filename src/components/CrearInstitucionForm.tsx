import { useState, type FormEvent } from 'react';
import { crearInstitucion } from '../api/instituciones';
import type { Institucion, TipoInstitucion } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { TIPOS_INSTITUCION } from '../lib/catalogos';
import { esNoAutenticado, mensajeDeError } from '../lib/errors';
import {
  tieneErrores,
  validarInstitucion,
  type ErroresInstitucion,
} from '../lib/validation';
import { Alerta, Boton, Campo, CampoSelect } from './ui';
import { IconoMas } from './icons';

interface CrearInstitucionFormProps {
  onCreada: (institucion: Institucion) => void;
  onCancelar: () => void;
}

/**
 * Formulario de alta del catálogo global de instituciones.
 *
 * <p>La categoría se elige de una lista cerrada que coincide con el enum del
 * backend. El catálogo no pertenece a un portafolio, por lo que cualquier
 * usuario autenticado puede registrar una institución reutilizable.</p>
 */
export function CrearInstitucionForm({
  onCreada,
  onCancelar,
}: CrearInstitucionFormProps) {
  const { marcarSesionExpirada } = useAuth();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoInstitucion | ''>('');
  const [pais, setPais] = useState('');
  const [sitioWeb, setSitioWeb] = useState('');
  const [errores, setErrores] = useState<ErroresInstitucion>({});
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorEnvio(null);

    const validacion = validarInstitucion({ nombre, tipo, pais, sitioWeb });
    setErrores(validacion);
    if (tieneErrores(validacion) || !tipo) {
      return;
    }

    setEnviando(true);
    try {
      const creada = await crearInstitucion({
        nombre: nombre.trim(),
        tipo,
        pais: pais.trim() || undefined,
        sitioWeb: sitioWeb.trim() || undefined,
      });
      onCreada(creada);
    } catch (fallo) {
      if (esNoAutenticado(fallo)) {
        marcarSesionExpirada();
        return;
      }
      setErrorEnvio(mensajeDeError(fallo, 'institucion'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section
      className="panel-formulario"
      aria-labelledby="titulo-nueva-institucion"
    >
      <div className="panel-formulario__cabecera">
        <div>
          <p className="eyebrow">Nueva institución</p>
          <h2 id="titulo-nueva-institucion">Registra una institución</h2>
          <p>
            El catálogo es compartido por todos los portafolios. Evita duplicar
            instituciones con el mismo nombre.
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

      <form
        className="formulario formulario--institucion"
        onSubmit={enviar}
        noValidate
      >
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

        <CampoSelect
          etiqueta="Categoría"
          name="tipo"
          value={tipo}
          onChange={(evento) =>
            setTipo(evento.target.value as TipoInstitucion | '')
          }
          error={errores.tipo}
          required
        >
          <option value="">Selecciona una categoría</option>
          {TIPOS_INSTITUCION.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </CampoSelect>

        <Campo
          etiqueta="País (opcional)"
          name="pais"
          value={pais}
          onChange={(evento) => setPais(evento.target.value)}
          error={errores.pais}
          ayuda="Máximo 100 caracteres."
          maxLength={100}
          autoComplete="off"
        />

        <Campo
          etiqueta="Sitio web (opcional)"
          name="sitioWeb"
          type="url"
          value={sitioWeb}
          onChange={(evento) => setSitioWeb(evento.target.value)}
          error={errores.sitioWeb}
          ayuda="Máximo 255 caracteres."
          maxLength={255}
          autoComplete="off"
          placeholder="https://"
        />

        <div className="formulario__acciones">
          <Boton type="submit" cargando={enviando}>
            <IconoMas />
            Registrar institución
          </Boton>
        </div>
      </form>
    </section>
  );
}
