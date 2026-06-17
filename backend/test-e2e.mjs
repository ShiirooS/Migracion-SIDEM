// Test E2E para todos los Criterios de Aceptación (CA-01 a CA-12)
import { createReadStream, writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const BASE = 'http://localhost:4000/api';
let PASS = 0, FAIL = 0;

function ok(name) { console.log(`  ✅ PASS: ${name}`); PASS++; }
function fail(name, got, expected) { console.log(`  ❌ FAIL: ${name} — esperaba ${expected}, recibió ${JSON.stringify(got)}`); FAIL++; }

async function req(path, opts = {}) {
  const res = await fetch(`${BASE}${path}`, opts);
  let body;
  try { body = await res.json(); } catch { body = {}; }
  return { status: res.status, body };
}

// PDF mínimo válido (1 byte fake pero content-type correcto es lo que valida multer)
function makeFakePdf(name) {
  const path = join(tmpdir(), name);
  writeFileSync(path, '%PDF-1.4 test');
  return path;
}

async function login(email, password) {
  const { body } = await req('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return body.token;
}

async function crearExpediente({ pasaporte = 'TEST' + Date.now(), vencimiento = '2028-01-01', nacionalidad = 'CO', monto = '1500', nombres = 'Ana', apellidos = 'García', fechaNac = '1990-06-15' } = {}) {
  const pdf1 = makeFakePdf('solvencia_test.pdf');
  const pdf2 = makeFakePdf('antecedentes_test.pdf');

  const fd = new FormData();
  fd.append('nombres', nombres);
  fd.append('apellidos', apellidos);
  fd.append('fecha_nacimiento', fechaNac);
  fd.append('nacionalidad_codigo', nacionalidad);
  fd.append('numero_pasaporte', pasaporte);
  fd.append('vencimiento_pasaporte', vencimiento);
  fd.append('categoria_migratoria', 'TURISTA');
  fd.append('monto_subsistencia', monto);
  fd.append('comprobante_solvencia', new Blob(['%PDF-1.4 test'], { type: 'application/pdf' }), 'solvencia.pdf');
  fd.append('antecedentes_penales', new Blob(['%PDF-1.4 test'], { type: 'application/pdf' }), 'antecedentes.pdf');

  const res = await fetch(`${BASE}/applications`, { method: 'POST', body: fd });
  const body = await res.json();
  return { status: res.status, body };
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n=== SIDEM-PAN: Pruebas E2E ===\n');

// Setup tokens
const tokenAdmin = await login('admin@sidem-pan.gob.pa', 'sidem2026');
const tokenAgente = await login('agente1@sidem-pan.gob.pa', 'sidem2026');
if (!tokenAdmin || tokenAdmin.startsWith('ERROR')) { console.error('ERROR: Login admin falló:', tokenAdmin); process.exit(1); }
if (!tokenAgente || tokenAgente.startsWith('ERROR')) { console.error('ERROR: Login agente falló:', tokenAgente); process.exit(1); }
console.log('Tokens obtenidos ✓');

// ─── CA-01: Pasaporte con < 6 meses de vigencia → 422 ─────────────────────
console.log('\n--- CA-01: Validación pasaporte < 6 meses ---');
{
  const fechaProxima = new Date();
  fechaProxima.setMonth(fechaProxima.getMonth() + 3);
  const venc = fechaProxima.toISOString().split('T')[0];
  const { status, body } = await crearExpediente({ vencimiento: venc, pasaporte: 'CA01TEST' });
  if (status === 422 && body.error?.includes('6 meses')) ok('Rechaza pasaporte con < 6 meses');
  else fail('Rechaza pasaporte con < 6 meses', { status, error: body.error }, '422 con mensaje sobre 6 meses');
}

// ─── CA-01b: Pasaporte vigente (≥ 6 meses) → acepta ──────────────────────
{
  const { status } = await crearExpediente({ vencimiento: '2028-06-01', pasaporte: 'CA01BTEST' });
  if (status === 201) ok('Acepta pasaporte con ≥ 6 meses vigentes');
  else fail('Acepta pasaporte con ≥ 6 meses vigentes', status, 201);
}

// ─── CA-02: Documentos PDF obligatorios ────────────────────────────────────
console.log('\n--- CA-02: PDF requeridos ---');
{
  const fd = new FormData();
  fd.append('nombres', 'Juan'); fd.append('apellidos', 'Perez');
  fd.append('fecha_nacimiento', '1990-01-01'); fd.append('nacionalidad_codigo', 'US');
  fd.append('numero_pasaporte', 'CA02TEST'); fd.append('vencimiento_pasaporte', '2028-01-01');
  fd.append('categoria_migratoria', 'TURISTA'); fd.append('monto_subsistencia', '1000');
  // Solo un PDF (falta antecedentes)
  fd.append('comprobante_solvencia', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'sol.pdf');
  const res = await fetch(`${BASE}/applications`, { method: 'POST', body: fd });
  if (res.status === 400) ok('Rechaza solicitud sin antecedentes PDF');
  else fail('Rechaza solicitud sin antecedentes PDF', res.status, 400);
}
{
  // Archivo no PDF
  const fd = new FormData();
  fd.append('nombres', 'Juan'); fd.append('apellidos', 'Perez');
  fd.append('fecha_nacimiento', '1990-01-01'); fd.append('nacionalidad_codigo', 'US');
  fd.append('numero_pasaporte', 'CA02TEST2'); fd.append('vencimiento_pasaporte', '2028-01-01');
  fd.append('categoria_migratoria', 'TURISTA'); fd.append('monto_subsistencia', '1000');
  fd.append('comprobante_solvencia', new Blob(['not a pdf'], { type: 'text/plain' }), 'sol.txt');
  fd.append('antecedentes_penales', new Blob(['%PDF-1.4'], { type: 'application/pdf' }), 'ant.pdf');
  const res = await fetch(`${BASE}/applications`, { method: 'POST', body: fd });
  if (res.status === 422) ok('Rechaza archivo no PDF (text/plain)');
  else fail('Rechaza archivo no PDF (text/plain)', res.status, 422);
}

// ─── CA-03: Ticket único generado ──────────────────────────────────────────
console.log('\n--- CA-03: Ticket único ---');
{
  const { status, body } = await crearExpediente({ pasaporte: 'CA03TEST' });
  if (status === 201 && body.ticket_number?.match(/^PAN-\d{4}-\d{5}$/)) ok(`Ticket generado: ${body.ticket_number}`);
  else fail('Ticket generado con formato PAN-YYYY-NNNNN', { status, body }, '201 con ticket_number');
}

// ─── CA-04: Score ALTO para pasaporte en INTERPOL ─────────────────────────
console.log('\n--- CA-04: Score riesgo INTERPOL/OFAC ---');
{
  // RF992847A es el pasaporte de Aleksei Morozov (INTERPOL) en nuestros seeds
  const { status, body } = await crearExpediente({ pasaporte: 'RF992847A', nombres: 'Aleksei', apellidos: 'Morozov', vencimiento: '2028-01-01' });
  if (status === 201) {
    // Verificar score consultando expediente vía API
    const apps = await req('/applications', { headers: { Authorization: `Bearer ${tokenAdmin}` } });
    const app = apps.body.find(a => a.numero_pasaporte === 'RF992847A');
    if (app && app.nivel_riesgo === 'ALTO' && app.score_riesgo >= 50) ok(`Score ALTO por INTERPOL: score=${app.score_riesgo}, nivel=${app.nivel_riesgo}, alerta=${app.interpol_alerta_tipo}`);
    else fail('Score ALTO para INTERPOL Red Notice', app, 'nivel_riesgo=ALTO, score>=50');
  } else {
    fail('Crear expediente INTERPOL', { status, body }, 201);
  }
}
{
  // KL556234C es Dmitri Volkov (OFAC) en nuestros seeds
  const { status, body } = await crearExpediente({ pasaporte: 'KL556234C', nombres: 'Dmitri', apellidos: 'Volkov', vencimiento: '2028-01-01' });
  if (status === 201) {
    const apps = await req('/applications', { headers: { Authorization: `Bearer ${tokenAdmin}` } });
    const app = apps.body.find(a => a.numero_pasaporte === 'KL556234C');
    if (app && app.nivel_riesgo === 'MEDIO' && app.score_riesgo >= 40) ok(`Score MEDIO por OFAC: score=${app.score_riesgo}, nivel=${app.nivel_riesgo}`);
    else fail('Score MEDIO para OFAC SDN', app, 'nivel_riesgo=MEDIO, score>=40');
  } else {
    fail('Crear expediente OFAC', { status, body }, 201);
  }
}
{
  // País restringido (Venezuela = VE) → MEDIO
  const { status } = await crearExpediente({ pasaporte: 'CA04VTEST', nacionalidad: 'VE', vencimiento: '2028-01-01' });
  if (status === 201) {
    const apps = await req('/applications', { headers: { Authorization: `Bearer ${tokenAdmin}` } });
    const app = apps.body.find(a => a.numero_pasaporte === 'CA04VTEST');
    if (app && app.nivel_riesgo === 'MEDIO') ok(`Score MEDIO por país restringido (VE): ${app.nivel_riesgo}`);
    else fail('Score MEDIO para país restringido', app?.nivel_riesgo, 'MEDIO');
  }
}

// ─── CA-05: Consulta estado pública ────────────────────────────────────────
console.log('\n--- CA-05: Consulta estado pública ---');
{
  // Crear expediente y luego consultar su estado
  const { status, body } = await crearExpediente({ pasaporte: 'CA05TESTPP' });
  if (status === 201) {
    const ticket = body.ticket_number;
    const r = await req(`/applications/status?pasaporte=CA05TESTPP&ticket=${ticket}`);
    if (r.status === 200 && r.body.ticket_number === ticket) ok(`Consulta estado pública: ${r.body.estado}`);
    else fail('Consulta estado pública', r, '200 con ticket');
  }
}

// ─── CA-07: Apertura de expediente cambia estado PENDIENTE → EN_EVALUACION ─
console.log('\n--- CA-07: Cambio estado al abrir expediente ---');
let testAppId = null;
let testTicket = null;
{
  const { status, body } = await crearExpediente({ pasaporte: 'CA07TESTPP' });
  if (status === 201) {
    testTicket = body.ticket_number;
    // Buscar ID del expediente
    const apps = await req('/applications', { headers: { Authorization: `Bearer ${tokenAgente}` } });
    const app = apps.body.find(a => a.ticket_number === testTicket);
    testAppId = app?.id;
    if (!testAppId) { fail('Obtener ID de expediente creado', apps.body.length, '>0'); }
    else {
      // Abrir el expediente
      const detail = await req(`/applications/${testAppId}`, { headers: { Authorization: `Bearer ${tokenAgente}` } });
      if (detail.status === 200 && detail.body.estado === 'EN_EVALUACION') ok('Apertura cambia PENDIENTE → EN_EVALUACION');
      else fail('Apertura cambia estado a EN_EVALUACION', detail.body.estado, 'EN_EVALUACION');
    }
  }
}

// ─── CA-08: Dictamen con justificación < 20 chars → 422 ───────────────────
console.log('\n--- CA-08: Validación dictamen ---');
{
  if (testAppId) {
    const r = await req(`/applications/${testAppId}/verdict`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAgente}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision: 'RECHAZADO', articulo_citado: 'Art. 50 Num. 4 DL3/2008', justificacion: 'Muy corto' }),
    });
    if (r.status === 422) ok('Rechaza justificación < 20 caracteres (422)');
    else fail('Rechaza justificación corta', r, { status: 422 });
  } else {
    fail('CA-08 sin testAppId', null, 'app creada en CA-07');
  }
}

