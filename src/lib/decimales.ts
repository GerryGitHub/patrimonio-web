interface DecimalDescompuesto {
  negativo: boolean;
  entero: string;
  fraccion: string;
}

function descomponer(valor: string): DecimalDescompuesto | null {
  const limpio = valor.trim();
  if (!/^-?\d+(\.\d+)?$/.test(limpio)) {
    return null;
  }
  const negativo = limpio.startsWith('-');
  const sinSigno = negativo ? limpio.slice(1) : limpio;
  const [entero = '0', fraccion = ''] = sinSigno.split('.');
  return { negativo, entero, fraccion };
}

/** Indica si el texto representa un decimal sin exponente. */
export function esDecimal(valor: string): boolean {
  return descomponer(valor) !== null;
}

/** Indica si el texto representa un decimal mayor o igual que cero. */
export function esDecimalNoNegativo(valor: string): boolean {
  const descompuesto = descomponer(valor);
  if (!descompuesto) {
    return false;
  }
  const cero =
    descompuesto.entero.replace(/0/g, '') === '' &&
    descompuesto.fraccion.replace(/0/g, '') === '';
  return !descompuesto.negativo || cero;
}

/** Indica si el texto representa un decimal mayor que cero. */
export function esDecimalPositivo(valor: string): boolean {
  const descompuesto = descomponer(valor);
  if (!descompuesto) {
    return false;
  }
  const cero =
    descompuesto.entero.replace(/0/g, '') === '' &&
    descompuesto.fraccion.replace(/0/g, '') === '';
  return !descompuesto.negativo && !cero;
}

/**
 * Quita ceros sobrantes y normaliza el signo para mostrarlo en formularios.
 *
 * <p>El backend devuelve los importes como cadena con la escala de la base de
 * datos (`270.3750000000`). En un campo editable se muestra `270.375`.</p>
 */
export function normalizarDecimal(
  valor: string | null | undefined,
): string {
  if (!valor) {
    return '';
  }
  const descompuesto = descomponer(valor);
  if (!descompuesto) {
    return valor;
  }
  const entero = descompuesto.entero.replace(/^0+(?=\d)/, '') || '0';
  const fraccion = descompuesto.fraccion.replace(/0+$/, '');
  const texto = fraccion ? `${entero}.${fraccion}` : entero;
  const esCero = entero === '0' && fraccion === '';
  return descompuesto.negativo && !esCero ? `-${texto}` : texto;
}

function aEnteroEscalado(valor: DecimalDescompuesto, escala: number): bigint {
  const digitos = `${valor.entero}${valor.fraccion.padEnd(escala, '0')}`;
  const numero = BigInt(digitos || '0');
  return valor.negativo ? -numero : numero;
}

function desdeEnteroEscalado(numero: bigint, escala: number): string {
  const negativo = numero < 0n;
  const absoluto = negativo ? -numero : numero;
  const digitos = absoluto.toString().padStart(escala + 1, '0');
  const corte = digitos.length - escala;
  const entero = digitos.slice(0, corte);
  const fraccion = escala > 0 ? digitos.slice(corte).replace(/0+$/, '') : '';
  const texto = fraccion ? `${entero}.${fraccion}` : entero;
  return negativo && texto !== '0' ? `-${texto}` : texto;
}

/** Suma exacta de dos decimales representados como texto. */
export function sumarDecimales(a: string, b: string): string {
  const primero = descomponer(a);
  const segundo = descomponer(b);
  if (!primero || !segundo) {
    return '0';
  }
  const escala = Math.max(primero.fraccion.length, segundo.fraccion.length);
  return desdeEnteroEscalado(
    aEnteroEscalado(primero, escala) + aEnteroEscalado(segundo, escala),
    escala,
  );
}

/** Resta exacta de dos decimales representados como texto. */
export function restarDecimales(a: string, b: string): string {
  const negativo = b.trim().startsWith('-') ? b.trim().slice(1) : `-${b.trim()}`;
  return sumarDecimales(a, negativo);
}

/** Multiplicación exacta de dos decimales representados como texto. */
export function multiplicarDecimales(a: string, b: string): string {
  const primero = descomponer(a);
  const segundo = descomponer(b);
  if (!primero || !segundo) {
    return '0';
  }
  const escala = primero.fraccion.length + segundo.fraccion.length;
  const producto =
    aEnteroEscalado(primero, primero.fraccion.length) *
    aEnteroEscalado(segundo, segundo.fraccion.length);
  return desdeEnteroEscalado(producto, escala);
}

/**
 * Compara dos decimales exactos.
 *
 * <p>Devuelve un número negativo si {@code a < b}, cero si son iguales y un
 * número positivo si {@code a > b}. No usa coma flotante.</p>
 */
export function compararDecimales(a: string, b: string): number {
  const primero = descomponer(a);
  const segundo = descomponer(b);
  if (!primero || !segundo) {
    return 0;
  }
  const escala = Math.max(primero.fraccion.length, segundo.fraccion.length);
  const izquierda = aEnteroEscalado(primero, escala);
  const derecha = aEnteroEscalado(segundo, escala);
  if (izquierda === derecha) {
    return 0;
  }
  return izquierda < derecha ? -1 : 1;
}

function formatearConDecimales(
  valor: string,
  minimo: number,
  maximo: number,
): string {
  const normalizado = normalizarDecimal(valor);
  if (!normalizado) {
    return '-';
  }
  const numero = Number(normalizado);
  if (!Number.isFinite(numero)) {
    return normalizado;
  }
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: minimo,
    maximumFractionDigits: maximo,
  }).format(numero);
}

/** Formatea un importe monetario con los decimales de su moneda. */
export function formatearImporte(
  valor: string | null | undefined,
  decimales = 2,
): string {
  if (!valor) {
    return '-';
  }
  return formatearConDecimales(valor, decimales, decimales);
}

/** Formatea una cantidad de instrumentos conservando hasta 10 decimales. */
export function formatearCantidad(
  valor: string | null | undefined,
): string {
  if (!valor) {
    return '-';
  }
  return formatearConDecimales(valor, 0, 10);
}
