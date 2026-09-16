import { supabase } from './supabaseClient';
import api from './api';

export type PeriodoTipo = 'este_mes' | 'mes_pasado' | 'ultimos_3' | 'ultimos_6' | 'anio' | 'personalizado';

export interface RangoFechas {
  inicio: string; // YYYY-MM-DD
  fin: string;
  etiqueta: string;
}

export interface ResumenReporte {
  rango: RangoFechas;
  usuario: { nombre: string; correo: string };
  cuentas: { nombre: string; tipo: string; saldo: number }[];
  saldoTotal: number;
  ingresos: number;
  gastos: number;
  transferencias: number;
  balance: number;
  porCategoria: { nombre: string; total: number }[];
  movimientos: {
    fecha: string;
    tipo: string;
    monto: number;
    descripcion: string;
    categoria: string;
    cuenta: string;
  }[];
  presupuestos: { categoria: string; limite: number; gastado: number }[];
  deudas: { entidad: string; tipo: string; total: number; pagado: number; estado: string; vencimiento: string }[];
}

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function fmtDate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function calcularRango(
  tipo: PeriodoTipo,
  personalizado?: { inicio: string; fin: string }
): RangoFechas {
  const hoy = new Date();
  const y = hoy.getFullYear();
  const m = hoy.getMonth();

  if (tipo === 'personalizado' && personalizado?.inicio && personalizado?.fin) {
    return {
      inicio: personalizado.inicio,
      fin: personalizado.fin,
      etiqueta: `${personalizado.inicio} → ${personalizado.fin}`,
    };
  }

  if (tipo === 'este_mes') {
    const inicio = new Date(y, m, 1);
    const fin = new Date(y, m + 1, 0);
    return { inicio: fmtDate(inicio), fin: fmtDate(fin), etiqueta: `${MESES[m]} ${y}` };
  }

  if (tipo === 'mes_pasado') {
    const inicio = new Date(y, m - 1, 1);
    const fin = new Date(y, m, 0);
    return {
      inicio: fmtDate(inicio),
      fin: fmtDate(fin),
      etiqueta: `${MESES[inicio.getMonth()]} ${inicio.getFullYear()}`,
    };
  }

  if (tipo === 'ultimos_3') {
    const inicio = new Date(y, m - 2, 1);
    const fin = new Date(y, m + 1, 0);
    return { inicio: fmtDate(inicio), fin: fmtDate(fin), etiqueta: `Últimos 3 meses` };
  }

  if (tipo === 'ultimos_6') {
    const inicio = new Date(y, m - 5, 1);
    const fin = new Date(y, m + 1, 0);
    return { inicio: fmtDate(inicio), fin: fmtDate(fin), etiqueta: `Últimos 6 meses` };
  }

  // anio
  const inicio = new Date(y, 0, 1);
  const fin = new Date(y, 11, 31);
  return { inicio: fmtDate(inicio), fin: fmtDate(fin), etiqueta: `Año ${y}` };
}