// ─── CA-09: Dictamen RECHAZADO válido ────────────────────────────────────────
console.log('\n--- CA-09: Dictamen RECHAZADO con justificación válida ---');
{
  if (testAppId) {
    const r = await req(`/applications/${testAppId}/verdict`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAgente}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        decision: 'RECHAZADO',
        articulo_citado: 'Art. 50 Num. 4 DL3/2008',
        justificacion: 'Antecedentes penales internacionales verificados en base INTERPOL. Riesgo confirmado.',
      }),
    });
    if (r.status === 200 || r.status === 201) ok(`Dictamen RECHAZADO emitido: ${JSON.stringify(r.body)}`);
    else fail('Dictamen RECHAZADO válido', r, 200);
  }
}

// ─── CA-09b: Dictamen APROBADO ───────────────────────────────────────────────
console.log('\n--- CA-09b: Dictamen APROBADO ---');
let approvedAppId = null;
{
  const { status, body } = await crearExpediente({ pasaporte: 'CA09APPROVEPP' });
  if (status === 201) {
    const apps = await req('/applications', { headers: { Authorization: `Bearer ${tokenAgente}` } });
    const app = apps.body.find(a => a.ticket_number === body.ticket_number);
    approvedAppId = app?.id;
    if (approvedAppId) {
      // Abrir primero
      await req(`/applications/${approvedAppId}`, { headers: { Authorization: `Bearer ${tokenAgente}` } });
      const r = await req(`/applications/${approvedAppId}/verdict`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenAgente}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'APROBADO',
          articulo_citado: 'Art. 28 DL3/2008',
          justificacion: 'Documentación en regla. No se encontraron alertas en listas INTERPOL ni OFAC. Monto de subsistencia suficiente.',
        }),
      });
      if (r.status === 200 || r.status === 201) ok('Dictamen APROBADO emitido correctamente');
      else fail('Dictamen APROBADO', r, 200);
    }
  }
}

