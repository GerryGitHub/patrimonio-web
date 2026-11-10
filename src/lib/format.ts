export function formatearFecha(
  fecha: string | null | undefined,
): string {
  if (!fecha) {
    return '—';
  }

  const partes = fecha.split('-');
  if (partes.length !== 3) {
    return fecha;
  }

  const [anio, mes, dia] = partes.map(Number);
  if (!anio || !mes || !dia) {
    return fecha;
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(anio, mes - 1, dia));
}

export function formatearFechaHora(
  fecha: string | null | undefined,
): string {
  if (!fecha) {
    return '-';
  }

  const instante = new Date(fecha);
  if (Number.isNaN(instante.getTime())) {
    return fecha;
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(instante);
}

export function fechaHoyIso(fecha = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

export function saludo(fecha = new Date()): string {
  const hora = fecha.getHours();
  if (hora < 12) {
    return 'Buenos días';
  }
  if (hora < 20) {
    return 'Buenas tardes';
  }
  return 'Buenas noches';
}

export function primerNombre(nombre: string): string {
  return nombre.trim().split(/\s+/)[0] ?? nombre;
}

export function iniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) {
    return '?';
  }
  const primera = partes[0]?.charAt(0) ?? '';
  const ultima = partes.length > 1 ? (partes.at(-1)?.charAt(0) ?? '') : '';
  return `${primera}${ultima}`.toUpperCase();
}