export async function generarResumenReporte(
  tipo: PeriodoTipo,
  personalizado?: { inicio: string; fin: string }
): Promise<ResumenReporte> {
  const rango = calcularRango(tipo, personalizado);
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Debes iniciar sesión');

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('nombre_completo, correo')
    .eq('id', user.id)
    .maybeSingle();

  const nombre =
    perfil?.nombre_completo ||
    user.user_metadata?.nombre_completo ||
    user.email?.split('@')[0] ||
    'Usuario';
  const correo = perfil?.correo || user.email || '';

  const [{ data: cuentas }, { data: trans }, { data: deudas }] = await Promise.all([
    supabase.from('cuentas').select('nombre, tipo_cuenta, saldo_actual').eq('usuario_id', user.id),
    supabase
      .from('transacciones')
      .select(
        'fecha_movimiento, tipo_transaccion, monto, descripcion, categorias(nombre), cuentas!transacciones_cuenta_origen_id_fkey(nombre)'
      )
      .eq('usuario_id', user.id)
      .gte('fecha_movimiento', rango.inicio)
      .lte('fecha_movimiento', rango.fin)
      .order('fecha_movimiento', { ascending: false }),
    supabase
      .from('deudas')
      .select('entidad_persona, tipo_deuda, monto_total, monto_pagado, estado, fecha_vencimiento')
      .eq('usuario_id', user.id)
      .order('fecha_vencimiento', { ascending: true }),
  ]);

  const listaCuentas = (cuentas || []).map((c) => ({
    nombre: c.nombre,
    tipo: c.tipo_cuenta || '',
    saldo: Number(c.saldo_actual) || 0,
  }));
  const saldoTotal = listaCuentas.reduce((a, c) => a + c.saldo, 0);

  let ingresos = 0;
  let gastos = 0;
  let transferencias = 0;
  const catMap = new Map<string, number>();

  const movimientos = (trans || []).map((t: any) => {
    const monto = Number(t.monto) || 0;
    const tipoT = (t.tipo_transaccion || '').toUpperCase();
    if (tipoT === 'INGRESO') ingresos += monto;
    else if (tipoT === 'GASTO') {
      gastos += monto;
      const cn = t.categorias?.nombre || 'Sin categoría';
      catMap.set(cn, (catMap.get(cn) || 0) + monto);
    } else if (tipoT === 'TRANSFERENCIA') transferencias += monto;

    return {
      fecha: t.fecha_movimiento,
      tipo: tipoT,
      monto,
      descripcion: t.descripcion || '',
      categoria: t.categorias?.nombre || '—',
      cuenta: t.cuentas?.nombre || '—',
    };
  });

  const porCategoria = [...catMap.entries()]
    .map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);

  // Presupuestos del mes de fin del rango
  const fin = new Date(rango.fin + 'T00:00:00');
  const mesP = fin.getMonth() + 1;
  const anioP = fin.getFullYear();
  const { data: presups } = await supabase
    .from('presupuestos')
    .select('monto_limite, categorias(nombre)')
    .eq('usuario_id', user.id)
    .eq('mes', mesP)
    .eq('anio', anioP);

  const presupuestos = (presups || []).map((p: any) => {
    const cat = p.categorias?.nombre || '—';
    const gastado = catMap.get(cat) || 0;
    return { categoria: cat, limite: Number(p.monto_limite) || 0, gastado };
  });

  const listaDeudas = (deudas || []).map((d) => ({
    entidad: d.entidad_persona,
    tipo: d.tipo_deuda || '',
    total: Number(d.monto_total) || 0,
    pagado: Number(d.monto_pagado) || 0,
    estado: d.estado || '',
    vencimiento: d.fecha_vencimiento || '',
  }));

  return {
    rango,
    usuario: { nombre, correo },
    cuentas: listaCuentas,
    saldoTotal,
    ingresos,
    gastos,
    transferencias,
    balance: ingresos - gastos,
    porCategoria,
    movimientos,
    presupuestos,
    deudas: listaDeudas,
  };
}

// ---------------------------------------------------------------------------
// Utilidades de render (escape + gráficos con HTML/CSS, sin librerías externas
// para que se vean bien tanto impresos como en clientes de correo)
// ---------------------------------------------------------------------------

/** Escapa texto libre antes de insertarlo en HTML (evita inyección). */
function esc(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[c] as string));
}

const PALETA = ['#c99a3f', '#7aa4c9', '#c96b6b', '#7fbf8f', '#9b8fc9', '#c9a97f', '#6bb3c9', '#c97fae'];

/** Barra horizontal simple (label, valor, % de una barra máxima) hecha con divs. */
function filaBarra(label: string, valor: number, maxValor: number, color: string, money: (n: number) => string): string {
  const pct = maxValor > 0 ? Math.max(2, Math.min(100, (Math.abs(valor) / maxValor) * 100)) : 0;
  return `
    <div style="margin:6px 0;">
      <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:3px;color:#333;">
        <span>${esc(label)}</span><span style="font-weight:600;">$${money(valor)}</span>
      </div>
      <div style="background:#eee;border-radius:5px;height:11px;width:100%;overflow:hidden;">
        <div style="background:${color};height:11px;border-radius:5px;width:${pct}%;"></div>
      </div>
    </div>`;
}