// ─── CA-10: Consulta estado muestra artículo_citado cuando RECHAZADO ──────
console.log('\n--- CA-10: artículo_citado en estado RECHAZADO ---');
{
  if (testTicket) {
    const r = await req(`/applications/status?pasaporte=CA07TESTPP&ticket=${testTicket}`);
    if (r.status === 200 && r.body.articulo_citado) ok(`articulo_citado presente: "${r.body.articulo_citado}"`);
    else fail('articulo_citado en estado RECHAZADO', r.body, 'campo articulo_citado presente');
  }
}

// ─── CA-06: Rate limiting (3 fallos → bloquear IP) — se corre al final para no bloquear otros tests
console.log('\n--- CA-06: Rate limiting ---');
{
  const uniq = 'RLTESTCA06' + Date.now().toString().slice(-6);
  const results = [];
  for (let i = 0; i < 4; i++) {
    const r = await req(`/applications/status?pasaporte=${uniq}&ticket=PAN-2026-XXXXX`);
    results.push(r.status);
  }
  if (results[3] === 429) ok(`Rate limit: 3 fallos → 4.º intento bloqueado (429) [${results.join(',')}]`);
  else fail('Rate limit bloqueó tras 3 intentos', results, '[404,404,404,429]');
}

// ─── CA-11: Asignación de agente (ADMIN) ─────────────────────────────────
console.log('\n--- CA-11: Asignación de agente por ADMIN ---');
{
  const { status: cs, body: cb } = await crearExpediente({ pasaporte: 'CA11TESTPP' });
  if (cs === 201) {
    const apps = await req('/applications', { headers: { Authorization: `Bearer ${tokenAdmin}` } });
    const app = apps.body.find(a => a.ticket_number === cb.ticket_number);
    if (app) {
      // Obtener lista de agentes
      const agentes = await req('/agentes', { headers: { Authorization: `Bearer ${tokenAdmin}` } });
      const agente = agentes.body[0];
      if (agente) {
        const r = await req(`/applications/${app.id}/assign`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${tokenAdmin}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ agente_id: agente.id }),
        });
        if (r.status === 200) ok(`Asignación exitosa a ${agente.nombre_completo}`);
        else fail('Asignación de agente', r, 200);
      }
    }
  }
}

