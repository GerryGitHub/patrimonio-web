import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Alerta, Boton, Campo, CampoPassword } from '../components/ui';
import { mensajeDeError } from '../lib/errors';
import {
  tieneErrores,
  validarRegistro,
  type ErroresRegistro,
} from '../lib/validation';

export function RegisterPage() {
  const { registrar } = useAuth();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmacion, setConfirmacion] = useState('');
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErrorGeneral(null);

    const validacion = validarRegistro({
      nombre,
      email,
      password,
      confirmacion,
    });
    setErrores(validacion);
    if (tieneErrores(validacion)) {
      return;
    }

    const correo = email.trim().toLowerCase();
    setEnviando(true);
    try {
      await registrar({
        nombre: nombre.trim(),
        email: correo,
        password,
      });
      // El backend responde 201 sin crear sesión: el acceso es un paso aparte.
      navigate('/login', {
        replace: true,
        state: { registrado: true, email: correo },
      });
    } catch (error) {
      setErrorGeneral(mensajeDeError(error, 'registro'));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout
      titulo="Crea tu cuenta"
      subtitulo="Empieza a organizar tu patrimonio en minutos."
    >
      {errorGeneral ? (
        <Alerta variante="error">{errorGeneral}</Alerta>
      ) : null}

      <form className="formulario" onSubmit={enviar} noValidate>
        <Campo
          etiqueta="Nombre completo"
          name="nombre"
          autoComplete="name"
          placeholder="María Pérez"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
          error={errores.nombre}
          ayuda="Así te saludaremos dentro de la aplicación."
          autoFocus
        />

        <Campo
          etiqueta="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
          error={errores.email}
        />

        <CampoPassword
          etiqueta="Contraseña"
          name="password"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(evento) => setPassword(evento.target.value)}
          error={errores.password}
          ayuda="Usa al menos 8 caracteres. No la compartas con nadie."
        />

        <CampoPassword
          etiqueta="Repite la contraseña"
          name="confirmacion"
          autoComplete="new-password"
          placeholder="Vuelve a escribirla"
          value={confirmacion}
          onChange={(evento) => setConfirmacion(evento.target.value)}
          error={errores.confirmacion}
        />

        <Boton type="submit" anchoCompleto cargando={enviando}>
          {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
        </Boton>
      </form>

      <p className="auth__cambio">
        ¿Ya tienes una cuenta? <Link to="/login">Inicia sesión</Link>
      </p>
    </AuthLayout>
  );
}