/** Gráfico de barras: Ingresos / Gastos / Balance. */
function graficoResumen(ingresos: number, gastos: number, balance: number, money: (n: number) => string): string {
  const max = Math.max(ingresos, gastos, Math.abs(balance), 1);
  return `
    <div style="border:1px solid #e5e5e5;border-radius:10px;padding:14px 16px;">
      ${filaBarra('Ingresos', ingresos, max, '#3f9e5c', money)}
      ${filaBarra('Gastos', gastos, max, '#c94b4b', money)}
      ${filaBarra('Balance', balance, max, balance >= 0 ? '#3f9e5c' : '#c94b4b', money)}
    </div>`;
}

/** Gráfico de barras: top categorías de gasto. */
function graficoCategorias(cats: { nombre: string; total: number }[], money: (n: number) => string): string {
  const top = cats.slice(0, 6);
  if (top.length === 0) return '<p class="muted">Sin gastos registrados en el periodo.</p>';
  const max = Math.max(...top.map((c) => c.total), 1);
  return `
    <div style="border:1px solid #e5e5e5;border-radius:10px;padding:14px 16px;">
      ${top.map((c, i) => filaBarra(c.nombre, c.total, max, PALETA[i % PALETA.length], money)).join('')}
    </div>`;
}

/** Gráfico de barras: saldo por cuenta. */
function graficoCuentas(cuentas: { nombre: string; tipo: string; saldo: number }[], money: (n: number) => string): string {
  if (cuentas.length === 0) return '<p class="muted">Sin cuentas registradas.</p>';
  const max = Math.max(...cuentas.map((c) => Math.abs(c.saldo)), 1);
  return `
    <div style="border:1px solid #e5e5e5;border-radius:10px;padding:14px 16px;">
      ${cuentas
        .map((c, i) => filaBarra(`${c.nombre} (${c.tipo || 'cuenta'})`, c.saldo, max, PALETA[(i + 3) % PALETA.length], money))
        .join('')}
    </div>`;
}

/** Barra de progreso pagado/total por deuda. */
function graficoDeudas(deudas: ResumenReporte['deudas'], money: (n: number) => string): string {
  if (deudas.length === 0) return '<p class="muted">Sin deudas registradas.</p>';
  return `
    <div style="border:1px solid #e5e5e5;border-radius:10px;padding:14px 16px;">
      ${deudas
        .slice(0, 8)
        .map((d) => {
          const pct = d.total > 0 ? Math.max(0, Math.min(100, (d.pagado / d.total) * 100)) : 0;
          const pendiente = d.total - d.pagado;
          return `
          <div style="margin:8px 0;">
            <div style="display:flex;justify-content:space-between;font-size:11px;color:#333;margin-bottom:3px;">
              <span>${esc(d.entidad)} <span style="color:#888;">· ${esc(d.tipo)} · vence ${esc(d.vencimiento)}</span></span>
              <span style="font-weight:600;">Pendiente $${money(pendiente)}</span>
            </div>
            <div style="background:#eee;border-radius:5px;height:9px;width:100%;overflow:hidden;">
              <div style="background:#7aa4c9;height:9px;border-radius:5px;width:${pct}%;"></div>
            </div>
          </div>`;
        })
        .join('')}
    </div>`;
}