// ─── CA-12: Agente NO puede asignar (solo ADMIN) ──────────────────────────
console.log('\n--- CA-12: Protección de rol en asignación ---');
{
  const r = await req('/applications/some-fake-id/assign', {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${tokenAgente}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ agente_id: 'fake' }),
  });
  if (r.status === 403) ok('Agente recibe 403 al intentar asignar');
  else fail('Protección de rol ADMIN-only en /assign', r.status, 403);
}

// ─── CA-12b: Sin token → 401 en endpoints protegidos ──────────────────────
console.log('\n--- CA-12b: Autenticación requerida ---');
{
  const r = await req('/applications');
  if (r.status === 401) ok('Sin token → 401 en GET /applications');
  else fail('Autenticación requerida', r.status, 401);
}

// ─── CA-13: Lista de agentes solo para ADMIN ──────────────────────────────
console.log('\n--- CA-13: GET /agentes protegido ---');
{
  const r = await req('/agentes', { headers: { Authorization: `Bearer ${tokenAgente}` } });
  if (r.status === 403) ok('Agente recibe 403 en GET /agentes (ADMIN only)');
  else fail('GET /agentes debe ser ADMIN-only', r.status, 403);
}
{
  const r = await req('/agentes', { headers: { Authorization: `Bearer ${tokenAdmin}` } });
  if (r.status === 200 && Array.isArray(r.body) && r.body.length > 0) ok(`GET /agentes retorna ${r.body.length} agentes para ADMIN`);
  else fail('GET /agentes para ADMIN', r, '200 con array');
}

// ─────────────────────────────────────────────────────────────────────────────
console.log('\n═══════════════════════════════════════');
console.log(`Resultado: ${PASS} ✅  |  ${FAIL} ❌  |  Total: ${PASS + FAIL}`);
console.log('═══════════════════════════════════════\n');
if (FAIL > 0) process.exit(1);
