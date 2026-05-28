import type { Expediente, DocumentoAdjunto } from '../types/application.types';

const pdfDoc = (id: string, nombre: string): DocumentoAdjunto => ({
  id,
  tipo: 'SOLVENCIA',
  nombre,
  url: `https://mock.sidem.local/docs/${id}.pdf`,
  size: 524288,
});

const antecedentesDoc = (id: string, nombre: string): DocumentoAdjunto => ({
  id,
  tipo: 'ANTECEDENTES',
  nombre,
  url: `https://mock.sidem.local/docs/${id}.pdf`,
  size: 734003,
});

export const expedienteAltoMock: Expediente = {
  id: 'exp_001',
  ticket_number: 'PAN-2026-00042',
  nombres: 'Carlos',
  apellidos: 'Alvarez',
  nacionalidad: 'CO',
  numero_pasaporte: 'PA1234567',
  categoria_migratoria: 'TURISMO',
  fecha_registro: '2026-05-20T15:10:00Z',
  score_riesgo: 60,
  nivel_riesgo: 'ALTO',
  estado: 'EN_REVISION',
  interpol_alerta_encontrada: true,
  interpol_alerta_tipo: 'INTERPOL_RED_NOTICE',
  interpol_alerta_detalle: 'Red Notice activa por fraude internacional',
  documentos: [
    pdfDoc('doc_001', 'solvencia_carlos.pdf'),
    antecedentesDoc('doc_002', 'antecedentes_carlos.pdf'),
  ],
};

export const expedienteBajoMock: Expediente = {
  id: 'exp_002',
  ticket_number: 'PAN-2026-00043',
  nombres: 'Maria',
  apellidos: 'Garcia',
  nacionalidad: 'ES',
  numero_pasaporte: 'ES998877',
  categoria_migratoria: 'ESTUDIO',
  fecha_registro: '2026-05-21T10:45:00Z',
  score_riesgo: 0,
  nivel_riesgo: 'BAJO',
  estado: 'PENDIENTE',
  interpol_alerta_encontrada: false,
  interpol_alerta_tipo: null,
  interpol_alerta_detalle: null,
  documentos: [
    pdfDoc('doc_003', 'solvencia_maria.pdf'),
    antecedentesDoc('doc_004', 'antecedentes_maria.pdf'),
  ],
};

export const applicationsMock: Expediente[] = [expedienteAltoMock, expedienteBajoMock];