/** Genera HTML del reporte (para impresión / PDF del navegador y para el correo). */
export function htmlReporte(r: ResumenReporte): string {
  const money = (n: number) =>
    n.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Solo los movimientos más recientes, en formato compacto (no 80 filas).
  const movimientosRecientes = r.movimientos.slice(0, 12);
  const filasMov = movimientosRecientes
    .map(
      (m) =>
        `<tr><td>${esc(m.fecha)}</td><td>${esc(m.categoria)}</td><td>${esc(m.descripcion) || '—'}</td><td style="text-align:right;color:${m.tipo === 'GASTO' ? '#c94b4b' : '#3f9e5c'}">$${money(m.monto)}</td></tr>`
    )
    .join('');
  const hayMasMovimientos = r.movimientos.length > movimientosRecientes.length;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/><title>Reporte Arca — ${esc(r.rango.etiqueta)}</title>
<style>
  body{font-family:system-ui,Segoe UI,sans-serif;color:#111;margin:24px;font-size:12px}
  h1{font-size:20px;margin:0 0 4px}
  h2{font-size:14px;margin:22px 0 8px;border-bottom:1px solid #ddd;padding-bottom:4px}
  .muted{color:#666;font-size:11px}
  .cards{display:flex;gap:12px;flex-wrap:wrap;margin:12px 0}
  .card{border:1px solid #ddd;border-radius:8px;padding:10px 14px;min-width:120px}
  .card b{display:block;font-size:16px;margin-top:4px}
  table{width:100%;border-collapse:collapse;margin-top:6px}
  th,td{border:1px solid #e5e5e5;padding:6px 8px;text-align:left}
  th{background:#f5f5f5;font-size:11px}
  @media print{body{margin:12px} .no-print{display:none}}
</style></head><body>
  <h1>Arca — Reporte financiero</h1>
  <p class="muted">${esc(r.usuario.nombre)} · ${esc(r.usuario.correo)}<br/>Periodo: <strong>${esc(r.rango.etiqueta)}</strong> (${esc(r.rango.inicio)} a ${esc(r.rango.fin)})<br/>Generado: ${esc(new Date().toLocaleString('es-EC'))}</p>

  <div class="cards">
    <div class="card">Ingresos<b style="color:#2a7">$${money(r.ingresos)}</b></div>
    <div class="card">Gastos<b style="color:#c33">$${money(r.gastos)}</b></div>
    <div class="card">Balance<b>$${money(r.balance)}</b></div>
    <div class="card">Saldo cuentas<b>$${money(r.saldoTotal)}</b></div>
  </div>

  <h2>Ingresos vs. gastos</h2>
  ${graficoResumen(r.ingresos, r.gastos, r.balance, money)}

  <h2>Gastos por categoría</h2>
  ${graficoCategorias(r.porCategoria, money)}

  <h2>Cuentas</h2>
  ${graficoCuentas(r.cuentas, money)}

  <h2>Deudas</h2>
  ${graficoDeudas(r.deudas, money)}

  <h2>Últimos movimientos</h2>
  <table><thead><tr><th>Fecha</th><th>Categoría</th><th>Descripción</th><th>Monto</th></tr></thead>
  <tbody>${filasMov || '<tr><td colspan="4">Sin movimientos</td></tr>'}</tbody></table>
  ${hayMasMovimientos ? `<p class="muted">Mostrando los ${movimientosRecientes.length} movimientos más recientes de ${r.movimientos.length} en total. Consulta la app para el detalle completo.</p>` : ''}

  <p class="muted" style="margin-top:24px">Documento generado por Arca · Uso personal</p>
</body></html>`;
}

/** Abre ventana de impresión para guardar como PDF. */
export function descargarPdfNavegador(r: ResumenReporte) {
  const html = htmlReporte(r);
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) throw new Error('El navegador bloqueó la ventana emergente. Permite pop-ups para descargar el PDF.');
  w.document.open();
  w.document.write(html);
  w.document.close();
  setTimeout(() => {
    w.focus();
    w.print();
  }, 400);
}

/** Envía el reporte por email vía backend. El backend determina el destinatario a partir del token (JWT), no de este payload. */
export async function enviarReporteEmail(r: ResumenReporte): Promise<{ ok: boolean; message: string }> {
  try {
    const { data } = await api.post('/reporte/enviar', {
      nombre: r.usuario.nombre,
      periodo: r.rango.etiqueta,
      inicio: r.rango.inicio,
      fin: r.rango.fin,
      resumen: {
        ingresos: r.ingresos,
        gastos: r.gastos,
        balance: r.balance,
        saldoTotal: r.saldoTotal,
      },
      html: htmlReporte(r),
    });
    return { ok: true, message: data?.message || 'Reporte enviado a tu correo.' };
  } catch (e: any) {
    const msg =
      e?.response?.data?.message ||
      e?.message ||
      'El servidor de correo no está disponible.';
    return {
      ok: false,
      message:
        msg +
        ' Puedes descargar el PDF y enviarlo manualmente. (El backend necesita el endpoint POST /api/reporte/enviar)',
    };
  }
}